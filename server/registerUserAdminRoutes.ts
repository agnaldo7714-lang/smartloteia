import type { Express, NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { ZodError, z } from "zod";
import type { UserRole } from "@shared/schema";
import { pool } from "./db";
import { hashPassword } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
  }
}

const userCreateSchema = z.object({
  name: z.string().min(3, "Informe o nome do usuário"),
  username: z.string().min(3, "Informe o login do usuário"),
  email: z.string().email("Informe um e-mail válido"),
  role: z.enum(["admin", "manager", "broker", "financial"]),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  isActive: z.boolean().optional().default(true),
  billingEntityId: z.string().optional().nullable(),
  developmentId: z.string().optional().nullable(),
});

const userUpdateSchema = z.object({
  name: z.string().min(3, "Informe o nome do usuário"),
  username: z.string().min(3, "Informe o login do usuário"),
  email: z.string().email("Informe um e-mail válido"),
  role: z.enum(["admin", "manager", "broker", "financial"]),
  isActive: z.boolean().optional().default(true),
  billingEntityId: z.string().optional().nullable(),
  developmentId: z.string().optional().nullable(),
});

const userPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
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

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function resolveUserScope(input: {
  role: UserRole;
  billingEntityId?: string | null;
  developmentId?: string | null;
}) {
  if (!pool) {
    return {
      billingEntityId: input.billingEntityId ?? null,
      developmentId: input.developmentId ?? null,
      developmentName: null,
    };
  }

  if (input.role === "admin") {
    return {
      billingEntityId: null,
      developmentId: null,
      developmentName: null,
    };
  }

  if (input.role === "manager" && !input.developmentId) {
    throw new Error("Selecione o empreendimento do administrador.");
  }

  if (!input.developmentId) {
    return {
      billingEntityId: input.billingEntityId ?? null,
      developmentId: null,
      developmentName: null,
    };
  }

  const developmentResult = await pool.query(
    `
      SELECT id, billing_entity_id, name
      FROM public_developments
      WHERE id = $1
      LIMIT 1
    `,
    [input.developmentId],
  );

  const development = developmentResult.rows[0];
  if (!development) {
    throw new Error("Empreendimento vinculado não encontrado.");
  }

  return {
    billingEntityId:
      input.billingEntityId ?? development.billing_entity_id ?? null,
    developmentId: String(development.id),
    developmentName: String(development.name),
  };
}

async function autoDeactivateBootstrapAdmins() {
  if (!pool) return;

  await pool.query(
    `
      UPDATE users
      SET
        is_active = FALSE,
        updated_at = NOW()
      WHERE is_bootstrap = TRUE
    `,
  );
}

