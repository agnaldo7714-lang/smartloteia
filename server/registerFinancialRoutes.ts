import type { Express, NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { ZodError, z } from "zod";
import type { UserRole } from "@shared/schema";
import { pool } from "./db";
import {
  appendDevelopmentScope,
  ensureCanAccessDevelopmentAsync,
  requireScopedUser,
} from "./accessScope";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
  }
}

type PgClient = {
  query: (text: string, params?: any[]) => Promise<any>;
};

const generateFinancialSchema = z.object({
  firstDueDate: z.string().optional().nullable(),
  installmentsCount: z.number().int().positive().optional().nullable(),
  installmentValue: z.number().positive().optional().nullable(),
  billingType: z.enum(["boleto", "carne", "pix", "outro"]).default("boleto"),
  replaceExisting: z.boolean().default(false),
});

const chargesSchema = z.object({
  discountValue: z.number().min(0).default(0),
  otherDeductionsValue: z.number().min(0).default(0),
  fineValue: z.number().min(0).default(0),
  otherAdditionsValue: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

const payInstallmentSchema = z.object({
  discountValue: z.number().min(0).default(0),
  otherDeductionsValue: z.number().min(0).default(0),
  fineValue: z.number().min(0).default(0),
  otherAdditionsValue: z.number().min(0).default(0),
  paidValue: z.number().min(0.01, "Informe um valor pago"),
  paymentDate: z.string().min(8, "Informe a data de pagamento"),
  paymentMethod: z.string().min(1, "Informe a forma de pagamento"),
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

function normalizeDateValue(value?: string | null) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function addMonths(dateValue: string, months: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  const day = date.getDate();
  date.setMonth(date.getMonth() + months);

  if (date.getDate() !== day) {
    date.setDate(0);
  }

  return date.toISOString().slice(0, 10);
}

function toMoney(value: number | null | undefined) {
  return Number((Number(value || 0) + Number.EPSILON).toFixed(2));
}

function calculateInstallmentTotal(input: {
  nominalValue: number;
  discountValue: number;
  otherDeductionsValue: number;
  fineValue: number;
  otherAdditionsValue: number;
}) {
  return toMoney(
    Number(input.nominalValue || 0) -
      Number(input.discountValue || 0) -
      Number(input.otherDeductionsValue || 0) +
      Number(input.fineValue || 0) +
      Number(input.otherAdditionsValue || 0),
  );
}

async function ensureFinancialTables() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS financial_receivables (
      id VARCHAR(36) PRIMARY KEY,
      sale_id VARCHAR(36) NOT NULL,
      client_id VARCHAR(36),
      client_name TEXT NOT NULL,
      development_id VARCHAR(36),
      development_name TEXT,
      lot_id VARCHAR(36),
      lot_code TEXT,
      billing_entity_id VARCHAR(36),
      billing_entity_name TEXT,
      contract_number TEXT NOT NULL,
      billing_type VARCHAR(20) NOT NULL DEFAULT 'boleto',
      total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      entry_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      financed_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      installments_count INTEGER NOT NULL DEFAULT 1,
      first_due_date DATE,
      day_of_month INTEGER,
      status VARCHAR(20) NOT NULL DEFAULT 'aberto',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS financial_installments (
      id VARCHAR(36) PRIMARY KEY,
      receivable_id VARCHAR(36) NOT NULL,
      sale_id VARCHAR(36) NOT NULL,
      client_id VARCHAR(36),
      client_name TEXT NOT NULL,
      billing_entity_id VARCHAR(36),
      billing_entity_name TEXT,
      contract_number TEXT NOT NULL,
      installment_number INTEGER NOT NULL,
      installment_label TEXT NOT NULL,
      due_date DATE NOT NULL,
      nominal_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      discount_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      other_deductions_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      fine_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      other_additions_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      paid_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      total_due NUMERIC(14,2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'aberta',
      payment_date DATE,
      payment_method TEXT,
      notes TEXT,
      boleto_url TEXT,
      linha_digitavel TEXT,
      barcode TEXT,
      nosso_numero TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS financial_collection_events (
      id VARCHAR(36) PRIMARY KEY,
      receivable_id VARCHAR(36),
      installment_id VARCHAR(36),
      event_type TEXT NOT NULL,
      user_id VARCHAR(36),
      description TEXT,
      metadata_json JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const alterStatements = [
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS client_id VARCHAR(36)`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS client_name TEXT`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS development_id VARCHAR(36)`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS development_name TEXT`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS lot_id VARCHAR(36)`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS lot_code TEXT`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS billing_entity_id VARCHAR(36)`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS billing_entity_name TEXT`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS contract_number TEXT`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) NOT NULL DEFAULT 'boleto'`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS entry_amount NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS financed_amount NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS installments_count INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS first_due_date DATE`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS day_of_month INTEGER`,
    `ALTER TABLE financial_receivables ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'aberto'`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS sale_id VARCHAR(36)`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS client_id VARCHAR(36)`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS client_name TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS billing_entity_id VARCHAR(36)`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS billing_entity_name TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS contract_number TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS installment_number INTEGER`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS installment_label TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS due_date DATE`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS nominal_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS discount_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS other_deductions_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS fine_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS other_additions_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS paid_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS total_due NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'aberta'`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS payment_date DATE`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS payment_method TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS boleto_url TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS linha_digitavel TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS barcode TEXT`,
    `ALTER TABLE financial_installments ADD COLUMN IF NOT EXISTS nosso_numero TEXT`,
    `ALTER TABLE financial_collection_events ADD COLUMN IF NOT EXISTS receivable_id VARCHAR(36)`,
    `ALTER TABLE financial_collection_events ADD COLUMN IF NOT EXISTS installment_id VARCHAR(36)`,
    `ALTER TABLE financial_collection_EVENTS ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)`,
    `ALTER TABLE financial_collection_events ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE financial_collection_events ADD COLUMN IF NOT EXISTS metadata_json JSONB`,
  ];

  for (const statement of alterStatements) {
    await pool.query(statement);
  }
}

async function recordCollectionEvent(
  client: PgClient,
  input: {
    receivableId?: string | null;
    installmentId?: string | null;
    eventType: string;
    userId?: string | null;
    description?: string | null;
    metadata?: Record<string, any> | null;
  },
) {
  await client.query(
    `
      INSERT INTO financial_collection_events (
        id,
        receivable_id,
        installment_id,
        event_type,
        user_id,
        description,
        metadata_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      randomUUID(),
      input.receivableId ?? null,
      input.installmentId ?? null,
      input.eventType,
      input.userId ?? null,
      input.description ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

async function refreshReceivableStatus(client: PgClient, receivableId: string) {
  const result = await client.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'paga')::int AS paid,
        COUNT(*) FILTER (WHERE status = 'cancelada')::int AS cancelled,
        COUNT(*) FILTER (WHERE status = 'atrasada')::int AS overdue
      FROM financial_installments
      WHERE receivable_id = $1
    `,
    [receivableId],
  );

  const row = result.rows[0] ?? {
    total: 0,
    paid: 0,
    cancelled: 0,
    overdue: 0,
  };

  let status = "aberto";

  if (row.total > 0 && row.cancelled === row.total) {
    status = "cancelado";
  } else if (row.total > 0 && row.paid + row.cancelled === row.total) {
    status = "quitado";
  } else if (row.paid > 0) {
    status = "parcial";
  } else if (row.overdue > 0) {
    status = "atrasado";
  }

  await client.query(
    `
      UPDATE financial_receivables
      SET status = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [receivableId, status],
  );
}

async function getScopedSale(
  saleId: string,
  scope: Awaited<ReturnType<typeof requireScopedUser>>,
) {
  if (!pool || !scope) return null;

  const params: any[] = [saleId];
  const where = [`s.id = $1`];

  await appendDevelopmentScope(scope, params, where, "s.development_id");

  const result = await pool.query(
    `
      SELECT
        s.id,
        s.contract_number AS "contractNumber",
        s.client_id AS "clientId",
        COALESCE(s.client_name, c.full_name) AS "clientName",
        s.development_id AS "developmentId",
        COALESCE(s.development_name, d.name) AS "developmentName",
        s.lot_id AS "lotId",
        s.lot_code AS "lotCode",
        s.billing_entity_id AS "billingEntityId",
        COALESCE(be.trade_name, be.corporate_name) AS "billingEntityName",
        COALESCE(s.total_value, 0)::numeric AS "totalValue",
        COALESCE(s.down_payment_value, 0)::numeric AS "downPaymentValue",
        COALESCE(s.financed_amount, 0)::numeric AS "financedAmount",
        COALESCE(s.installments, 1)::int AS "installments",
        COALESCE(s.first_installment, 0)::numeric AS "firstInstallment",
        COALESCE(s.payment_method, 'boleto') AS "paymentMethod",
        s.status
      FROM sales s
      LEFT JOIN clients c ON c.id = s.client_id
      LEFT JOIN public_developments d ON d.id = s.development_id
      LEFT JOIN billing_entities be ON be.id = s.billing_entity_id
      WHERE ${where.join(" AND ")}
      LIMIT 1
    `,
    params,
  );

  return result.rows[0] ?? null;
}

async function getScopedReceivable(
  receivableId: string,
  scope: Awaited<ReturnType<typeof requireScopedUser>>,
) {
  if (!pool || !scope) return null;

  const params: any[] = [receivableId];
  const where = [`r.id = $1`];

  await appendDevelopmentScope(scope, params, where, "r.development_id");

  const result = await pool.query(
    `
      SELECT
        r.id,
        r.sale_id AS "saleId",
        r.client_id AS "clientId",
        r.client_name AS "clientName",
        r.development_id AS "developmentId",
        r.development_name AS "developmentName",
        r.lot_id AS "lotId",
        r.lot_code AS "lotCode",
        r.billing_entity_id AS "billingEntityId",
        r.billing_entity_name AS "billingEntityName",
        r.contract_number AS "contractNumber",
        r.billing_type AS "billingType",
        COALESCE(r.total_amount, 0)::numeric AS "totalAmount",
        COALESCE(r.entry_amount, 0)::numeric AS "entryAmount",
        COALESCE(r.financed_amount, 0)::numeric AS "financedAmount",
        COALESCE(r.installments_count, 0)::int AS "installmentsCount",
        r.first_due_date AS "firstDueDate",
        r.day_of_month AS "dayOfMonth",
        r.status,
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt"
      FROM financial_receivables r
      WHERE ${where.join(" AND ")}
      LIMIT 1
    `,
    params,
  );

  return result.rows[0] ?? null;
}

async function getScopedInstallment(
  installmentId: string,
  scope: Awaited<ReturnType<typeof requireScopedUser>>,
) {
  if (!pool || !scope) return null;

  const params: any[] = [installmentId];
  const where = [`i.id = $1`];

  await appendDevelopmentScope(scope, params, where, "r.development_id");

  const result = await pool.query(
    `
      SELECT
        i.id,
        i.receivable_id AS "receivableId",
        i.sale_id AS "saleId",
        i.client_id AS "clientId",
        i.client_name AS "clientName",
        i.billing_entity_id AS "billingEntityId",
        i.billing_entity_name AS "billingEntityName",
        i.contract_number AS "contractNumber",
        COALESCE(i.installment_number, 0)::int AS "installmentNumber",
        i.installment_label AS "installmentLabel",
        i.due_date AS "dueDate",
        COALESCE(i.nominal_value, 0)::numeric AS "nominalValue",
        COALESCE(i.discount_value, 0)::numeric AS "discountValue",
        COALESCE(i.other_deductions_value, 0)::numeric AS "otherDeductionsValue",
        COALESCE(i.fine_value, 0)::numeric AS "fineValue",
        COALESCE(i.other_additions_value, 0)::numeric AS "otherAdditionsValue",
        COALESCE(i.paid_value, 0)::numeric AS "paidValue",
        COALESCE(i.total_due, 0)::numeric AS "totalDue",
        i.status,
        i.payment_date AS "paymentDate",
        i.payment_method AS "paymentMethod",
        i.notes,
        i.boleto_url AS "boletoUrl",
        i.linha_digitavel AS "linhaDigitavel",
        i.barcode,
        i.nosso_numero AS "nossoNumero",
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt",
        r.development_id AS "developmentId"
      FROM financial_installments i
      INNER JOIN financial_receivables r ON r.id = i.receivable_id
      WHERE ${where.join(" AND ")}
      LIMIT 1
    `,
    params,
  );

  return result.rows[0] ?? null;
}

export function registerFinancialRoutes(app: Express) {
  ensureFinancialTables().catch((error) => {
    console.error("Erro ao garantir tabelas financeiras:", error);
  });

  app.get(
    "/api/financial/receivables",
    requireAuth,
    requireRoles("admin", "manager", "financial"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const params: any[] = [];
        const where: string[] = [];

        await appendDevelopmentScope(scope, params, where, "r.development_id");

        const result = await pool!.query(
          `
            SELECT
              r.id,
              r.sale_id AS "saleId",
              r.client_id AS "clientId",
              r.client_name AS "clientName",
              r.development_id AS "developmentId",
              r.development_name AS "developmentName",
              r.lot_id AS "lotId",
              r.lot_code AS "lotCode",
              r.billing_entity_id AS "billingEntityId",
              r.billing_entity_name AS "billingEntityName",
              r.contract_number AS "contractNumber",
              r.billing_type AS "billingType",
              COALESCE(r.total_amount, 0)::numeric AS "totalAmount",
              COALESCE(r.entry_amount, 0)::numeric AS "entryAmount",
              COALESCE(r.financed_amount, 0)::numeric AS "financedAmount",
              COALESCE(r.installments_count, 0)::int AS "installmentsCount",
              r.first_due_date AS "firstDueDate",
              r.day_of_month AS "dayOfMonth",
              r.status,
              r.created_at AS "createdAt",
              r.updated_at AS "updatedAt"
            FROM financial_receivables r
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
            ORDER BY r.created_at DESC, r.contract_number ASC
          `,
          params,
        );

        return res.status(200).json(result.rows);
      } catch {
        return res.status(500).json({
          message: "Não foi possível listar os recebíveis.",
        });
      }
    },
  );

  app.get(
    "/api/financial/installments",
    requireAuth,
    requireRoles("admin", "manager", "financial"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const params: any[] = [];
        const where: string[] = [];

        await appendDevelopmentScope(scope, params, where, "r.development_id");

        const result = await pool!.query(
          `
            SELECT
              i.id,
              i.receivable_id AS "receivableId",
              i.sale_id AS "saleId",
              i.client_id AS "clientId",
              i.client_name AS "clientName",
              i.billing_entity_id AS "billingEntityId",
              i.billing_entity_name AS "billingEntityName",
              i.contract_number AS "contractNumber",
              COALESCE(i.installment_number, 0)::int AS "installmentNumber",
              i.installment_label AS "installmentLabel",
              i.due_date AS "dueDate",
              COALESCE(i.nominal_value, 0)::numeric AS "nominalValue",
              COALESCE(i.discount_value, 0)::numeric AS "discountValue",
              COALESCE(i.other_deductions_value, 0)::numeric AS "otherDeductionsValue",
              COALESCE(i.fine_value, 0)::numeric AS "fineValue",
              COALESCE(i.other_additions_value, 0)::numeric AS "otherAdditionsValue",
              COALESCE(i.paid_value, 0)::numeric AS "paidValue",
              COALESCE(i.total_due, 0)::numeric AS "totalDue",
              i.status,
              i.payment_date AS "paymentDate",
              i.payment_method AS "paymentMethod",
              i.notes,
              i.boleto_url AS "boletoUrl",
              i.linha_digitavel AS "linhaDigitavel",
              i.barcode,
              i.nosso_numero AS "nossoNumero",
              i.created_at AS "createdAt",
              i.updated_at AS "updatedAt"
            FROM financial_installments i
            INNER JOIN financial_receivables r ON r.id = i.receivable_id
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
            ORDER BY i.due_date ASC, i.installment_number ASC
          `,
          params,
        );

        return res.status(200).json(result.rows);
      } catch {
        return res.status(500).json({
          message: "Não foi possível listar as parcelas.",
        });
      }
    },
  );

  app.get(
    "/api/financial/collection-events",
    requireAuth,
    requireRoles("admin", "manager", "financial"),
    async (req, res) => {
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const params: any[] = [];
        const where: string[] = [];

        if (req.query.receivableId) {
          params.push(String(req.query.receivableId));
          where.push(`COALESCE(e.receivable_id, i.receivable_id) = $${params.length}`);
        }

        if (req.query.installmentId) {
          params.push(String(req.query.installmentId));
          where.push(`e.installment_id = $${params.length}`);
        }

        await appendDevelopmentScope(scope, params, where, "r.development_id");

        const result = await pool!.query(
          `
            SELECT
              e.id,
              e.receivable_id AS "receivableId",
              e.installment_id AS "installmentId",
              e.event_type AS "eventType",
              e.user_id AS "userId",
              e.description,
              e.metadata_json AS "metadata",
              e.created_at AS "createdAt"
            FROM financial_collection_events e
            LEFT JOIN financial_installments i ON i.id = e.installment_id
            LEFT JOIN financial_receivables r
              ON r.id = COALESCE(e.receivable_id, i.receivable_id)
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
            ORDER BY e.created_at DESC
            LIMIT 500
          `,
          params,
        );

        return res.status(200).json(result.rows);
      } catch {
        return res.status(500).json({
          message: "Não foi possível listar os eventos de cobrança.",
        });
      }
    },
  );

  app.post(
    "/api/financial/sales/:saleId/generate",
    requireAuth,
    requireRoles("admin", "manager", "financial"),
    async (req, res) => {
      const client = await pool?.connect();
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const payload = generateFinancialSchema.parse(req.body);
        const sale = await getScopedSale(req.params.saleId, scope);

        if (!sale) {
          return res.status(404).json({
            message: "Venda não encontrada dentro do escopo do usuário.",
          });
        }

        if (!sale.developmentId) {
          return res.status(400).json({
            message: "A venda precisa estar vinculada a um empreendimento.",
          });
        }

        const canAccess = await ensureCanAccessDevelopmentAsync(
          scope,
          sale.developmentId,
        );

        if (!canAccess) {
          return res.status(403).json({
            message:
              "Você não tem permissão para gerar carteira para este empreendimento.",
          });
        }

        const existingReceivableResult = await client!.query(
          `
            SELECT id
            FROM financial_receivables
            WHERE sale_id = $1
            LIMIT 1
          `,
          [sale.id],
        );

        const existingReceivableId = existingReceivableResult.rows[0]?.id
          ? String(existingReceivableResult.rows[0].id)
          : null;

        if (existingReceivableId && !payload.replaceExisting) {
          return res.status(400).json({
            message:
              "Já existe carteira financeira gerada para esta venda. Marque a recriação para substituir.",
          });
        }

        if (existingReceivableId && payload.replaceExisting) {
          const paidInstallments = await client!.query(
            `
              SELECT COUNT(*)::int AS total
              FROM financial_installments
              WHERE receivable_id = $1
                AND (status = 'paga' OR COALESCE(paid_value, 0) > 0)
            `,
            [existingReceivableId],
          );

          if ((paidInstallments.rows[0]?.total ?? 0) > 0) {
            return res.status(400).json({
              message:
                "Não é possível recriar a carteira porque já existem parcelas pagas.",
            });
          }

          await client!.query(
            `
              DELETE FROM financial_collection_events
              WHERE receivable_id = $1
                 OR installment_id IN (
                    SELECT id
                    FROM financial_installments
                    WHERE receivable_id = $1
                 )
            `,
            [existingReceivableId],
          );

          await client!.query(
            `
              DELETE FROM financial_installments
              WHERE receivable_id = $1
            `,
            [existingReceivableId],
          );

          await client!.query(
            `
              DELETE FROM financial_receivables
              WHERE id = $1
            `,
            [existingReceivableId],
          );
        }

        const installmentsCount =
          payload.installmentsCount ??
          (sale.installments && Number(sale.installments) > 0
            ? Number(sale.installments)
            : 1);

        const firstDueDate =
          normalizeDateValue(payload.firstDueDate) ??
          addMonths(new Date().toISOString().slice(0, 10), 1);

        const financedAmount = Number(sale.financedAmount || 0);
        const downPaymentValue = Number(sale.downPaymentValue || 0);
        const totalValue = Number(sale.totalValue || 0);

        const installmentValue =
          payload.installmentValue ??
          (Number(sale.firstInstallment || 0) > 0
            ? Number(sale.firstInstallment)
            : installmentsCount > 0
              ? toMoney(financedAmount / installmentsCount)
              : financedAmount);

        const receivableId = randomUUID();

        await client!.query("BEGIN");

        await client!.query(
          `
            INSERT INTO financial_receivables (
              id,
              sale_id,
              client_id,
              client_name,
              development_id,
              development_name,
              lot_id,
              lot_code,
              billing_entity_id,
              billing_entity_name,
              contract_number,
              billing_type,
              total_amount,
              entry_amount,
              financed_amount,
              installments_count,
              first_due_date,
              day_of_month,
              status
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, 'aberto'
            )
          `,
          [
            receivableId,
            sale.id,
            sale.clientId ?? null,
            sale.clientName ?? "Cliente",
            sale.developmentId ?? null,
            sale.developmentName ?? null,
            sale.lotId ?? null,
            sale.lotCode ?? null,
            sale.billingEntityId ?? null,
            sale.billingEntityName ?? null,
            sale.contractNumber ?? `CTR-${sale.id}`,
            payload.billingType,
            totalValue,
            downPaymentValue,
            financedAmount,
            installmentsCount,
            firstDueDate,
            Number(firstDueDate.slice(8, 10)),
          ],
        );

        for (let index = 0; index < installmentsCount; index += 1) {
          const dueDate = addMonths(firstDueDate, index);
          const label = `${String(index + 1).padStart(3, "0")}/${String(
            installmentsCount,
          ).padStart(3, "0")}`;

          await client!.query(
            `
              INSERT INTO financial_installments (
                id,
                receivable_id,
                sale_id,
                client_id,
                client_name,
                billing_entity_id,
                billing_entity_name,
                contract_number,
                installment_number,
                installment_label,
                due_date,
                nominal_value,
                discount_value,
                other_deductions_value,
                fine_value,
                other_additions_value,
                paid_value,
                total_due,
                status,
                notes
              )
              VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, 0, 0, 0, 0, 0, $12, 'aberta', NULL
              )
            `,
            [
              randomUUID(),
              receivableId,
              sale.id,
              sale.clientId ?? null,
              sale.clientName ?? "Cliente",
              sale.billingEntityId ?? null,
              sale.billingEntityName ?? null,
              sale.contractNumber ?? `CTR-${sale.id}`,
              index + 1,
              label,
              dueDate,
              installmentValue,
            ],
          );
        }

        await recordCollectionEvent(client!, {
          receivableId,
          eventType: "receivable_created",
          userId: req.session.userId ?? null,
          description: "Carteira financeira gerada a partir da venda.",
          metadata: {
            saleId: sale.id,
            installmentsCount,
            billingType: payload.billingType,
          },
        });

        await client!.query("COMMIT");

        const created = await getScopedReceivable(receivableId, scope);

        return res.status(201).json({
          success: true,
          message: "Carteira financeira gerada com sucesso.",
          receivable: created,
        });
      } catch (error) {
        try {
          await client?.query("ROLLBACK");
        } catch {}

        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message: "Não foi possível gerar a carteira financeira.",
        });
      } finally {
        client?.release();
      }
    },
  );

  app.patch(
    "/api/financial/installments/:id/charges",
    requireAuth,
    requireRoles("admin", "manager", "financial"),
    async (req, res) => {
      const client = await pool?.connect();
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const installment = await getScopedInstallment(req.params.id, scope);

        if (!installment) {
          return res.status(404).json({
            message: "Parcela não encontrada dentro do escopo do usuário.",
          });
        }

        if (["paga", "cancelada"].includes(String(installment.status))) {
          return res.status(400).json({
            message: "Não é possível ajustar uma parcela paga ou cancelada.",
          });
        }

        const payload = chargesSchema.parse(req.body);

        const totalDue = calculateInstallmentTotal({
          nominalValue: Number(installment.nominalValue || 0),
          discountValue: payload.discountValue,
          otherDeductionsValue: payload.otherDeductionsValue,
          fineValue: payload.fineValue,
          otherAdditionsValue: payload.otherAdditionsValue,
        });

        await client!.query("BEGIN");

        await client!.query(
          `
            UPDATE financial_installments
            SET
              discount_value = $2,
              other_deductions_value = $3,
              fine_value = $4,
              other_additions_value = $5,
              total_due = $6,
              notes = $7,
              updated_at = NOW()
            WHERE id = $1
          `,
          [
            installment.id,
            payload.discountValue,
            payload.otherDeductionsValue,
            payload.fineValue,
            payload.otherAdditionsValue,
            totalDue,
            payload.notes ?? null,
          ],
        );

        await recordCollectionEvent(client!, {
          receivableId: installment.receivableId,
          installmentId: installment.id,
          eventType: "charges_updated",
          userId: req.session.userId ?? null,
          description: "Ajustes de cobrança aplicados à parcela.",
          metadata: payload,
        });

        await refreshReceivableStatus(client!, installment.receivableId);

        await client!.query("COMMIT");

        const updated = await getScopedInstallment(installment.id, scope);

        return res.status(200).json(updated);
      } catch (error) {
        try {
          await client?.query("ROLLBACK");
        } catch {}

        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message: "Não foi possível ajustar a parcela.",
        });
      } finally {
        client?.release();
      }
    },
  );

  app.patch(
    "/api/financial/installments/:id/pay",
    requireAuth,
    requireRoles("admin", "manager", "financial"),
    async (req, res) => {
      const client = await pool?.connect();
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const installment = await getScopedInstallment(req.params.id, scope);

        if (!installment) {
          return res.status(404).json({
            message: "Parcela não encontrada dentro do escopo do usuário.",
          });
        }

        if (String(installment.status) === "cancelada") {
          return res.status(400).json({
            message: "Não é possível dar baixa em uma parcela cancelada.",
          });
        }

        const payload = payInstallmentSchema.parse(req.body);

        const totalDue = calculateInstallmentTotal({
          nominalValue: Number(installment.nominalValue || 0),
          discountValue: payload.discountValue,
          otherDeductionsValue: payload.otherDeductionsValue,
          fineValue: payload.fineValue,
          otherAdditionsValue: payload.otherAdditionsValue,
        });

        await client!.query("BEGIN");

        await client!.query(
          `
            UPDATE financial_installments
            SET
              discount_value = $2,
              other_deductions_value = $3,
              fine_value = $4,
              other_additions_value = $5,
              total_due = $6,
              paid_value = $7,
              payment_date = $8,
              payment_method = $9,
              notes = $10,
              status = 'paga',
              updated_at = NOW()
            WHERE id = $1
          `,
          [
            installment.id,
            payload.discountValue,
            payload.otherDeductionsValue,
            payload.fineValue,
            payload.otherAdditionsValue,
            totalDue,
            payload.paidValue,
            normalizeDateValue(payload.paymentDate),
            payload.paymentMethod,
            payload.notes ?? null,
          ],
        );

        await recordCollectionEvent(client!, {
          receivableId: installment.receivableId,
          installmentId: installment.id,
          eventType: "installment_paid",
          userId: req.session.userId ?? null,
          description: "Baixa da parcela realizada.",
          metadata: {
            paidValue: payload.paidValue,
            paymentDate: payload.paymentDate,
            paymentMethod: payload.paymentMethod,
          },
        });

        await refreshReceivableStatus(client!, installment.receivableId);

        await client!.query("COMMIT");

        const updated = await getScopedInstallment(installment.id, scope);

        return res.status(200).json(updated);
      } catch (error) {
        try {
          await client?.query("ROLLBACK");
        } catch {}

        if (error instanceof ZodError) {
          return res.status(400).json({
            message: error.issues[0]?.message ?? "Dados inválidos",
          });
        }

        return res.status(500).json({
          message: "Não foi possível dar baixa na parcela.",
        });
      } finally {
        client?.release();
      }
    },
  );

  app.post(
    "/api/financial/receivables/:id/cancel",
    requireAuth,
    requireRoles("admin", "manager", "financial"),
    async (req, res) => {
      const client = await pool?.connect();
      try {
        if (!requireDatabase(res)) return;

        const scope = await requireScopedUser(req, res);
        if (!scope) return;

        const receivable = await getScopedReceivable(req.params.id, scope);

        if (!receivable) {
          return res.status(404).json({
            message: "Recebível não encontrado dentro do escopo do usuário.",
          });
        }

        await client!.query("BEGIN");

        await client!.query(
          `
            UPDATE financial_installments
            SET
              status = CASE
                WHEN status = 'paga' THEN status
                ELSE 'cancelada'
              END,
              updated_at = NOW()
            WHERE receivable_id = $1
          `,
          [receivable.id],
        );

        await client!.query(
          `
            UPDATE financial_receivables
            SET status = 'cancelado', updated_at = NOW()
            WHERE id = $1
          `,
          [receivable.id],
        );

        await recordCollectionEvent(client!, {
          receivableId: receivable.id,
          eventType: "receivable_cancelled",
          userId: req.session.userId ?? null,
          description: "Recebível cancelado pelo usuário.",
          metadata: {},
        });

        await client!.query("COMMIT");

        const updated = await getScopedReceivable(receivable.id, scope);

        return res.status(200).json(updated);
      } catch {
        try {
          await client?.query("ROLLBACK");
        } catch {}

        return res.status(500).json({
          message: "Não foi possível cancelar o recebível.",
        });
      } finally {
        client?.release();
      }
    },
  );
}