import type { Express, NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { z, ZodError } from "zod";
import { pool } from "./db";

type ProposalStatus = "rascunho" | "aprovada" | "rejeitada" | "convertida";

function optionalText() {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  }, z.string().nullable().optional());
}

function requiredText(fieldMessage: string) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  }, z.string().min(1, fieldMessage));
}

function normalizeProposalStatusInput(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return undefined;
  }

  const raw = String(value).trim().toLowerCase();

  switch (raw) {
    case "draft":
    case "rascunho":
      return "rascunho";
    case "approved":
    case "aprovada":
      return "aprovada";
    case "rejected":
    case "rejeitada":
      return "rejeitada";
    case "converted":
    case "convertida":
      return "convertida";
    default:
      return raw;
  }
}

const proposalStatusEnum = z.enum([
  "rascunho",
  "aprovada",
  "rejeitada",
  "convertida",
]);

const proposalSchema = z.object({
  proposalNumber: optionalText(),

  clientId: requiredText("Selecione o cliente"),
  clientName: requiredText("Nome do cliente obrigatório"),
  clientPhone: optionalText(),
  clientEmail: optionalText(),

  developmentId: requiredText("Selecione o empreendimento"),
  developmentName: requiredText("Nome do empreendimento obrigatório"),

  lotId: requiredText("Selecione o lote"),
  lotCode: requiredText("Código do lote obrigatório"),

  brokerId: optionalText(),
  brokerName: optionalText(),

  totalValue: z.coerce.number().min(0).default(0),
  downPaymentValue: z.coerce.number().min(0).default(0),
  financedAmount: z.coerce.number().min(0).default(0),
  installments: z.coerce.number().int().min(1).default(120),
  interestRate: z.coerce.number().min(0).default(0.85),
  correctionIndex: z.preprocess((value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "IGP-M";
    }
    return String(value).trim();
  }, z.string().min(1)),
  firstInstallment: z.coerce.number().min(0).default(0),
  paymentMethod: z.preprocess((value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "Financiamento direto";
    }
    return String(value).trim();
  }, z.string().min(1)),
  proposalDate: z.preprocess((value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return new Date().toISOString().slice(0, 10);
    }
    return String(value).trim();
  }, z.string().min(8)),
  saleDate: optionalText(),

  notes: optionalText(),
  status: z.preprocess((value) => {
    const normalized = normalizeProposalStatusInput(value);
    return normalized ?? "rascunho";
  }, proposalStatusEnum).default("rascunho"),
});