export function registerUserAdminRoutes(app: Express) {
  app.get(
    "/api/admin/users",
    requireAuth,
    requireRoles("admin"),
    async (_req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const result = await pool!.query(`
          SELECT
            u.id,
            u.name,
            u.username,
            u.email,
            u.role,
            u.is_active,
            u.is_bootstrap,
            u.billing_entity_id,
            u.development_id,
            u.created_at,
            u.updated_at,
            be.corporate_name AS billing_entity_name,
            pd.name AS development_name
          FROM users u
          LEFT JOIN billing_entities be ON be.id = u.billing_entity_id
          LEFT JOIN public_developments pd ON pd.id = u.development_id
          ORDER BY u.role ASC, u.name ASC
        `);

        return res.status(200).json(
          result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            username: row.username,
            email: row.email,
            role: row.role,
            isActive: Boolean(row.is_active),
            isBootstrap: Boolean(row.is_bootstrap),
            billingEntityId: row.billing_entity_id,
            billingEntityName: row.billing_entity_name,
            developmentId: row.development_id,
            developmentName: row.development_name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })),
        );
      } catch {
        return res.status(500).json({
          message: "Não foi possível carregar os usuários",
        });
      }
    },
  );

  app.post(
    "/api/admin/users",
    requireAuth,
    requireRoles("admin"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const payload = userCreateSchema.parse(req.body);
        const username = normalizeUsername(payload.username);
        const email = normalizeEmail(payload.email);

        const existing = await pool!.query(
          `
            SELECT id
            FROM users
            WHERE LOWER(username) = $1 OR LOWER(email) = $2
            LIMIT 1
          `,
          [username, email],
        );

        if (existing.rowCount) {
          return res.status(400).json({
            message: "Já existe um usuário com este login ou e-mail.",
          });
        }

        const scope = await resolveUserScope({
          role: payload.role,
          billingEntityId: payload.billingEntityId,
          developmentId: payload.developmentId,
        });

        const id = randomUUID();
        await pool!.query(
          `
            INSERT INTO users (
              id,
              name,
              username,
              email,
              role,
              password_hash,
              is_active,
              is_bootstrap,
              billing_entity_id,
              development_id,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9, NOW(), NOW())
          `,
          [
            id,
            payload.name.trim(),
            username,
            email,
            payload.role,
            hashPassword(payload.password),
            payload.isActive ?? true,
            scope.billingEntityId,
            scope.developmentId,
          ],
        );

        if (payload.role === "admin") {
          await autoDeactivateBootstrapAdmins();
        }

        return res.status(201).json({
          success: true,
          id,
          message:
            payload.role === "admin"
              ? "Administrador master criado com sucesso. O usuário bootstrap foi desativado."
              : "Usuário cadastrado com sucesso.",
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível cadastrar o usuário",
        });
      }
    },
  );

  app.patch(
    "/api/admin/users/:id",
    requireAuth,
    requireRoles("admin"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const { id } = req.params;
        const payload = userUpdateSchema.parse(req.body);
        const username = normalizeUsername(payload.username);
        const email = normalizeEmail(payload.email);

        const duplicate = await pool!.query(
          `
            SELECT id
            FROM users
            WHERE id <> $1
              AND (LOWER(username) = $2 OR LOWER(email) = $3)
            LIMIT 1
          `,
          [id, username, email],
        );

        if (duplicate.rowCount) {
          return res.status(400).json({
            message: "Já existe outro usuário com este login ou e-mail.",
          });
        }

        const existing = await pool!.query(
          `SELECT id, is_bootstrap FROM users WHERE id = $1 LIMIT 1`,
          [id],
        );

        if (!existing.rowCount) {
          return res.status(404).json({ message: "Usuário não encontrado." });
        }

        const scope = await resolveUserScope({
          role: payload.role,
          billingEntityId: payload.billingEntityId,
          developmentId: payload.developmentId,
        });

        await pool!.query(
          `
            UPDATE users
            SET
              name = $2,
              username = $3,
              email = $4,
              role = $5,
              is_active = $6,
              billing_entity_id = $7,
              development_id = $8,
              updated_at = NOW()
            WHERE id = $1
          `,
          [
            id,
            payload.name.trim(),
            username,
            email,
            payload.role,
            payload.isActive ?? true,
            scope.billingEntityId,
            scope.developmentId,
          ],
        );

        if (payload.role === "admin" && !existing.rows[0]?.is_bootstrap) {
          await autoDeactivateBootstrapAdmins();
        }

        return res.status(200).json({
          success: true,
          message: "Usuário atualizado com sucesso.",
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível atualizar o usuário",
        });
      }
    },
  );

  app.patch(
    "/api/admin/users/:id/password",
    requireAuth,
    requireRoles("admin"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const { id } = req.params;
        const payload = userPasswordSchema.parse(req.body);

        const result = await pool!.query(
          `
            UPDATE users
            SET
              password_hash = $2,
              updated_at = NOW()
            WHERE id = $1
            RETURNING id
          `,
          [id, hashPassword(payload.password)],
        );

        if (!result.rowCount) {
          return res.status(404).json({ message: "Usuário não encontrado." });
        }

        return res.status(200).json({
          success: true,
          message: "Senha atualizada com sucesso.",
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível atualizar a senha",
        });
      }
    },
  );
}
