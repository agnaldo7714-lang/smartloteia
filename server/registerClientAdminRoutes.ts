import type { Express, NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { ZodError, z } from "zod";
import type { UserRole } from "@shared/schema";
import { pool } from "./db";
import {
  appendBillingEntityScope,
  ensureCanAccessDevelopmentAsync,
  getRequestScope,
  getScopedDevelopmentIds,
  requireScopedUser,
} from "./accessScope";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
  }
}

const clientAdminSchema = z.object({
  fullName: z.string().min(3, "Informe o nome do cliente"),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  profileNotes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
  status: z.enum(["lead", "active", "inactive"]).optional().default("active"),
  brokerId: z.string().optional().nullable(),
  assignedBroker: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  return next();
}

function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.userRole) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Sem permissão para esta ação" });
    }

    return next();
  };
}

function requireDatabase(res: Response): boolean {
  if (!pool) {
    res.status(503).json({
      message: "Banco de dados não configurado ou indisponível",
    });
    return false;
  }

  return true;
}

async function getScopedDevelopmentInfo(
  requestedProjectId: string | null | undefined,
  scope: Awaited<ReturnType<typeof getRequestScope>>,
) {
  if (!scope || !pool) return null;

  if (scope.isAdmin) {
    if (!requestedProjectId) {
      return { projectId: null, projectName: null };
    }

    const result = await pool.query(
      `
        SELECT id, name
        FROM public_developments
        WHERE id = $1
        LIMIT 1
      `,
      [requestedProjectId],
    );

    if (!result.rows[0]) {
      return null;
    }

    return {
      projectId: String(result.rows[0].id),
      projectName: String(result.rows[0].name),
    };
  }

  const scopedDevelopmentIds = await getScopedDevelopmentIds(scope);
  const onlyDevelopmentId =
    scope.developmentId ??
    (scopedDevelopmentIds && scopedDevelopmentIds.length === 1
      ? scopedDevelopmentIds[0]
      : null);

  const finalProjectId = requestedProjectId || onlyDevelopmentId;

  if (!finalProjectId) {
    return null;
  }

  const canAccess = await ensureCanAccessDevelopmentAsync(scope, finalProjectId);
  if (!canAccess) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT id, name
      FROM public_developments
      WHERE id = $1
      LIMIT 1
    `,
    [finalProjectId],
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    projectId: String(result.rows[0].id),
    projectName: String(result.rows[0].name),
  };
}

async function validateBrokerScope(
  brokerId: string | null | undefined,
  scope: Awaited<ReturnType<typeof getRequestScope>>,
): Promise<boolean> {
  if (!brokerId || !scope || !pool) return true;
  if (scope.isAdmin) return true;

  const brokerResult = await pool.query(
    `
      SELECT id, billing_entity_id
      FROM brokers
      WHERE id = $1
      LIMIT 1
    `,
    [brokerId],
  );

  const broker = brokerResult.rows[0];
  if (!broker) return false;

  const brokerBillingEntityId = broker.billing_entity_id
    ? String(broker.billing_entity_id)
    : null;

  if (scope.billingEntityId) {
    return brokerBillingEntityId === scope.billingEntityId;
  }

  const developmentIds = await getScopedDevelopmentIds(scope);
  if (!developmentIds || developmentIds.length === 0) return false;

  const allowedEntitiesResult = await pool.query(
    `
      SELECT DISTINCT billing_entity_id
      FROM public_developments
      WHERE id = ANY($1::text[])
        AND billing_entity_id IS NOT NULL
    `,
    [developmentIds],
  );

  const allowedBillingEntityIds = allowedEntitiesResult.rows
    .map((row) => row.billing_entity_id)
    .filter(Boolean)
    .map((value) => String(value));

  return (
    !!brokerBillingEntityId &&
    allowedBillingEntityIds.includes(brokerBillingEntityId)
  );
}

async function getScopedClient(
  clientId: string,
  scope: Awaited<ReturnType<typeof getRequestScope>>,
) {
  if (!pool || !scope) return null;

  const params: any[] = [clientId];
  const where = [`c.id = $1`];

  await appendDevelopmentScope(scope, params, where, "c.project_id");

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.full_name,
        c.phone,
        c.email,
        c.city,
        c.objective,
        c.budget_range,
        c.timeline,
        c.profile_notes,
        c.source,
        c.project_id,
        c.project_name,
        c.status,
        c.assigned_broker,
        c.broker_id,
        c.notes
      FROM clients c
      WHERE ${where.join(" AND ")}
      LIMIT 1
    `,
    params,
  );

  return result.rows[0] ?? null;
}