const proposalStatusSchema = z.object({
  status: z.preprocess((value) => {
    return normalizeProposalStatusInput(value);
  }, proposalStatusEnum),
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  return next();
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

function generateProposalNumber() {
  return `PROP-${Date.now().toString().slice(-8)}`;
}

function normalizeRowStatus(status: unknown): ProposalStatus {
  const raw = String(status ?? "").trim().toLowerCase();

  switch (raw) {
    case "draft":
    case "rascunho":
      return "rascunho";
    case "approved":
    case "aprovada":
      return "aprovada";
    case "rejected":
    case "rejeitada":
      return "rejeitada";
    case "converted":
    case "convertida":
      return "convertida";
    default:
      return "rascunho";
  }
}

async function ensureProposalsTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const alterStatements = [
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_number TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_id TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_name TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_phone TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_email TEXT`,

    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS development_id TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS development_name TEXT`,

    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS lot_id TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS lot_code TEXT`,

    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS broker_id TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS broker_name TEXT`,

    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS down_payment_value NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS financed_amount NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS installments INTEGER NOT NULL DEFAULT 120`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(8,4) NOT NULL DEFAULT 0`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS correction_index TEXT NOT NULL DEFAULT 'IGP-M'`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS first_installment NUMERIC(14,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'Financiamento direto'`,

    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_date DATE`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sale_date DATE`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'rascunho'`,
    `ALTER TABLE proposals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  ];

  for (const sql of alterStatements) {
    await pool.query(sql);
  }

  await pool.query(`
    UPDATE proposals
    SET
      proposal_number = COALESCE(NULLIF(proposal_number, ''), 'PROP-' || RIGHT(REPLACE(id, '-', ''), 8)),
      correction_index = COALESCE(NULLIF(correction_index, ''), 'IGP-M'),
      payment_method = COALESCE(NULLIF(payment_method, ''), 'Financiamento direto'),
      status = CASE
        WHEN LOWER(COALESCE(status, '')) = 'draft' THEN 'rascunho'
        WHEN LOWER(COALESCE(status, '')) = 'approved' THEN 'aprovada'
        WHEN LOWER(COALESCE(status, '')) = 'rejected' THEN 'rejeitada'
        WHEN LOWER(COALESCE(status, '')) = 'converted' THEN 'convertida'
        WHEN LOWER(COALESCE(status, '')) = 'rascunho' THEN 'rascunho'
        WHEN LOWER(COALESCE(status, '')) = 'aprovada' THEN 'aprovada'
        WHEN LOWER(COALESCE(status, '')) = 'rejeitada' THEN 'rejeitada'
        WHEN LOWER(COALESCE(status, '')) = 'convertida' THEN 'convertida'
        ELSE 'rascunho'
      END,
      proposal_date = COALESCE(proposal_date, CURRENT_DATE),
      updated_at = COALESCE(updated_at, NOW())
  `);
}

function mapProposalRow(row: any) {
  return {
    id: row.id,
    proposalNumber:
      row.proposal_number || `PROP-${String(row.id || "").replace(/-/g, "").slice(-8)}`,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    clientEmail: row.client_email,

    developmentId: row.development_id,
    developmentName: row.development_name,

    lotId: row.lot_id,
    lotCode: row.lot_code,

    brokerId: row.broker_id,
    brokerName: row.broker_name,

    totalValue: Number(row.total_value ?? 0),
    downPaymentValue: Number(row.down_payment_value ?? 0),
    financedAmount: Number(row.financed_amount ?? 0),
    installments: Number(row.installments ?? 0),
    interestRate: Number(row.interest_rate ?? 0),
    correctionIndex: row.correction_index || "IGP-M",
    firstInstallment: Number(row.first_installment ?? 0),
    paymentMethod: row.payment_method || "Financiamento direto",

    proposalDate: row.proposal_date,
    saleDate: row.sale_date,
    notes: row.notes,
    status: normalizeRowStatus(row.status),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function registerProposalRoutes(app: Express) {
  void ensureProposalsTable().catch((error) => {
    console.error("Falha ao garantir tabela de propostas:", error);
  });

  app.get("/api/proposals", requireAuth, async (_req, res) => {
    try {
      if (!requireDatabase(res)) return;

      await ensureProposalsTable();

      const result = await pool!.query(`
        SELECT
          id,
          proposal_number,
          client_id,
          client_name,
          client_phone,
          client_email,
          development_id,
          development_name,
          lot_id,
          lot_code,
          broker_id,
          broker_name,
          total_value,
          down_payment_value,
          financed_amount,
          installments,
          interest_rate,
          correction_index,
          first_installment,
          payment_method,
          proposal_date,
          sale_date,
          notes,
          status,
          created_at,
          updated_at
        FROM proposals
        ORDER BY updated_at DESC, created_at DESC
      `);

      return res.status(200).json(result.rows.map(mapProposalRow));
    } catch (error) {
      console.error("GET /api/proposals error:", error);
      return res.status(500).json({
        message: "Não foi possível carregar as propostas",
      });
    }
  });

  app.get("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      await ensureProposalsTable();

      const result = await pool!.query(
        `
          SELECT
            id,
            proposal_number,
            client_id,
            client_name,
            client_phone,
            client_email,
            development_id,
            development_name,
            lot_id,
            lot_code,
            broker_id,
            broker_name,
            total_value,
            down_payment_value,
            financed_amount,
            installments,
            interest_rate,
            correction_index,
            first_installment,
            payment_method,
            proposal_date,
            sale_date,
            notes,
            status,
            created_at,
            updated_at
          FROM proposals
          WHERE id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      const proposal = result.rows[0];

      if (!proposal) {
        return res.status(404).json({ message: "Proposta não encontrada" });
      }

      return res.status(200).json(mapProposalRow(proposal));
    } catch (error) {
      console.error("GET /api/proposals/:id error:", error);
      return res.status(500).json({
        message: "Não foi possível carregar a proposta",
      });
    }
  });

  app.post("/api/proposals", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      await ensureProposalsTable();

      const payload = proposalSchema.parse(req.body ?? {});
      const id = randomUUID();
      const proposalNumber = payload.proposalNumber || generateProposalNumber();

      await pool!.query(
        `
          INSERT INTO proposals (
            id,
            proposal_number,
            client_id,
            client_name,
            client_phone,
            client_email,
            development_id,
            development_name,
            lot_id,
            lot_code,
            broker_id,
            broker_name,
            total_value,
            down_payment_value,
            financed_amount,
            installments,
            interest_rate,
            correction_index,
            first_installment,
            payment_method,
            proposal_date,
            sale_date,
            notes,
            status,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, NOW(), NOW()
          )
        `,
        [
          id,
          proposalNumber,
          payload.clientId,
          payload.clientName,
          payload.clientPhone ?? null,
          payload.clientEmail ?? null,
          payload.developmentId,
          payload.developmentName,
          payload.lotId,
          payload.lotCode,
          payload.brokerId ?? null,
          payload.brokerName ?? null,
          payload.totalValue,
          payload.downPaymentValue,
          payload.financedAmount,
          payload.installments,
          payload.interestRate,
          payload.correctionIndex,
          payload.firstInstallment,
          payload.paymentMethod,
          payload.proposalDate,
          payload.saleDate ?? null,
          payload.notes ?? null,
          payload.status,
        ],
      );

      return res.status(201).json({
        success: true,
        id,
        proposalNumber,
        message: "Proposta cadastrada com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      console.error("POST /api/proposals error:", error);
      return res.status(500).json({
        message: "Não foi possível cadastrar a proposta",
      });
    }
  });

  app.put("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      await ensureProposalsTable();

      const payload = proposalSchema.parse(req.body ?? {});

      const existingResult = await pool!.query(
        `
          SELECT id
          FROM proposals
          WHERE id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      if (!existingResult.rows[0]) {
        return res.status(404).json({ message: "Proposta não encontrada" });
      }

      const proposalNumber = payload.proposalNumber || generateProposalNumber();

      await pool!.query(
        `
          UPDATE proposals
          SET
            proposal_number = $2,
            client_id = $3,
            client_name = $4,
            client_phone = $5,
            client_email = $6,
            development_id = $7,
            development_name = $8,
            lot_id = $9,
            lot_code = $10,
            broker_id = $11,
            broker_name = $12,
            total_value = $13,
            down_payment_value = $14,
            financed_amount = $15,
            installments = $16,
            interest_rate = $17,
            correction_index = $18,
            first_installment = $19,
            payment_method = $20,
            proposal_date = $21,
            sale_date = $22,
            notes = $23,
            status = $24,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          req.params.id,
          proposalNumber,
          payload.clientId,
          payload.clientName,
          payload.clientPhone ?? null,
          payload.clientEmail ?? null,
          payload.developmentId,
          payload.developmentName,
          payload.lotId,
          payload.lotCode,
          payload.brokerId ?? null,
          payload.brokerName ?? null,
          payload.totalValue,
          payload.downPaymentValue,
          payload.financedAmount,
          payload.installments,
          payload.interestRate,
          payload.correctionIndex,
          payload.firstInstallment,
          payload.paymentMethod,
          payload.proposalDate,
          payload.saleDate ?? null,
          payload.notes ?? null,
          payload.status,
        ],
      );

      return res.status(200).json({
        success: true,
        id: req.params.id,
        message: "Proposta atualizada com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      console.error("PUT /api/proposals/:id error:", error);
      return res.status(500).json({
        message: "Não foi possível atualizar a proposta",
      });
    }
  });

  app.patch("/api/proposals/:id/status", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      await ensureProposalsTable();

      const payload = proposalStatusSchema.parse(req.body);

      const result = await pool!.query(
        `
          UPDATE proposals
          SET
            status = $2,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [req.params.id, payload.status],
      );

      if (!result.rows[0]) {
        return res.status(404).json({ message: "Proposta não encontrada" });
      }

      return res.status(200).json({
        success: true,
        id: req.params.id,
        message: "Status da proposta atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      console.error("PATCH /api/proposals/:id/status error:", error);
      return res.status(500).json({
        message: "Não foi possível atualizar o status da proposta",
      });
    }
  });

  app.delete("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      await ensureProposalsTable();

      const result = await pool!.query(
        `
          DELETE FROM proposals
          WHERE id = $1
          RETURNING id
        `,
        [req.params.id],
      );

      if (!result.rows[0]) {
        return res.status(404).json({ message: "Proposta não encontrada" });
      }

      return res.status(200).json({
        success: true,
        id: req.params.id,
        message: "Proposta excluída com sucesso",
      });
    } catch (error) {
      console.error("DELETE /api/proposals/:id error:", error);
      return res.status(500).json({
        message: "Não foi possível excluir a proposta",
      });
    }
  });
}