export function registerClientAdminRoutes(app: Express) {
  app.post(
    "/api/admin/clients",
    requireAuth,
    requireRoles("admin", "manager"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const payload = clientAdminSchema.parse(req.body);

        const projectInfo = await getScopedDevelopmentInfo(
          payload.projectId ?? null,
          scope,
        );

        if (!scope.isAdmin && !projectInfo?.projectId) {
          return res.status(403).json({
            message:
              "O gestor precisa estar vinculado a um empreendimento para cadastrar clientes.",
          });
        }

        if (payload.projectId && !projectInfo) {
          return res.status(403).json({
            message:
              "Você não tem permissão para cadastrar clientes neste empreendimento.",
          });
        }

        const brokerAllowed = await validateBrokerScope(
          payload.brokerId ?? null,
          scope,
        );

        if (!brokerAllowed) {
          return res.status(403).json({
            message:
              "O corretor informado não pertence ao escopo permitido deste usuário.",
          });
        }

        const id = randomUUID();

        await pool!.query(
          `
            INSERT INTO clients (
              id,
              full_name,
              phone,
              email,
              city,
              objective,
              budget_range,
              timeline,
              profile_notes,
              source,
              project_id,
              project_name,
              status,
              broker_id,
              assigned_broker,
              notes
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            )
          `,
          [
            id,
            payload.fullName,
            payload.phone ?? null,
            payload.email ?? null,
            payload.city ?? null,
            payload.objective ?? null,
            payload.budgetRange ?? null,
            payload.timeline ?? null,
            payload.profileNotes ?? null,
            payload.source ?? "manual",
            projectInfo?.projectId ?? payload.projectId ?? null,
            projectInfo?.projectName ?? payload.projectName ?? null,
            payload.status ?? "active",
            payload.brokerId ?? null,
            payload.assignedBroker ?? null,
            payload.notes ?? null,
          ],
        );

        return res.status(201).json({
          success: true,
          id,
          message: "Cliente cadastrado com sucesso",
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message: "Não foi possível cadastrar o cliente",
        });
      }
    },
  );

  app.put(
    "/api/admin/clients/:id",
    requireAuth,
    requireRoles("admin", "manager"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const existingClient = await getScopedClient(req.params.id, scope);

        if (!existingClient) {
          return res.status(404).json({
            message: "Cliente não encontrado dentro do escopo do usuário.",
          });
        }

        const payload = clientAdminSchema.parse(req.body);

        const requestedProjectId =
          payload.projectId ?? existingClient.project_id ?? null;

        const projectInfo = await getScopedDevelopmentInfo(
          requestedProjectId,
          scope,
        );

        if (!scope.isAdmin && !projectInfo?.projectId) {
          return res.status(403).json({
            message:
              "Você não tem permissão para mover ou editar este cliente fora do seu empreendimento.",
          });
        }

        if (requestedProjectId && !projectInfo) {
          return res.status(403).json({
            message:
              "Você não tem permissão para vincular este cliente a esse empreendimento.",
          });
        }

        const brokerAllowed = await validateBrokerScope(
          payload.brokerId ?? null,
          scope,
        );

        if (!brokerAllowed) {
          return res.status(403).json({
            message:
              "O corretor informado não pertence ao escopo permitido deste usuário.",
          });
        }

        const result = await pool!.query(
          `
            UPDATE clients
            SET
              full_name = $2,
              phone = $3,
              email = $4,
              city = $5,
              objective = $6,
              budget_range = $7,
              timeline = $8,
              profile_notes = $9,
              source = $10,
              project_id = $11,
              project_name = $12,
              status = $13,
              broker_id = $14,
              assigned_broker = $15,
              notes = $16,
              updated_at = NOW()
            WHERE id = $1
            RETURNING id
          `,
          [
            req.params.id,
            payload.fullName,
            payload.phone ?? null,
            payload.email ?? null,
            payload.city ?? null,
            payload.objective ?? null,
            payload.budgetRange ?? null,
            payload.timeline ?? null,
            payload.profileNotes ?? null,
            payload.source ?? "manual",
            projectInfo?.projectId ?? requestedProjectId ?? null,
            projectInfo?.projectName ??
              payload.projectName ??
              existingClient.project_name ??
              null,
            payload.status ?? "active",
            payload.brokerId ?? null,
            payload.assignedBroker ?? null,
            payload.notes ?? null,
          ],
        );

        if (!result.rows[0]) {
          return res.status(404).json({ message: "Cliente não encontrado" });
        }

        return res.status(200).json({
          success: true,
          message: "Cliente atualizado com sucesso",
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message: "Não foi possível atualizar o cliente",
        });
      }
    },
  );

  app.delete(
    "/api/admin/clients/:id",
    requireAuth,
    requireRoles("admin", "manager"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const clientId = req.params.id;
        const existingClient = await getScopedClient(clientId, scope);

        if (!existingClient) {
          return res.status(404).json({
            message: "Cliente não encontrado dentro do escopo do usuário.",
          });
        }

        const linkedSales = await pool!.query(
          `
            SELECT COUNT(*)::int AS total
            FROM sales
            WHERE client_id = $1
          `,
          [clientId],
        );

        const totalLinkedSales = linkedSales.rows[0]?.total ?? 0;

        if (totalLinkedSales > 0) {
          const inactivateResult = await pool!.query(
            `
              UPDATE clients
              SET
                status = 'inactive',
                updated_at = NOW()
              WHERE id = $1
              RETURNING id
            `,
            [clientId],
          );

          if (!inactivateResult.rows[0]) {
            return res.status(404).json({ message: "Cliente não encontrado" });
          }

          return res.status(200).json({
            success: true,
            inactivated: true,
            message:
              "Cliente possui histórico vinculado e foi inativado em vez de excluído",
          });
        }

        const result = await pool!.query(
          `
            DELETE FROM clients
            WHERE id = $1
            RETURNING id
          `,
          [clientId],
        );

        if (!result.rows[0]) {
          return res.status(404).json({ message: "Cliente não encontrado" });
        }

        return res.status(200).json({
          success: true,
          deleted: true,
          message: "Cliente excluído com sucesso",
        });
      } catch {
        return res.status(500).json({
          message: "Não foi possível excluir o cliente",
        });
      }
    },
  );

  app.delete(
    "/api/admin/clients/purge/inactive",
    requireAuth,
    requireRoles("admin", "manager"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const params: any[] = [];
        const where = [
          `c.status = 'inactive'`,
          `NOT EXISTS (
            SELECT 1
            FROM sales s
            WHERE s.client_id = c.id
          )`,
        ];

        await appendDevelopmentScope(scope, params, where, "c.project_id");

        const result = await pool!.query(
          `
            DELETE FROM clients c
            WHERE ${where.join(" AND ")}
            RETURNING id
          `,
          params,
        );

        return res.status(200).json({
          success: true,
          deletedCount: result.rowCount ?? 0,
          message: "Limpeza de clientes inativos concluída",
        });
      } catch {
        return res.status(500).json({
          message: "Não foi possível limpar os clientes inativos",
        });
      }
    },
  );

  app.get(
    "/api/admin/clients/scoped-summary",
    requireAuth,
    requireRoles("admin", "manager"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const params: any[] = [];
        const where: string[] = [];

        await appendDevelopmentScope(scope, params, where, "c.project_id");

        const result = await pool!.query(
          `
            SELECT
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE c.status = 'lead')::int AS leads,
              COUNT(*) FILTER (WHERE c.status = 'active')::int AS active,
              COUNT(*) FILTER (WHERE c.status = 'inactive')::int AS inactive
            FROM clients c
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
          `,
          params,
        );

        return res.status(200).json(
          result.rows[0] ?? {
            total: 0,
            leads: 0,
            active: 0,
            inactive: 0,
          },
        );
      } catch {
        return res.status(500).json({
          message: "Não foi possível obter o resumo de clientes.",
        });
      }
    },
  );

  app.get(
    "/api/admin/clients/scoped-brokers",
    requireAuth,
    requireRoles("admin", "manager"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const params: any[] = [];
        const where: string[] = ["b.is_active = TRUE"];

        await appendBillingEntityScope(scope, params, where, "b.billing_entity_id");

        const result = await pool!.query(
          `
            SELECT
              b.id,
              b.name,
              b.email,
              b.phone,
              b.creci,
              b.billing_entity_id AS "billingEntityId"
            FROM brokers b
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
            ORDER BY b.name ASC
          `,
          params,
        );

        return res.status(200).json(result.rows);
      } catch {
        return res.status(500).json({
          message: "Não foi possível listar os corretores do escopo.",
        });
      }
    },
  );
}