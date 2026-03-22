import { registerFinancialRoutes } from "./registerFinancialRoutes";
import { promises as fs } from "fs";
import path from "path";
import { registerProposalRoutes } from "./registerProposalRoutes";
import { registerClientAdminRoutes } from "./registerClientAdminRoutes";
import { registerUserAdminRoutes } from "./registerUserAdminRoutes";
import type { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import type { Server } from "http";
import { randomUUID } from "crypto";
import { ZodError, z } from "zod";
import { loginSchema, type SafeUser, type UserRole } from "@shared/schema";
import { storage } from "./storage";
import { defaultLotContractTemplate } from "./contracts/defaultLotContract";
import {
  appendBillingEntityScope,
  appendDevelopmentScope,
  ensureCanAccessDevelopmentAsync,
  getScopedDevelopmentIds,
  requireScopedUser,
  type RequestScope,
} from "./accessScope";
import {
  ensureBillingEntitiesTable,
  ensureBrokersTable,
  ensureClientsTable,
  ensureLotsTable,
  ensurePublicDevelopmentsTable,
  ensurePublicInterestsTable,
  getDatabaseStatus,
  isDatabaseConfigured,
  pool,
} from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: UserRole;
  }
}

const MemoryStore = createMemoryStore(session);

const publicInterestSchema = z.object({
  projectId: z.string().optional().nullable(),
  projectName: z.string().min(2, "Empreendimento inválido"),
  source: z.string().optional().default("landing_ai"),
  fullName: z.string().min(3, "Informe o nome completo"),
  phone: z.string().min(8, "Informe um telefone válido"),
  email: z.string().optional().nullable(),
  cityInterest: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  familyProfile: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const billingEntitySchema = z.object({
  corporateName: z.string().min(3, "Informe a razão social"),
  tradeName: z.string().optional().nullable(),
  document: z.string().min(11, "Informe o CNPJ"),
  bankCode: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  agency: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  walletCode: z.string().optional().nullable(),
  agreementCode: z.string().optional().nullable(),
  cnabLayout: z.string().optional().default("CNAB240"),
  beneficiaryName: z.string().optional().nullable(),
  beneficiaryDocument: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const developmentSchema = z.object({
  billingEntityId: z.string().min(1, "Selecione a entidade cobradora"),
  name: z.string().min(3, "Informe o nome do empreendimento"),
  city: z.string().min(3, "Informe a cidade"),
  type: z.string().min(2, "Informe o tipo"),
  price: z.string().min(1, "Informe a condição comercial"),
  img: z.string().min(2, "Informe a URL da imagem"),
  status: z.string().min(2, "Informe o status"),
  area: z.string().min(1, "Informe a dimensão"),
  financing: z.string().min(2, "Informe a condição de financiamento"),
  description: z.string().min(10, "Informe a descrição"),
  highlights: z.array(z.string()).default([]),
  totalLots: z.number().int().min(0),
  plantPdfUrl: z.string().optional().nullable(),
  plantImageUrl: z.string().optional().nullable(),
  overviewImageUrl: z.string().optional().nullable(),
});

const brokerSchema = z.object({
  billingEntityId: z.string().min(1, "Selecione a entidade cobradora"),
  name: z.string().min(3, "Informe o nome do corretor"),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  creci: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const brokerUpdateSchema = brokerSchema.extend({
  isActive: z.boolean().optional(),
});

const lotSchema = z.object({
  developmentId: z.string().min(1, "Selecione o empreendimento"),
  code: z.string().min(3, "Informe o código do lote"),
  block: z.string().min(1, "Informe a quadra"),
  lot: z.string().min(1, "Informe o lote"),
  areaM2: z.coerce.number().int().min(0, "Área inválida"),
  frontM: z.coerce.number().min(0, "Frente inválida"),
  price: z.string().min(1, "Informe o valor"),
  status: z.enum(["Disponível", "Reservado", "Vendido"]),
});

const assignBrokerSchema = z.object({
  brokerId: z.string().optional().nullable(),
});

const convertInterestToClientSchema = z.object({
  interestId: z.string().min(1, "Informe o protocolo"),
});

const saleSchema = z.object({
  clientId: z.string().min(1, "Selecione o cliente"),
  clientName: z.string().min(1, "Nome do cliente obrigatório"),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().optional().nullable(),
  developmentId: z.string().min(1, "Selecione o empreendimento"),
  developmentName: z.string().min(1, "Nome do empreendimento obrigatório"),
  lotId: z.string().min(1, "Selecione o lote"),
  lotCode: z.string().min(1, "Código do lote obrigatório"),
  brokerId: z.string().optional().nullable(),
  brokerName: z.string().optional().nullable(),
  totalValue: z.coerce.number().min(0),
  downPaymentValue: z.coerce.number().min(0),
  financedAmount: z.coerce.number().min(0),
  installments: z.coerce.number().int().min(1),
  interestRate: z.coerce.number().min(0),
  correctionIndex: z.string().min(1),
  firstInstallment: z.coerce.number().min(0),
  paymentMethod: z.string().min(1),
  saleDate: z.string().min(8),
  notes: z.string().optional().nullable(),
});

const saleStatusSchema = z.object({
  status: z.enum(["rascunho", "aguardando_assinatura", "assinado", "cancelado"]),
});

const signatureLinkSchema = z.object({
  buyerName: z.string().optional().nullable(),
  buyerDocument: z.string().optional().nullable(),
  buyerEmail: z.string().optional().nullable(),
  buyerPhone: z.string().optional().nullable(),
  expiresInHours: z.coerce.number().int().min(1).max(168).optional().default(72),
});

const publicSignatureSubmitSchema = z.object({
  signerName: z.string().min(3, "Informe o nome do assinante"),
  signerDocument: z.string().optional().nullable(),
  signerEmail: z.string().optional().nullable(),
  signerPhone: z.string().optional().nullable(),
  signatureDataUrl: z
    .string()
    .min(30, "Assinatura inválida")
    .refine((value) => value.startsWith("data:image/png;base64,"), {
      message: "Formato de assinatura inválido",
    }),
  accepted: z.literal(true),
});

function clearAuthSession(req: Request) {
  delete req.session.userId;
  delete req.session.userRole;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
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


async function getScopedBillingEntityIds(
  scope: RequestScope,
): Promise<string[] | null> {
  if (scope.isAdmin) return null;

  if (scope.billingEntityId) {
    return [scope.billingEntityId];
  }

  const developmentIds = await getScopedDevelopmentIds(scope);

  if (!developmentIds || developmentIds.length === 0 || !pool) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT DISTINCT billing_entity_id
      FROM public_developments
      WHERE id = ANY($1::text[])
        AND billing_entity_id IS NOT NULL
    `,
    [developmentIds],
  );

  return result.rows
    .map((row) => row.billing_entity_id)
    .filter(Boolean)
    .map((value) => String(value));
}

async function ensureCanAccessBillingEntityId(
  scope: RequestScope,
  billingEntityId?: string | null,
): Promise<boolean> {
  if (scope.isAdmin) return true;
  if (!billingEntityId) return false;

  const allowedIds = await getScopedBillingEntityIds(scope);
  if (!allowedIds) return true;

  return allowedIds.includes(String(billingEntityId));
}

type SqlExecutor = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

async function getFinancialTablePresence(executor?: SqlExecutor) {
  const db = (executor ?? (pool as unknown as SqlExecutor | null));

  if (!db) {
    return {
      receivables: false,
      installments: false,
      collectionEvents: false,
      remittances: false,
      remittanceItems: false,
    };
  }

  const result = await db.query(`
    SELECT
      to_regclass('public.financial_receivables') IS NOT NULL AS receivables,
      to_regclass('public.financial_installments') IS NOT NULL AS installments,
      to_regclass('public.financial_collection_events') IS NOT NULL AS collection_events,
      to_regclass('public.financial_remittances') IS NOT NULL AS remittances,
      to_regclass('public.financial_remittance_items') IS NOT NULL AS remittance_items
  `);

  return {
    receivables: Boolean(result.rows[0]?.receivables),
    installments: Boolean(result.rows[0]?.installments),
    collectionEvents: Boolean(result.rows[0]?.collection_events),
    remittances: Boolean(result.rows[0]?.remittances),
    remittanceItems: Boolean(result.rows[0]?.remittance_items),
  };
}

async function logFinancialCollectionEventIfPossible(
  executor: SqlExecutor,
  input: {
    receivableId?: string | null;
    installmentId?: string | null;
    saleId?: string | null;
    remittanceId?: string | null;
    eventType: string;
    eventStatus?: string | null;
    title?: string | null;
    description?: string | null;
    payload?: any;
    createdBy?: string | null;
  },
) {
  const tables = await getFinancialTablePresence(executor);
  if (!tables.collectionEvents) return;

  await executor.query(
    `
      INSERT INTO financial_collection_events (
        id,
        receivable_id,
        installment_id,
        sale_id,
        remittance_id,
        event_type,
        event_status,
        title,
        description,
        payload,
        created_by,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      )
    `,
    [
      randomUUID(),
      input.receivableId ?? null,
      input.installmentId ?? null,
      input.saleId ?? null,
      input.remittanceId ?? null,
      input.eventType,
      input.eventStatus ?? null,
      input.title ?? null,
      input.description ?? null,
      input.payload ?? null,
      input.createdBy ?? null,
    ],
  );
}

async function getSaleBankLifeInternal(saleId: string, executor?: SqlExecutor) {
  const db = (executor ?? (pool as unknown as SqlExecutor | null));
  if (!db) return false;

  const tables = await getFinancialTablePresence(db);
  if (!tables.installments) return false;

  if (tables.remittanceItems && tables.remittances) {
    const result = await db.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM financial_installments fi
          LEFT JOIN financial_remittance_items fri
            ON fri.installment_id = fi.id
          LEFT JOIN financial_remittances fr
            ON fr.id = fri.remittance_id
          WHERE fi.sale_id = $1
            AND (
              fi.status = 'paga'
              OR fr.status IN ('gerada', 'enviada', 'processada')
            )
        ) AS has_bank_life
      `,
      [saleId],
    );

    return Boolean(result.rows[0]?.has_bank_life);
  }

  const result = await db.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM financial_installments
        WHERE sale_id = $1
          AND status = 'paga'
      ) AS has_bank_life
    `,
    [saleId],
  );

  return Boolean(result.rows[0]?.has_bank_life);
}

async function cancelFinancialForSaleInternal(
  saleId: string,
  input: {
    reason?: string | null;
    requestBankOps?: boolean;
    createdBy?: string | null;
  },
  executor?: SqlExecutor,
) {
  const db = (executor ?? (pool as unknown as SqlExecutor | null));

  if (!db) {
    return {
      found: false,
      receivableId: null,
      cancelledInstallments: 0,
      bankRequests: 0,
    };
  }

  const tables = await getFinancialTablePresence(db);
  if (!tables.receivables || !tables.installments) {
    return {
      found: false,
      receivableId: null,
      cancelledInstallments: 0,
      bankRequests: 0,
    };
  }

  const receivableResult = await db.query(
    `
      SELECT id
      FROM financial_receivables
      WHERE sale_id = $1
      LIMIT 1
    `,
    [saleId],
  );

  const receivable = receivableResult.rows[0];
  if (!receivable) {
    return {
      found: false,
      receivableId: null,
      cancelledInstallments: 0,
      bankRequests: 0,
    };
  }

  await db.query(
    `
      UPDATE financial_receivables
      SET
        status = 'cancelado',
        updated_at = NOW()
      WHERE id = $1
    `,
    [receivable.id],
  );

  const installmentsResult = await db.query(
    `
      SELECT id, status, notes
      FROM financial_installments
      WHERE receivable_id = $1
      ORDER BY installment_number ASC
    `,
    [receivable.id],
  );

  let cancelledInstallments = 0;
  let bankRequests = 0;

  for (const installment of installmentsResult.rows) {
    const status = String(installment.status ?? '').toLowerCase();

    if (status !== 'paga' && status !== 'cancelada') {
      await db.query(
        `
          UPDATE financial_installments
          SET
            status = 'cancelada',
            notes = COALESCE(notes, '') || CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE E'\n' END || $2,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          installment.id,
          `Cancelamento financeiro vinculado à venda. ${input.reason ?? ''}`.trim(),
        ],
      );
      cancelledInstallments += 1;
    }

    if (input.requestBankOps && tables.remittanceItems && tables.remittances) {
      const bankLifeResult = await db.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM financial_remittance_items fri
            INNER JOIN financial_remittances fr
              ON fr.id = fri.remittance_id
            WHERE fri.installment_id = $1
              AND fr.type = 'entrada'
              AND fr.status IN ('gerada', 'enviada', 'processada')
          ) AS registered_in_bank
        `,
        [installment.id],
      );

      if (Boolean(bankLifeResult.rows[0]?.registered_in_bank)) {
        bankRequests += 1;

        await logFinancialCollectionEventIfPossible(db, {
          receivableId: receivable.id,
          installmentId: installment.id,
          saleId,
          eventType: 'bank_cancellation_requested',
          eventStatus: 'pendente',
          title: 'Baixa/cancelamento bancário pendente',
          description:
            'A venda foi cancelada e a parcela já possui vida bancária. Incluir em remessa de baixa/cancelamento.',
          payload: { reason: input.reason ?? null },
          createdBy: input.createdBy ?? null,
        });
      }
    }
  }

  await logFinancialCollectionEventIfPossible(db, {
    receivableId: receivable.id,
    saleId,
    eventType: 'sale_financial_cancelled',
    eventStatus: bankRequests > 0 ? 'pendente' : 'concluido',
    title: 'Financeiro cancelado pela venda',
    description:
      bankRequests > 0
        ? 'A venda foi cancelada e o financeiro foi encerrado com pendências bancárias para remessa de baixa/cancelamento.'
        : 'A venda foi cancelada e o financeiro vinculado foi encerrado.',
    payload: {
      cancelledInstallments,
      bankRequests,
      reason: input.reason ?? null,
    },
    createdBy: input.createdBy ?? null,
  });

  return {
    found: true,
    receivableId: receivable.id,
    cancelledInstallments,
    bankRequests,
  };
}

async function deleteFinancialForSaleInternal(saleId: string, executor?: SqlExecutor) {
  const db = (executor ?? (pool as unknown as SqlExecutor | null));
  if (!db) return { removed: false };

  const tables = await getFinancialTablePresence(db);
  if (!tables.receivables && !tables.installments) {
    return { removed: false };
  }

  let remittanceIds: string[] = [];

  if (tables.remittanceItems) {
    const remittanceResult = await db.query(
      `
        SELECT DISTINCT remittance_id
        FROM financial_remittance_items
        WHERE sale_id = $1
          AND remittance_id IS NOT NULL
      `,
      [saleId],
    );

    remittanceIds = remittanceResult.rows
      .map((row) => String(row.remittance_id || ''))
      .filter(Boolean);
  }

  if (tables.collectionEvents) {
    await db.query(
      `
        DELETE FROM financial_collection_events
        WHERE sale_id = $1
      `,
      [saleId],
    );
  }

  if (tables.remittanceItems) {
    await db.query(
      `
        DELETE FROM financial_remittance_items
        WHERE sale_id = $1
      `,
      [saleId],
    );
  }

  if (tables.installments) {
    await db.query(
      `
        DELETE FROM financial_installments
        WHERE sale_id = $1
      `,
      [saleId],
    );
  }

  if (tables.receivables) {
    await db.query(
      `
        DELETE FROM financial_receivables
        WHERE sale_id = $1
      `,
      [saleId],
    );
  }

  if (tables.remittances && remittanceIds.length > 0) {
    await db.query(
      `
        UPDATE financial_remittances fr
        SET
          items_count = (
            SELECT COUNT(*)::int
            FROM financial_remittance_items fri
            WHERE fri.remittance_id = fr.id
          ),
          updated_at = NOW()
        WHERE fr.id = ANY($1::text[])
      `,
      [remittanceIds],
    );

    await db.query(
      `
        DELETE FROM financial_remittances fr
        WHERE fr.id = ANY($1::text[])
          AND fr.status = 'rascunho'
          AND NOT EXISTS (
            SELECT 1
            FROM financial_remittance_items fri
            WHERE fri.remittance_id = fr.id
          )
      `,
      [remittanceIds],
    );
  }

  return { removed: true };
}

async function getSessionUser(req: Request): Promise<SafeUser | null> {
  if (!req.session.userId) return null;
  const user = await storage.getSafeUser(req.session.userId);
  return user ?? null;
}

function normalizePriceToNumber(value: string | null | undefined): number {
  if (!value) return 0;

  const onlyDigits = value.replace(/[^\d,.-]/g, "");
  if (!onlyDigits) return 0;

  const normalized = onlyDigits.includes(",")
    ? onlyDigits.replace(/\./g, "").replace(",", ".")
    : onlyDigits;

  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return 0;

  return parsed;
}

function getDevelopmentPrefix(name: string) {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 3) {
    return words
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  }

  const joined = words.join("").toUpperCase();
  return (joined.slice(0, 3) || "LOT").padEnd(3, "X");
}

function getBlockLabels(totalLots: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const blockCount = Math.min(26, Math.max(4, Math.ceil(totalLots / 20)));
  return letters.slice(0, blockCount);
}

function buildGeneratedLotsForDevelopment(input: {
  developmentId: string;
  developmentName: string;
  totalLots: number;
  basePrice: number;
}): Array<{
  code: string;
  block: string;
  lot: string;
  areaM2: number;
  frontM: number;
  price: string;
  status: "Disponível";
}> {
  const totalLots = Math.max(0, input.totalLots);
  if (totalLots === 0) return [];

  const blocks = getBlockLabels(totalLots);
  const lotsPerBlock = Math.ceil(totalLots / blocks.length);
  const prefix = getDevelopmentPrefix(input.developmentName);

  const generated: Array<{
    code: string;
    block: string;
    lot: string;
    areaM2: number;
    frontM: number;
    price: string;
    status: "Disponível";
  }> = [];

  let counter = 0;

  for (const block of blocks) {
    for (let i = 1; i <= lotsPerBlock; i++) {
      counter += 1;
      if (counter > totalLots) break;

      const lot = String(i).padStart(2, "0");
      const areaM2 = 250 + ((counter - 1) % 8) * 5;
      const frontM = Number((10 + ((counter - 1) % 4) * 0.5).toFixed(2));
      const priceValue = input.basePrice > 0 ? input.basePrice : 100000;

      generated.push({
        code: `${prefix}-${block}-${lot}`,
        block,
        lot,
        areaM2,
        frontM,
        price: String(priceValue),
        status: "Disponível",
      });
    }
  }

  return generated;
}

function renderContractTemplate(template: string, data: Record<string, string>) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    return data[key.trim()] ?? "";
  });
}

function getPublicBaseUrl(req: Request) {
  const envUrl = process.env.PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");

  const forwardedProto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const forwardedHost = (req.headers["x-forwarded-host"] as string) || req.get("host");

  return `${forwardedProto}://${forwardedHost}`;
}

function escapeHtml(value: string | null | undefined) {
  const text = String(value ?? "");
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTimeBR(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function getMimeTypeFromExtension(ext: string) {
  const value = ext.toLowerCase();
  if (value === ".png") return "image/png";
  if (value === ".jpg" || value === ".jpeg") return "image/jpeg";
  if (value === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function readImageAsDataUrl(filePath: string) {
  try {
    const buffer = await fs.readFile(filePath);
    const mime = getMimeTypeFromExtension(path.extname(filePath));
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function getSellerDefaultSignatureDataUrl(billingEntityId?: string | null) {
  const baseDir = path.join(
    process.cwd(),
    "server",
    "assets",
    "signatures",
    "sellers",
  );

  const candidates: string[] = [];

  if (billingEntityId) {
    candidates.push(
      path.join(baseDir, `${billingEntityId}.png`),
      path.join(baseDir, `${billingEntityId}.jpg`),
      path.join(baseDir, `${billingEntityId}.jpeg`),
      path.join(baseDir, `${billingEntityId}.webp`),
    );
  }

  candidates.push(
    path.join(baseDir, "seller-default-signature.png"),
    path.join(baseDir, "seller-default-signature.jpg"),
    path.join(baseDir, "seller-default-signature.jpeg"),
    path.join(baseDir, "seller-default-signature.webp"),
  );

  for (const filePath of candidates) {
    const dataUrl = await readImageAsDataUrl(filePath);
    if (dataUrl) return dataUrl;
  }

  return null;
}

function digitsOnly(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function toWhatsappNumber(phone?: string | null) {
  const digits = digitsOnly(phone);
  if (!digits) return "";

  if (digits.startsWith("55")) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;

  return digits;
}

function buildWhatsappUrl(phone?: string | null, text?: string | null) {
  const number = toWhatsappNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text || "")}`;
}

function buildBuyerSignatureMessage(input: {
  clientName?: string | null;
  contractNumber?: string | null;
  developmentName?: string | null;
  lotCode?: string | null;
  buyerLink: string;
}) {
  return [
    `Olá, ${input.clientName || "cliente"}.`,
    "",
    `Segue o link para assinatura do contrato ${input.contractNumber || ""}.`,
    `${input.developmentName || ""} - lote ${input.lotCode || ""}`,
    "",
    input.buyerLink,
  ].join("\n");
}

function getRequestIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0];
  }

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || null;
}

function renderPublicSignaturePage(input: {
  token: string;
  signerRole: string;
  signerName: string;
  signerDocument: string;
  signerEmail: string;
  signerPhone: string;
  saleSummary: string;
  expiresAt: string;
}) {
  const roleLabel = input.signerRole === "buyer" ? "Comprador(a)" : "Assinante";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assinatura de contrato</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f7fb;
      margin: 0;
      padding: 24px;
      color: #1f2937;
    }
    .wrap {
      max-width: 860px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    h1 {
      margin-top: 0;
      font-size: 28px;
    }
    .muted {
      color: #6b7280;
      font-size: 14px;
    }
    .box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
    }
    label {
      display: block;
      margin-top: 14px;
      font-weight: 600;
      font-size: 14px;
    }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 14px;
      margin-top: 6px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 14px;
    }
    canvas {
      width: 100%;
      height: 240px;
      border: 2px dashed #9ca3af;
      border-radius: 12px;
      background: #fff;
      touch-action: none;
      margin-top: 8px;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    button {
      border: 0;
      border-radius: 10px;
      padding: 12px 18px;
      font-size: 14px;
      cursor: pointer;
    }
    .primary {
      background: #2563eb;
      color: white;
    }
    .secondary {
      background: #e5e7eb;
      color: #111827;
    }
    .checkbox {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 16px;
      font-size: 14px;
    }
    .checkbox input {
      width: auto;
      margin-top: 2px;
    }
    #result {
      margin-top: 16px;
      font-weight: 600;
    }
    @media (max-width: 700px) {
      .row {
        grid-template-columns: 1fr;
      }
      body {
        padding: 12px;
      }
      .wrap {
        padding: 16px;
      }
      canvas {
        height: 200px;
      }
      .actions {
        flex-direction: column;
      }
      .actions button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Assinatura eletrônica do contrato</h1>
    <div class="muted">Assinante: ${escapeHtml(roleLabel)}</div>

    <div class="box">
      <strong>Resumo da venda</strong>
      <div style="margin-top: 8px;">${escapeHtml(input.saleSummary)}</div>
      <div class="muted" style="margin-top: 8px;">Link válido até: ${escapeHtml(
        input.expiresAt,
      )}</div>
    </div>

    <form id="signatureForm">
      <div class="row">
        <div>
          <label>Nome do assinante</label>
          <input id="signerName" value="${escapeHtml(
            input.signerName,
          )}" placeholder="Nome completo" />
        </div>
        <div>
          <label>Documento</label>
          <input id="signerDocument" value="${escapeHtml(
            input.signerDocument,
          )}" placeholder="CPF/CNPJ/RG" />
        </div>
      </div>

      <div class="row">
        <div>
          <label>E-mail</label>
          <input id="signerEmail" value="${escapeHtml(
            input.signerEmail,
          )}" placeholder="E-mail" />
        </div>
        <div>
          <label>Telefone</label>
          <input id="signerPhone" value="${escapeHtml(
            input.signerPhone,
          )}" placeholder="Telefone" />
        </div>
      </div>

      <label>Desenhe a assinatura abaixo</label>
      <canvas id="signaturePad"></canvas>

      <div class="checkbox">
        <input type="checkbox" id="accepted" />
        <label for="accepted" style="margin-top: 0; font-weight: 400;">
          Declaro que li e concordo com o contrato, e reconheço esta assinatura
          desenhada como minha manifestação eletrônica de vontade.
        </label>
      </div>

      <div class="actions">
        <button type="button" class="secondary" id="clearBtn">Limpar assinatura</button>
        <button type="submit" class="primary">Assinar e concluir</button>
      </div>
    </form>

    <div id="result"></div>
  </div>

  <script>
    const token = ${JSON.stringify(input.token)};
    const canvas = document.getElementById("signaturePad");
    const ctx = canvas.getContext("2d");
    const form = document.getElementById("signatureForm");
    const result = document.getElementById("result");
    const clearBtn = document.getElementById("clearBtn");

    function resizeCanvas() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111827";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let drawing = false;
    let hasDrawn = false;

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches && event.touches[0];
      const clientX = touch ? touch.clientX : event.clientX;
      const clientY = touch ? touch.clientY : event.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }

    function startDraw(event) {
      drawing = true;
      const point = getPoint(event);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      event.preventDefault();
    }

    function draw(event) {
      if (!drawing) return;
      const point = getPoint(event);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      hasDrawn = true;
      event.preventDefault();
    }

    function endDraw(event) {
      drawing = false;
      event.preventDefault();
    }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDraw, { passive: false });

    clearBtn.addEventListener("click", () => {
      resizeCanvas();
      hasDrawn = false;
      result.textContent = "";
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!hasDrawn) {
        result.textContent = "Desenhe a assinatura antes de concluir.";
        return;
      }

      const accepted = document.getElementById("accepted").checked;
      if (!accepted) {
        result.textContent = "É necessário confirmar o aceite para concluir.";
        return;
      }

      const payload = {
        signerName: document.getElementById("signerName").value,
        signerDocument: document.getElementById("signerDocument").value,
        signerEmail: document.getElementById("signerEmail").value,
        signerPhone: document.getElementById("signerPhone").value,
        signatureDataUrl: canvas.toDataURL("image/png"),
        accepted: true,
      };

      result.textContent = "Enviando assinatura...";

      try {
        const response = await fetch("/api/public/sign/" + token, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          result.textContent = data?.message || "Não foi possível salvar a assinatura.";
          return;
        }

        document.body.innerHTML =
          '<div style="font-family: Arial, sans-serif; max-width: 720px; margin: 40px auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">' +
            '<h1 style="margin-top: 0;">Assinatura concluída com sucesso</h1>' +
            '<p>' + (data?.message || "A assinatura foi registrada.") + '</p>' +
          '</div>';
      } catch (error) {
        result.textContent = "Erro ao enviar assinatura.";
      }
    });
  </script>
</body>
</html>`;
}

async function ensureLotsForDevelopmentInDatabase(developmentId: string) {
  if (!pool || !developmentId) return;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM lots WHERE development_id = $1`,
    [developmentId],
  );

  const existingTotal = countResult.rows[0]?.total ?? 0;
  if (existingTotal > 0) return;

  const developmentResult = await pool.query(
    `
      SELECT id, name, total_lots, price
      FROM public_developments
      WHERE id = $1
      LIMIT 1
    `,
    [developmentId],
  );

  const development = developmentResult.rows[0] as
    | {
        id: string;
        name: string;
        total_lots: number;
        price: string;
      }
    | undefined;

  if (!development) return;

  const generatedLots = buildGeneratedLotsForDevelopment({
    developmentId: development.id,
    developmentName: development.name,
    totalLots: development.total_lots ?? 0,
    basePrice: normalizePriceToNumber(development.price),
  });

  if (!generatedLots.length) return;

  for (const lot of generatedLots) {
    await pool.query(
      `
        INSERT INTO lots (
          id,
          development_id,
          code,
          block,
          lot,
          area_m2,
          front_m,
          price,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        randomUUID(),
        development.id,
        lot.code,
        lot.block,
        lot.lot,
        lot.areaM2,
        lot.frontM,
        lot.price,
        lot.status,
      ],
    );
  }
}

async function ensureSalesTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      contract_number TEXT NOT NULL,
      client_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      development_id TEXT NOT NULL,
      development_name TEXT NOT NULL,
      lot_id TEXT NOT NULL,
      lot_code TEXT NOT NULL,
      broker_id TEXT,
      broker_name TEXT,
      total_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      down_payment_value NUMERIC(14,2) NOT NULL DEFAULT 0,
      financed_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      installments INTEGER NOT NULL DEFAULT 1,
      interest_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
      correction_index TEXT NOT NULL DEFAULT 'IGP-M',
      first_installment NUMERIC(14,2) NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'Financiamento direto',
      sale_date DATE NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'rascunho',
      contract_status TEXT NOT NULL DEFAULT 'gerado',
      signature_status TEXT NOT NULL DEFAULT 'pendente',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureContractTemplatesTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contract_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureContractSignatureRequestsTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contract_signature_requests (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      signer_role TEXT NOT NULL,
      signer_name TEXT,
      signer_document TEXT,
      signer_email TEXT,
      signer_phone TEXT,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureContractSignaturesTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contract_signatures (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      signature_request_id TEXT,
      signer_role TEXT NOT NULL,
      signer_name TEXT NOT NULL,
      signer_document TEXT,
      signer_email TEXT,
      signer_phone TEXT,
      signature_data_url TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function recalculateSaleSignatureState(saleId: string) {
  if (!pool || !saleId) return;

  const saleResult = await pool.query(
    `
      SELECT
        s.id,
        s.lot_id,
        s.status,
        d.billing_entity_id
      FROM sales s
      LEFT JOIN public_developments d ON d.id = s.development_id
      WHERE s.id = $1
      LIMIT 1
    `,
    [saleId],
  );

  const sale = saleResult.rows[0];
  if (!sale) return;

  if (sale.status === "cancelado") {
    return;
  }

  const sellerDefaultSignatureDataUrl = await getSellerDefaultSignatureDataUrl(
    sale.billing_entity_id,
  );

  const latestBuyerRequestResult = await pool.query(
    `
      SELECT
        id,
        status
      FROM contract_signature_requests
      WHERE sale_id = $1
        AND signer_role = 'buyer'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [saleId],
  );

  const latestBuyerRequest = latestBuyerRequestResult.rows[0];

  if (!latestBuyerRequest) {
    return;
  }

  const buyerSigned = latestBuyerRequest.status === "signed";
  const sellerSigned = Boolean(sellerDefaultSignatureDataUrl);

  let saleStatus = "aguardando_assinatura";
  let contractStatus = "enviado";
  let signatureStatus = "pendente";
  let lotStatus: "Disponível" | "Reservado" | "Vendido" = "Reservado";

  if (buyerSigned && sellerSigned) {
    saleStatus = "assinado";
    contractStatus = "assinado";
    signatureStatus = "concluida";
    lotStatus = "Vendido";
  } else if (buyerSigned && !sellerSigned) {
    saleStatus = "aguardando_assinatura";
    contractStatus = "enviado";
    signatureStatus = "parcial";
    lotStatus = "Reservado";
  }

  await pool.query(
    `
      UPDATE sales
      SET
        status = $2,
        contract_status = $3,
        signature_status = $4,
        updated_at = NOW()
      WHERE id = $1
    `,
    [saleId, saleStatus, contractStatus, signatureStatus],
  );

  await pool.query(
    `
      UPDATE lots
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1
    `,
    [sale.lot_id, lotStatus],
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "smartloteia-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 12,
      },
      store: new MemoryStore({
        checkPeriod: 1000 * 60 * 60,
      }),
    }),
  );

  if (isDatabaseConfigured) {
    try {
      await ensurePublicInterestsTable();
      await ensureClientsTable();
      await ensureBillingEntitiesTable();
      await ensureBrokersTable();
      await ensurePublicDevelopmentsTable();
      await ensureLotsTable();
      await ensureSalesTable();
      await ensureContractTemplatesTable();
      await ensureContractSignatureRequestsTable();
      await ensureContractSignaturesTable();
    } catch (error) {
      console.error("Falha ao preparar tabelas públicas:", error);
    }
  }

  app.get("/api/health", (_req, res) => {
    return res.json({
      ok: true,
      app: "SmartloteIA",
      mode: process.env.NODE_ENV ?? "development",
    });
  });

  app.get("/api/system/db-status", async (_req, res) => {
    const status = await getDatabaseStatus();
    return res.json(status);
  });

  app.get("/api/public/developments", async (_req, res) => {
    try {
      if (!pool) {
        return res.status(200).json([]);
      }

      const result = await pool.query(`
        SELECT
          id,
          billing_entity_id,
          name,
          city,
          type,
          price,
          img,
          status,
          area,
          financing,
          description,
          highlights,
          total_lots,
          plant_pdf_url,
          plant_image_url,
          overview_image_url
        FROM public_developments
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, created_at ASC
      `);

      return res.status(200).json(
        result.rows.map((row) => ({
          id: row.id,
          billingEntityId: row.billing_entity_id,
          name: row.name,
          city: row.city,
          type: row.type,
          price: row.price,
          img: row.img,
          status: row.status,
          area: row.area,
          financing: row.financing,
          description: row.description,
          highlights: Array.isArray(row.highlights) ? row.highlights : [],
          totalLots: row.total_lots ?? 0,
          plantPdfUrl: row.plant_pdf_url,
          plantImageUrl: row.plant_image_url,
          overviewImageUrl: row.overview_image_url,
        })),
      );
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar os empreendimentos públicos",
      });
    }
  });

  app.get("/api/admin/billing-entities", requireAuth, async (_req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const result = await pool!.query(`
        SELECT
          id,
          corporate_name,
          trade_name,
          document,
          bank_code,
          bank_name,
          agency,
          account_number,
          wallet_code,
          agreement_code,
          cnab_layout,
          beneficiary_name,
          beneficiary_document,
          notes,
          is_active,
          created_at,
          updated_at
        FROM billing_entities
        ORDER BY created_at DESC
      `);

      return res.status(200).json(
        result.rows.map((row) => ({
          id: row.id,
          corporateName: row.corporate_name,
          tradeName: row.trade_name,
          document: row.document,
          bankCode: row.bank_code,
          bankName: row.bank_name,
          agency: row.agency,
          accountNumber: row.account_number,
          walletCode: row.wallet_code,
          agreementCode: row.agreement_code,
          cnabLayout: row.cnab_layout,
          beneficiaryName: row.beneficiary_name,
          beneficiaryDocument: row.beneficiary_document,
          notes: row.notes,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      );
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar as entidades cobradoras",
      });
    }
  });

  app.post("/api/admin/billing-entities", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const payload = billingEntitySchema.parse(req.body);
      const id = randomUUID();

      await pool!.query(
        `
          INSERT INTO billing_entities (
            id,
            corporate_name,
            trade_name,
            document,
            bank_code,
            bank_name,
            agency,
            account_number,
            wallet_code,
            agreement_code,
            cnab_layout,
            beneficiary_name,
            beneficiary_document,
            notes,
            is_active
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, TRUE
          )
        `,
        [
          id,
          payload.corporateName,
          payload.tradeName ?? null,
          payload.document,
          payload.bankCode ?? null,
          payload.bankName ?? null,
          payload.agency ?? null,
          payload.accountNumber ?? null,
          payload.walletCode ?? null,
          payload.agreementCode ?? null,
          payload.cnabLayout ?? "CNAB240",
          payload.beneficiaryName ?? null,
          payload.beneficiaryDocument ?? null,
          payload.notes ?? null,
        ],
      );

      return res.status(201).json({
        success: true,
        id,
        message: "Entidade cobradora cadastrada com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível cadastrar a entidade cobradora",
      });
    }
  });


  app.patch("/api/admin/billing-entities/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const { id } = req.params;
      const payload = billingEntitySchema.parse(req.body);

      const existing = await pool!.query(
        `
          SELECT id
          FROM billing_entities
          WHERE id = $1
          LIMIT 1
        `,
        [id],
      );

      if (!existing.rowCount) {
        return res.status(404).json({
          message: "Entidade cobradora não encontrada",
        });
      }

      const duplicate = await pool!.query(
        `
          SELECT id
          FROM billing_entities
          WHERE document = $1
            AND id <> $2
          LIMIT 1
        `,
        [payload.document, id],
      );

      if (duplicate.rowCount) {
        return res.status(400).json({
          message: "Já existe outra entidade com esse documento",
        });
      }

      const result = await pool!.query(
        `
          UPDATE billing_entities
          SET
            corporate_name = $2,
            trade_name = $3,
            document = $4,
            bank_code = $5,
            bank_name = $6,
            agency = $7,
            account_number = $8,
            wallet_code = $9,
            agreement_code = $10,
            cnab_layout = $11,
            beneficiary_name = $12,
            beneficiary_document = $13,
            notes = $14,
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            corporate_name,
            trade_name,
            document,
            bank_code,
            bank_name,
            agency,
            account_number,
            wallet_code,
            agreement_code,
            cnab_layout,
            beneficiary_name,
            beneficiary_document,
            notes,
            is_active,
            created_at,
            updated_at
        `,
        [
          id,
          payload.corporateName,
          payload.tradeName ?? null,
          payload.document,
          payload.bankCode ?? null,
          payload.bankName ?? null,
          payload.agency ?? null,
          payload.accountNumber ?? null,
          payload.walletCode ?? null,
          payload.agreementCode ?? null,
          payload.cnabLayout ?? "CNAB240",
          payload.beneficiaryName ?? null,
          payload.beneficiaryDocument ?? null,
          payload.notes ?? null,
        ],
      );

      const row = result.rows[0];

      return res.status(200).json({
        id: row.id,
        corporateName: row.corporate_name,
        tradeName: row.trade_name,
        document: row.document,
        bankCode: row.bank_code,
        bankName: row.bank_name,
        agency: row.agency,
        accountNumber: row.account_number,
        walletCode: row.wallet_code,
        agreementCode: row.agreement_code,
        cnabLayout: row.cnab_layout,
        beneficiaryName: row.beneficiary_name,
        beneficiaryDocument: row.beneficiary_document,
        notes: row.notes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível atualizar a entidade cobradora",
      });
    }
  });

  app.delete("/api/admin/billing-entities/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const { id } = req.params;

      const existing = await pool!.query(
        `
          SELECT id
          FROM billing_entities
          WHERE id = $1
          LIMIT 1
        `,
        [id],
      );

      if (!existing.rowCount) {
        return res.status(404).json({
          message: "Entidade cobradora não encontrada",
        });
      }

      const developmentLinks = await pool!.query(
        `
          SELECT COUNT(*)::int AS total
          FROM public_developments
          WHERE billing_entity_id = $1
        `,
        [id],
      );

      const brokerLinks = await pool!.query(
        `
          SELECT COUNT(*)::int AS total
          FROM brokers
          WHERE billing_entity_id = $1
        `,
        [id],
      );

      const salesLinks = await pool!.query(
        `
          SELECT COUNT(*)::int AS total
          FROM sales
          WHERE billing_entity_id = $1
        `,
        [id],
      );

      const financialTables = await getFinancialTablePresence(pool as unknown as SqlExecutor);

      let receivableLinksCount = 0;
      let installmentLinksCount = 0;

      if (financialTables.receivables) {
        const receivableLinks = await pool!.query(
          `
            SELECT COUNT(*)::int AS total
            FROM financial_receivables
            WHERE billing_entity_id = $1
          `,
          [id],
        );
        receivableLinksCount = receivableLinks.rows[0]?.total ?? 0;
      }

      if (financialTables.installments) {
        const installmentLinks = await pool!.query(
          `
            SELECT COUNT(*)::int AS total
            FROM financial_installments
            WHERE billing_entity_id = $1
          `,
          [id],
        );
        installmentLinksCount = installmentLinks.rows[0]?.total ?? 0;
      }

      const totalLinks =
        (developmentLinks.rows[0]?.total ?? 0) +
        (brokerLinks.rows[0]?.total ?? 0) +
        (salesLinks.rows[0]?.total ?? 0) +
        receivableLinksCount +
        installmentLinksCount;

      if (totalLinks > 0) {
        return res.status(400).json({
          message:
            "Não é possível excluir esta entidade porque ela possui vínculos com empreendimentos, corretores, vendas ou financeiro.",
        });
      }

      await pool!.query(
        `
          DELETE FROM billing_entities
          WHERE id = $1
        `,
        [id],
      );

      return res.status(200).json({
        success: true,
        message: "Entidade cobradora excluída com sucesso",
      });
    } catch {
      return res.status(500).json({
        message: "Não foi possível excluir a entidade cobradora",
      });
    }
  });

  app.get("/api/admin/brokers", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const params: any[] = [];
      const where: string[] = [];

      await appendBillingEntityScope(scope, params, where, "b.billing_entity_id");

      let query = `
        SELECT
          b.id,
          b.billing_entity_id,
          b.name,
          b.email,
          b.phone,
          b.creci,
          b.notes,
          b.is_active,
          b.created_at,
          b.updated_at,
          be.corporate_name AS billing_entity_name,
          be.trade_name AS billing_entity_trade_name
        FROM brokers b
        LEFT JOIN billing_entities be ON be.id = b.billing_entity_id
      `;

      if (where.length > 0) {
        query += ` WHERE ${where.join(" AND ")}`;
      }

      query += ` ORDER BY b.created_at DESC`;

      const result = await pool!.query(query, params);

      return res.status(200).json(
        result.rows.map((row) => ({
          id: row.id,
          billingEntityId: row.billing_entity_id,
          billingEntityName:
            row.billing_entity_trade_name || row.billing_entity_name,
          corporateName: row.billing_entity_name,
          tradeName: row.billing_entity_trade_name,
          name: row.name,
          email: row.email,
          phone: row.phone,
          creci: row.creci,
          notes: row.notes,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      );
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar os corretores",
      });
    }
  });

  app.post("/api/admin/brokers", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const payload = brokerSchema.parse(req.body);

      const canUseBillingEntity = await ensureCanAccessBillingEntityId(
        scope,
        payload.billingEntityId,
      );

      if (!canUseBillingEntity) {
        return res.status(403).json({
          message: "Você não pode cadastrar corretor fora do seu empreendimento/entidade.",
        });
      }

      const id = randomUUID();

      await pool!.query(
        `
          INSERT INTO brokers (
            id,
            billing_entity_id,
            name,
            email,
            phone,
            creci,
            notes,
            is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        `,
        [
          id,
          payload.billingEntityId,
          payload.name,
          payload.email ?? null,
          payload.phone ?? null,
          payload.creci ?? null,
          payload.notes ?? null,
        ],
      );

      return res.status(201).json({
        success: true,
        id,
        message: "Corretor cadastrado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível cadastrar o corretor",
      });
    }
  });

  app.put("/api/admin/brokers/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const payload = brokerUpdateSchema.parse(req.body);

      const brokerResult = await pool!.query(
        `SELECT id, billing_entity_id FROM brokers WHERE id = $1 LIMIT 1`,
        [req.params.id],
      );

      const broker = brokerResult.rows[0];

      if (!broker) {
        return res.status(404).json({ message: "Corretor não encontrado" });
      }

      const canAccessCurrent = await ensureCanAccessBillingEntityId(
        scope,
        broker.billing_entity_id,
      );

      const canAccessTarget = await ensureCanAccessBillingEntityId(
        scope,
        payload.billingEntityId,
      );

      if (!canAccessCurrent || !canAccessTarget) {
        return res.status(403).json({
          message: "Você não pode alterar corretor fora do seu empreendimento/entidade.",
        });
      }

      const result = await pool!.query(
        `
          UPDATE brokers
          SET
            billing_entity_id = $2,
            name = $3,
            email = $4,
            phone = $5,
            creci = $6,
            notes = $7,
            is_active = COALESCE($8, is_active),
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [
          req.params.id,
          payload.billingEntityId,
          payload.name,
          payload.email ?? null,
          payload.phone ?? null,
          payload.creci ?? null,
          payload.notes ?? null,
          typeof payload.isActive === "boolean" ? payload.isActive : null,
        ],
      );

      if (!result.rows[0]) {
        return res.status(404).json({ message: "Corretor não encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Corretor atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível atualizar o corretor",
      });
    }
  });

  app.delete("/api/admin/brokers/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const brokerId = req.params.id;

      const brokerResult = await pool!.query(
        `SELECT id, billing_entity_id FROM brokers WHERE id = $1 LIMIT 1`,
        [brokerId],
      );

      const broker = brokerResult.rows[0];

      if (!broker) {
        return res.status(404).json({ message: "Corretor não encontrado" });
      }

      const canAccessBroker = await ensureCanAccessBillingEntityId(
        scope,
        broker.billing_entity_id,
      );

      if (!canAccessBroker) {
        return res.status(403).json({
          message: "Você não pode excluir/inativar corretor fora do seu empreendimento/entidade.",
        });
      }

      const linkedClients = await pool!.query(
        `
          SELECT COUNT(*)::int AS total
          FROM clients
          WHERE broker_id = $1
        `,
        [brokerId],
      );

      const linkedSales = await pool!.query(
        `
          SELECT COUNT(*)::int AS total
          FROM sales
          WHERE broker_id = $1
        `,
        [brokerId],
      );

      const totalLinkedClients = linkedClients.rows[0]?.total ?? 0;
      const totalLinkedSales = linkedSales.rows[0]?.total ?? 0;

      if (totalLinkedClients > 0 || totalLinkedSales > 0) {
        const inactivateResult = await pool!.query(
          `
            UPDATE brokers
            SET
              is_active = FALSE,
              updated_at = NOW()
            WHERE id = $1
            RETURNING id
          `,
          [brokerId],
        );

        if (!inactivateResult.rows[0]) {
          return res.status(404).json({ message: "Corretor não encontrado" });
        }

        return res.status(200).json({
          success: true,
          inactivated: true,
          message:
            "Corretor possui histórico vinculado e foi inativado em vez de excluído",
        });
      }

      const result = await pool!.query(
        `
          DELETE FROM brokers
          WHERE id = $1
          RETURNING id
        `,
        [brokerId],
      );

      if (!result.rows[0]) {
        return res.status(404).json({ message: "Corretor não encontrado" });
      }

      return res.status(200).json({
        success: true,
        deleted: true,
        message: "Corretor excluído com sucesso",
      });
    } catch {
      return res.status(500).json({
        message: "Não foi possível excluir o corretor",
      });
    }
  });

  app.get("/api/admin/lots", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const developmentId =
        typeof req.query.developmentId === "string"
          ? req.query.developmentId
          : "";

      if (developmentId) {
        const canAccessRequestedDevelopment = await ensureCanAccessDevelopmentAsync(
          scope,
          developmentId,
        );

        if (!canAccessRequestedDevelopment) {
          return res.status(403).json({
            message: "Você não pode acessar lotes de outro empreendimento.",
          });
        }

        await ensureLotsForDevelopmentInDatabase(developmentId);
      }

      const params: any[] = [];
      const where: string[] = [];

      if (developmentId) {
        params.push(developmentId);
        where.push(`l.development_id = $${params.length}`);
      }

      await appendDevelopmentScope(scope, params, where, "l.development_id");

      let query = `
        SELECT
          l.id,
          l.development_id,
          l.code,
          l.block,
          l.lot,
          l.area_m2,
          l.front_m,
          l.price,
          l.status,
          l.created_at,
          l.updated_at,
          d.name AS development_name
        FROM lots l
        LEFT JOIN public_developments d ON d.id = l.development_id
      `;

      if (where.length > 0) {
        query += ` WHERE ${where.join(" AND ")}`;
      }

      query += ` ORDER BY d.name ASC, l.block ASC, l.lot ASC`;

      const result = await pool!.query(query, params);

      return res.status(200).json(
        result.rows.map((row) => ({
          id: row.id,
          developmentId: row.development_id,
          developmentName: row.development_name,
          code: row.code,
          block: row.block,
          lot: row.lot,
          areaM2: row.area_m2 ?? 0,
          frontM: Number(row.front_m ?? 0),
          price: row.price,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      );
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar os lotes",
      });
    }
  });

  app.post("/api/admin/lots", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const payload = lotSchema.parse(req.body);

      const canAccessDevelopment = await ensureCanAccessDevelopmentAsync(
        scope,
        payload.developmentId,
      );

      if (!canAccessDevelopment) {
        return res.status(403).json({
          message: "Você não pode cadastrar lote em outro empreendimento.",
        });
      }

      const id = randomUUID();

      await pool!.query(
        `
          INSERT INTO lots (
            id,
            development_id,
            code,
            block,
            lot,
            area_m2,
            front_m,
            price,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          id,
          payload.developmentId,
          payload.code,
          payload.block,
          payload.lot,
          payload.areaM2,
          payload.frontM,
          payload.price,
          payload.status,
        ],
      );

      return res.status(201).json({
        success: true,
        id,
        message: "Lote cadastrado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível cadastrar o lote",
      });
    }
  });

  app.put("/api/admin/lots/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const payload = lotSchema.parse(req.body);

      const currentLotResult = await pool!.query(
        `SELECT id, development_id FROM lots WHERE id = $1 LIMIT 1`,
        [req.params.id],
      );

      const currentLot = currentLotResult.rows[0];

      if (!currentLot) {
        return res.status(404).json({ message: "Lote não encontrado" });
      }

      const canAccessCurrent = await ensureCanAccessDevelopmentAsync(
        scope,
        currentLot.development_id,
      );

      const canAccessTarget = await ensureCanAccessDevelopmentAsync(
        scope,
        payload.developmentId,
      );

      if (!canAccessCurrent || !canAccessTarget) {
        return res.status(403).json({
          message: "Você não pode alterar lote fora do seu empreendimento.",
        });
      }

      const result = await pool!.query(
        `
          UPDATE lots
          SET
            development_id = $2,
            code = $3,
            block = $4,
            lot = $5,
            area_m2 = $6,
            front_m = $7,
            price = $8,
            status = $9,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [
          req.params.id,
          payload.developmentId,
          payload.code,
          payload.block,
          payload.lot,
          payload.areaM2,
          payload.frontM,
          payload.price,
          payload.status,
        ],
      );

      if (!result.rows[0]) {
        return res.status(404).json({ message: "Lote não encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Lote atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível atualizar o lote",
      });
    }
  });

  app.get("/api/admin/developments", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const params: any[] = [];
      const where: string[] = [];

      await appendDevelopmentScope(scope, params, where, "d.id");

      let query = `
        SELECT
          d.id,
          d.billing_entity_id,
          d.name,
          d.city,
          d.type,
          d.price,
          d.img,
          d.status,
          d.area,
          d.financing,
          d.description,
          d.highlights,
          d.total_lots,
          d.plant_pdf_url,
          d.plant_image_url,
          d.overview_image_url,
          d.is_active,
          d.created_at,
          d.updated_at,
          b.corporate_name AS billing_entity_name
        FROM public_developments d
        LEFT JOIN billing_entities b ON b.id = d.billing_entity_id
      `;

      if (where.length > 0) {
        query += ` WHERE ${where.join(" AND ")}`;
      }

      query += ` ORDER BY d.created_at DESC`;

      const result = await pool!.query(query, params);

      return res.status(200).json(
        result.rows.map((row) => ({
          id: row.id,
          billingEntityId: row.billing_entity_id,
          billingEntityName: row.billing_entity_name,
          name: row.name,
          city: row.city,
          type: row.type,
          price: row.price,
          img: row.img,
          status: row.status,
          area: row.area,
          financing: row.financing,
          description: row.description,
          highlights: Array.isArray(row.highlights) ? row.highlights : [],
          totalLots: row.total_lots ?? 0,
          plantPdfUrl: row.plant_pdf_url,
          plantImageUrl: row.plant_image_url,
          overviewImageUrl: row.overview_image_url,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      );
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar os empreendimentos",
      });
    }
  });

  app.post("/api/admin/developments", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      if (!scope.isAdmin) {
        return res.status(403).json({
          message: "Somente o administrador geral pode cadastrar empreendimentos.",
        });
      }

      const payload = developmentSchema.parse(req.body);
      const id = randomUUID();

      await pool!.query(
        `
          INSERT INTO public_developments (
            id,
            billing_entity_id,
            name,
            city,
            type,
            price,
            img,
            status,
            area,
            financing,
            description,
            highlights,
            total_lots,
            plant_pdf_url,
            plant_image_url,
            overview_image_url,
            is_active,
            sort_order
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15, $16, TRUE, 999
          )
        `,
        [
          id,
          payload.billingEntityId,
          payload.name,
          payload.city,
          payload.type,
          payload.price,
          payload.img,
          payload.status,
          payload.area,
          payload.financing,
          payload.description,
          JSON.stringify(payload.highlights ?? []),
          payload.totalLots,
          payload.plantPdfUrl ?? null,
          payload.plantImageUrl ?? null,
          payload.overviewImageUrl ?? null,
        ],
      );

      if (payload.totalLots > 0) {
        await ensureLotsForDevelopmentInDatabase(id);
      }

      return res.status(201).json({
        success: true,
        id,
        message: "Empreendimento cadastrado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível cadastrar o empreendimento",
      });
    }
  });

  app.put("/api/admin/developments/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const canAccessDevelopment = await ensureCanAccessDevelopmentAsync(
        scope,
        req.params.id,
      );

      if (!canAccessDevelopment) {
        return res.status(403).json({
          message: "Você não pode alterar outro empreendimento.",
        });
      }

      const payload = developmentSchema.parse(req.body);

      const result = await pool!.query(
        `
          UPDATE public_developments
          SET
            billing_entity_id = $2,
            name = $3,
            city = $4,
            type = $5,
            price = $6,
            img = $7,
            status = $8,
            area = $9,
            financing = $10,
            description = $11,
            highlights = $12::jsonb,
            total_lots = $13,
            plant_pdf_url = $14,
            plant_image_url = $15,
            overview_image_url = $16,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [
          req.params.id,
          payload.billingEntityId,
          payload.name,
          payload.city,
          payload.type,
          payload.price,
          payload.img,
          payload.status,
          payload.area,
          payload.financing,
          payload.description,
          JSON.stringify(payload.highlights ?? []),
          payload.totalLots,
          payload.plantPdfUrl ?? null,
          payload.plantImageUrl ?? null,
          payload.overviewImageUrl ?? null,
        ],
      );

      if (!result.rows[0]) {
        return res.status(404).json({ message: "Empreendimento não encontrado" });
      }

      await ensureLotsForDevelopmentInDatabase(String(req.params.id));

      return res.status(200).json({
        success: true,
        message: "Empreendimento atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível atualizar o empreendimento",
      });
    }
  });

  app.get("/api/admin/clients", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const params: any[] = [];
      const where: string[] = [];

      await appendDevelopmentScope(scope, params, where, "c.project_id");

      let query = `
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
          c.broker_id,
          c.assigned_broker,
          c.notes,
          c.created_at,
          c.updated_at,
          b.name AS broker_name
        FROM clients c
        LEFT JOIN brokers b ON b.id = c.broker_id
      `;

      if (where.length > 0) {
        query += ` WHERE ${where.join(" AND ")}`;
      }

      query += ` ORDER BY c.created_at DESC`;

      const result = await pool!.query(query, params);

      return res.status(200).json(
        result.rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          phone: row.phone,
          email: row.email,
          city: row.city,
          objective: row.objective,
          budgetRange: row.budget_range,
          timeline: row.timeline,
          profileNotes: row.profile_notes,
          source: row.source,
          projectId: row.project_id,
          projectName: row.project_name,
          status: row.status,
          brokerId: row.broker_id,
          brokerName: row.broker_name ?? row.assigned_broker ?? null,
          assignedBroker: row.broker_name ?? row.assigned_broker ?? null,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      );
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar os clientes",
      });
    }
  });

  app.patch("/api/admin/clients/:id/assign-broker", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const payload = assignBrokerSchema.parse(req.body);
      const clientId = req.params.id;

      const clientResult = await pool!.query(
        `SELECT id, project_id FROM clients WHERE id = $1 LIMIT 1`,
        [clientId],
      );

      const client = clientResult.rows[0];

      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      const canAccessClient = await ensureCanAccessDevelopmentAsync(
        scope,
        client.project_id,
      );

      if (!canAccessClient) {
        return res.status(403).json({
          message: "Você não pode alterar cliente de outro empreendimento.",
        });
      }

      let brokerName: string | null = null;

      if (payload.brokerId) {
        const brokerResult = await pool!.query(
          `
            SELECT id, name, billing_entity_id
            FROM brokers
            WHERE id = $1 AND is_active = TRUE
            LIMIT 1
          `,
          [payload.brokerId],
        );

        const broker = brokerResult.rows[0];

        if (!broker) {
          return res.status(404).json({
            message: "Corretor não encontrado ou inativo",
          });
        }

        const canAccessBroker = await ensureCanAccessBillingEntityId(
          scope,
          broker.billing_entity_id,
        );

        if (!canAccessBroker) {
          return res.status(403).json({
            message: "Você não pode atribuir corretor de outro empreendimento/entidade.",
          });
        }

        brokerName = broker.name;
      }

      const updateResult = await pool!.query(
        `
          UPDATE clients
          SET
            broker_id = $2,
            assigned_broker = $3,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id, full_name, broker_id, assigned_broker
        `,
        [clientId, payload.brokerId ?? null, brokerName],
      );

      const updatedClient = updateResult.rows[0];

      if (!updatedClient) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      return res.status(200).json({
        success: true,
        id: updatedClient.id,
        fullName: updatedClient.full_name,
        brokerId: updatedClient.broker_id,
        assignedBroker: updatedClient.assigned_broker,
        message: brokerName
          ? "Corretor atribuído com sucesso"
          : "Corretor removido do cliente com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível atualizar o corretor do cliente",
      });
    }
  });

  app.post("/api/admin/interests/convert-to-client", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const payload = convertInterestToClientSchema.parse(req.body);

      const interestResult = await pool!.query(
        `
          SELECT
            id,
            project_id,
            project_name,
            source,
            full_name,
            phone,
            email,
            city_interest,
            objective,
            budget_range,
            timeline,
            family_profile,
            notes,
            status
          FROM public_interests
          WHERE id = $1
          LIMIT 1
        `,
        [payload.interestId],
      );

      const interest = interestResult.rows[0];

      if (!interest) {
        return res.status(404).json({ message: "Pré-atendimento não encontrado" });
      }

      const canAccessInterest = await ensureCanAccessDevelopmentAsync(
        scope,
        interest.project_id,
      );

      if (!canAccessInterest) {
        return res.status(403).json({
          message: "Você não pode converter pré-atendimento de outro empreendimento.",
        });
      }

      if (interest.status === "converted_client") {
        return res.status(400).json({
          message: "Este pré-atendimento já foi convertido em cliente",
        });
      }

      const clientId = randomUUID();

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
            notes
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, 'landing_ai', $10, $11, 'active', $12
          )
        `,
        [
          clientId,
          interest.full_name,
          interest.phone,
          interest.email,
          interest.city_interest,
          interest.objective,
          interest.budget_range,
          interest.timeline,
          interest.family_profile,
          interest.project_id,
          interest.project_name,
          interest.notes,
        ],
      );

      await pool!.query(
        `
          UPDATE public_interests
          SET status = 'converted_client',
              updated_at = NOW()
          WHERE id = $1
        `,
        [payload.interestId],
      );

      return res.status(201).json({
        success: true,
        clientId,
        message: "Pré-atendimento convertido em cliente com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível converter o pré-atendimento em cliente",
      });
    }
  });

  app.get("/api/sales", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const scope = await requireScopedUser(req, res);
      if (!scope) return;

      const recalcResult = await pool!.query(`
        SELECT id
        FROM sales
        WHERE status IN ('aguardando_assinatura', 'assinado')
      `);

      for (const row of recalcResult.rows) {
        await recalculateSaleSignatureState(row.id);
      }

      const params: any[] = [];
      const where: string[] = [];

      await appendDevelopmentScope(scope, params, where, "development_id");

      let query = `
        SELECT
          id,
          contract_number,
          client_id,
          client_name,
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
          sale_date,
          notes,
          status,
          contract_status,
          signature_status,
          created_at,
          updated_at
        FROM sales
      `;

      if (where.length > 0) {
        query += ` WHERE ${where.join(" AND ")}`;
      }

      query += ` ORDER BY updated_at DESC`;

      const result = await pool!.query(query, params);

      return res.status(200).json(
        result.rows.map((row) => ({
          id: row.id,
          contractNumber: row.contract_number,
          clientId: row.client_id,
          clientName: row.client_name,
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
          correctionIndex: row.correction_index,
          firstInstallment: Number(row.first_installment ?? 0),
          paymentMethod: row.payment_method,
          saleDate: row.sale_date,
          notes: row.notes,
          status: row.status,
          contractStatus: row.contract_status,
          signatureStatus: row.signature_status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      );
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar as vendas",
      });
    }
  });

  app.post("/api/sales", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const payload = saleSchema.parse(req.body);

      const activeSaleForLot = await pool!.query(
        `
          SELECT id
          FROM sales
          WHERE lot_id = $1
            AND status IN ('rascunho', 'aguardando_assinatura', 'assinado')
          LIMIT 1
        `,
        [payload.lotId],
      );

      if (activeSaleForLot.rows[0]) {
        return res.status(400).json({
          message: "Já existe uma venda ativa para esse lote",
        });
      }

      const id = randomUUID();
      const contractNumber = `CTR-${Date.now().toString().slice(-8)}`;

      await pool!.query(
        `
          INSERT INTO sales (
            id,
            contract_number,
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
            sale_date,
            notes,
            status,
            contract_status,
            signature_status
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, 'rascunho', 'gerado', 'pendente'
          )
        `,
        [
          id,
          contractNumber,
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
          payload.saleDate,
          payload.notes ?? null,
        ],
      );

      await pool!.query(
        `
          UPDATE lots
          SET
            status = 'Reservado',
            updated_at = NOW()
          WHERE id = $1
        `,
        [payload.lotId],
      );

      return res.status(201).json({
        success: true,
        id,
        contractNumber,
        message: "Venda criada com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível salvar a venda",
      });
    }
  });

  app.put("/api/sales/:id", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const payload = saleSchema.parse(req.body);

      const existingResult = await pool!.query(
        `
          SELECT id, lot_id
          FROM sales
          WHERE id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      const existing = existingResult.rows[0];

      if (!existing) {
        return res.status(404).json({ message: "Venda não encontrada" });
      }

      const conflictResult = await pool!.query(
        `
          SELECT id
          FROM sales
          WHERE lot_id = $1
            AND id <> $2
            AND status IN ('rascunho', 'aguardando_assinatura', 'assinado')
          LIMIT 1
        `,
        [payload.lotId, req.params.id],
      );

      if (conflictResult.rows[0]) {
        return res.status(400).json({
          message: "Já existe outra venda ativa para esse lote",
        });
      }

      await pool!.query(
        `
          UPDATE sales
          SET
            client_id = $2,
            client_name = $3,
            client_phone = $4,
            client_email = $5,
            development_id = $6,
            development_name = $7,
            lot_id = $8,
            lot_code = $9,
            broker_id = $10,
            broker_name = $11,
            total_value = $12,
            down_payment_value = $13,
            financed_amount = $14,
            installments = $15,
            interest_rate = $16,
            correction_index = $17,
            first_installment = $18,
            payment_method = $19,
            sale_date = $20,
            notes = $21,
            updated_at = NOW()
          WHERE id = $1
        `,
        [
          req.params.id,
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
          payload.saleDate,
          payload.notes ?? null,
        ],
      );

      if (existing.lot_id !== payload.lotId) {
        await pool!.query(
          `
            UPDATE lots
            SET
              status = 'Disponível',
              updated_at = NOW()
            WHERE id = $1
          `,
          [existing.lot_id],
        );

        await pool!.query(
          `
            UPDATE lots
            SET
              status = 'Reservado',
              updated_at = NOW()
            WHERE id = $1
          `,
          [payload.lotId],
        );
      }

      return res.status(200).json({
        success: true,
        id: req.params.id,
        message: "Venda atualizada com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível atualizar a venda",
      });
    }
  });

  app.patch("/api/sales/:id/status", requireAuth, async (req, res) => {
    if (!requireDatabase(res)) return;

    const client = await pool!.connect();

    try {
      const payload = saleStatusSchema.parse(req.body);

      await client.query("BEGIN");

      const saleResult = await client.query(
        `
          SELECT id, lot_id
          FROM sales
          WHERE id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      const sale = saleResult.rows[0];

      if (!sale) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Venda não encontrada" });
      }

      let contractStatus = "gerado";
      let signatureStatus = "pendente";
      let lotStatus: "Disponível" | "Reservado" | "Vendido" = "Reservado";

      if (payload.status === "aguardando_assinatura") {
        contractStatus = "enviado";
        signatureStatus = "pendente";
        lotStatus = "Reservado";
      }

      if (payload.status === "assinado") {
        contractStatus = "assinado";
        signatureStatus = "concluida";
        lotStatus = "Vendido";
      }

      if (payload.status === "cancelado") {
        contractStatus = "cancelado";
        signatureStatus = "cancelada";
        lotStatus = "Disponível";
      }

      if (payload.status === "rascunho") {
        contractStatus = "gerado";
        signatureStatus = "pendente";
        lotStatus = "Reservado";
      }

      await client.query(
        `
          UPDATE sales
          SET
            status = $2,
            contract_status = $3,
            signature_status = $4,
            updated_at = NOW()
          WHERE id = $1
        `,
        [req.params.id, payload.status, contractStatus, signatureStatus],
      );

      await client.query(
        `
          UPDATE lots
          SET
            status = $2,
            updated_at = NOW()
          WHERE id = $1
        `,
        [sale.lot_id, lotStatus],
      );

      let financial: {
        found: boolean;
        receivableId: string | null;
        cancelledInstallments: number;
        bankRequests: number;
      } | null = null;

      if (payload.status === "cancelado") {
        financial = await cancelFinancialForSaleInternal(
          String(req.params.id),
          {
            reason: "Venda cancelada pelo módulo comercial.",
            requestBankOps: true,
            createdBy: req.session.userId ?? null,
          },
          client,
        );
      }

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Status da venda atualizado com sucesso",
        financial,
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {}

      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível atualizar o status da venda",
      });
    } finally {
      client.release();
    }
  });

  app.delete("/api/sales/:id", requireAuth, async (req, res) => {
    if (!requireDatabase(res)) return;

    const client = await pool!.connect();

    try {
      await client.query("BEGIN");

      const saleResult = await client.query(
        `
          SELECT id, lot_id, status
          FROM sales
          WHERE id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      const sale = saleResult.rows[0];

      if (!sale) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Venda não encontrada" });
      }

      if (sale.status !== "cancelado") {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message:
            "Somente vendas canceladas podem ser excluídas definitivamente",
        });
      }

      const hasBankLife = await getSaleBankLifeInternal(String(req.params.id), client);
      if (hasBankLife) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message:
            "A venda possui vida bancária no financeiro e não pode ser excluída. Cancele a venda e trate a baixa/cancelamento bancário pela cobrança.",
        });
      }

      await deleteFinancialForSaleInternal(String(req.params.id), client);

      await client.query(
        `
          DELETE FROM contract_signatures
          WHERE sale_id = $1
        `,
        [req.params.id],
      );

      await client.query(
        `
          DELETE FROM contract_signature_requests
          WHERE sale_id = $1
        `,
        [req.params.id],
      );

      await client.query(
        `
          DELETE FROM sales
          WHERE id = $1
        `,
        [req.params.id],
      );

      await client.query(
        `
          UPDATE lots
          SET
            status = 'Disponível',
            updated_at = NOW()
          WHERE id = $1
        `,
        [sale.lot_id],
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Venda cancelada excluída com sucesso",
      });
    } catch {
      try {
        await client.query("ROLLBACK");
      } catch {}

      return res.status(500).json({
        message: "Não foi possível excluir a venda cancelada",
      });
    } finally {
      client.release();
    }
  });

  app.post("/api/sales/:id/signature-links", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const payload = signatureLinkSchema.parse(req.body);

      const saleResult = await pool!.query(
        `
          SELECT
            s.id,
            s.contract_number,
            s.client_name,
            s.client_phone,
            s.client_email,
            s.development_name,
            s.lot_code,
            s.sale_date,
            d.billing_entity_id,
            be.corporate_name AS seller_name,
            be.document AS seller_document
          FROM sales s
          LEFT JOIN public_developments d ON d.id = s.development_id
          LEFT JOIN billing_entities be ON be.id = d.billing_entity_id
          WHERE s.id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      const sale = saleResult.rows[0];

      if (!sale) {
        return res.status(404).json({ message: "Venda não encontrada" });
      }

      await pool!.query(
        `
          UPDATE contract_signature_requests
          SET status = 'replaced'
          WHERE sale_id = $1
            AND signer_role = 'buyer'
            AND status = 'pending'
        `,
        [req.params.id],
      );

      const expiresAt = new Date(
        Date.now() + (payload.expiresInHours ?? 72) * 60 * 60 * 1000,
      );

      const buyerToken = randomUUID();

      await pool!.query(
        `
          INSERT INTO contract_signature_requests (
            id,
            sale_id,
            signer_role,
            signer_name,
            signer_document,
            signer_email,
            signer_phone,
            token,
            status,
            expires_at
          )
          VALUES (
            $1, $2, 'buyer', $3, $4, $5, $6, $7, 'pending', $8
          )
        `,
        [
          randomUUID(),
          req.params.id,
          payload.buyerName ?? sale.client_name ?? "",
          payload.buyerDocument ?? null,
          payload.buyerEmail ?? sale.client_email ?? null,
          payload.buyerPhone ?? sale.client_phone ?? null,
          buyerToken,
          expiresAt.toISOString(),
        ],
      );

      await pool!.query(
        `
          UPDATE sales
          SET
            status = 'aguardando_assinatura',
            contract_status = 'enviado',
            signature_status = 'pendente',
            updated_at = NOW()
          WHERE id = $1
        `,
        [req.params.id],
      );

      const baseUrl = getPublicBaseUrl(req);
      const buyerLink = `${baseUrl}/public/sign/${buyerToken}`;
      const whatsappMessage = buildBuyerSignatureMessage({
        clientName: payload.buyerName ?? sale.client_name ?? "",
        contractNumber: sale.contract_number,
        developmentName: sale.development_name,
        lotCode: sale.lot_code,
        buyerLink,
      });
      const whatsappUrl = buildWhatsappUrl(
        payload.buyerPhone ?? sale.client_phone ?? null,
        whatsappMessage,
      );

      return res.status(201).json({
        success: true,
        message: "Link de assinatura do comprador gerado com sucesso",
        expiresAt: expiresAt.toISOString(),
        buyerLink,
        whatsappMessage,
        whatsappUrl,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível gerar o link de assinatura",
      });
    }
  });

  app.get("/api/sales/:id/signatures", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      await recalculateSaleSignatureState(String(req.params.id));

      const saleResult = await pool!.query(
        `
          SELECT
            s.id,
            s.contract_number,
            s.client_name,
            s.client_phone,
            s.development_name,
            s.lot_code,
            d.billing_entity_id,
            be.corporate_name AS seller_name,
            be.document AS seller_document
          FROM sales s
          LEFT JOIN public_developments d ON d.id = s.development_id
          LEFT JOIN billing_entities be ON be.id = d.billing_entity_id
          WHERE s.id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      const sale = saleResult.rows[0];

      if (!sale) {
        return res.status(404).json({
          message: "Venda não encontrada",
        });
      }

      const latestBuyerRequestResult = await pool!.query(
        `
          SELECT
            id,
            sale_id,
            signer_role,
            signer_name,
            signer_document,
            signer_email,
            signer_phone,
            token,
            status,
            expires_at,
            used_at,
            created_at
          FROM contract_signature_requests
          WHERE sale_id = $1
            AND signer_role = 'buyer'
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [req.params.id],
      );

      const latestBuyerRequest = latestBuyerRequestResult.rows[0] ?? null;

      let requests: any[] = [];
      let signatures: any[] = [];
      let buyerLink: string | null = null;
      let whatsappMessage: string | null = null;
      let whatsappUrl: string | null = null;

      if (latestBuyerRequest) {
        requests = [latestBuyerRequest];

        const buyerSignatureResult = await pool!.query(
          `
            SELECT
              id,
              sale_id,
              signature_request_id,
              signer_role,
              signer_name,
              signer_document,
              signer_email,
              signer_phone,
              signature_data_url,
              ip_address,
              user_agent,
              signed_at,
              created_at
            FROM contract_signatures
            WHERE sale_id = $1
              AND signature_request_id = $2
            ORDER BY signed_at DESC
            LIMIT 1
          `,
          [req.params.id, latestBuyerRequest.id],
        );

        if (buyerSignatureResult.rows[0]) {
          signatures = [buyerSignatureResult.rows[0]];
        }

        if (latestBuyerRequest.status === "pending" && latestBuyerRequest.token) {
          buyerLink = `${getPublicBaseUrl(req)}/public/sign/${latestBuyerRequest.token}`;
          whatsappMessage = buildBuyerSignatureMessage({
            clientName: latestBuyerRequest.signer_name || sale.client_name,
            contractNumber: sale.contract_number,
            developmentName: sale.development_name,
            lotCode: sale.lot_code,
            buyerLink,
          });
          whatsappUrl = buildWhatsappUrl(
            latestBuyerRequest.signer_phone || sale.client_phone || null,
            whatsappMessage,
          );
        }
      }

      const sellerDefaultSignatureDataUrl = await getSellerDefaultSignatureDataUrl(
        sale.billing_entity_id,
      );

      return res.status(200).json({
        requests,
        signatures,
        sellerDefaultSignatureDataUrl,
        sellerDefaultSignatureConfigured: Boolean(sellerDefaultSignatureDataUrl),
        sellerName: sale.seller_name || null,
        sellerDocument: sale.seller_document || null,
        buyerLink,
        whatsappMessage,
        whatsappUrl,
      });
    } catch {
      return res.status(500).json({
        message: "Não foi possível carregar as assinaturas da venda",
      });
    }
  });

  app.get("/public/sign/:token", async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const tokenResult = await pool!.query(
        `
          SELECT
            r.id,
            r.sale_id,
            r.signer_role,
            r.signer_name,
            r.signer_document,
            r.signer_email,
            r.signer_phone,
            r.status,
            r.expires_at,
            s.contract_number,
            s.client_name,
            s.development_name,
            s.lot_code
          FROM contract_signature_requests r
          LEFT JOIN sales s ON s.id = r.sale_id
          WHERE r.token = $1
          LIMIT 1
        `,
        [req.params.token],
      );

      const item = tokenResult.rows[0];

      if (!item) {
        return res
          .status(404)
          .send("<h1>Link de assinatura inválido ou inexistente.</h1>");
      }

      if (item.status === "signed") {
        return res
          .status(200)
          .send("<h1>Este documento já foi assinado com este link.</h1>");
      }

      if (item.status === "replaced") {
        return res
          .status(410)
          .send("<h1>Este link foi substituído por um link mais recente.</h1>");
      }

      if (item.status !== "pending") {
        return res
          .status(400)
          .send("<h1>Este link não está disponível para assinatura.</h1>");
      }

      const expiresAt = new Date(item.expires_at);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        return res.status(410).send("<h1>Este link de assinatura expirou.</h1>");
      }

      const html = renderPublicSignaturePage({
        token: req.params.token,
        signerRole: item.signer_role,
        signerName: item.signer_name || "",
        signerDocument: item.signer_document || "",
        signerEmail: item.signer_email || "",
        signerPhone: item.signer_phone || "",
        saleSummary: `Contrato ${item.contract_number} · ${item.client_name} · ${item.development_name} · Lote ${item.lot_code}`,
        expiresAt: formatDateTimeBR(item.expires_at),
      });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    } catch {
      return res
        .status(500)
        .send("<h1>Não foi possível abrir a página de assinatura.</h1>");
    }
  });

  app.post("/api/public/sign/:token", async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const tokenResult = await pool!.query(
        `
          SELECT
            id,
            sale_id,
            signer_role,
            status,
            expires_at
          FROM contract_signature_requests
          WHERE token = $1
          LIMIT 1
        `,
        [req.params.token],
      );

      const requestRow = tokenResult.rows[0];

      if (!requestRow) {
        return res.status(404).json({
          message: "Link de assinatura inválido ou inexistente",
        });
      }

      if (requestRow.status === "signed") {
        return res.status(400).json({
          message: "Este link já foi utilizado",
        });
      }

      if (requestRow.status === "replaced") {
        return res.status(410).json({
          message: "Este link foi substituído por um link mais recente",
        });
      }

      if (requestRow.status !== "pending") {
        return res.status(400).json({
          message: "Este link não está disponível para assinatura",
        });
      }

      const expiresAt = new Date(requestRow.expires_at);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        return res.status(410).json({
          message: "Este link expirou",
        });
      }

      const payload = publicSignatureSubmitSchema.parse(req.body);

      await pool!.query(
        `
          INSERT INTO contract_signatures (
            id,
            sale_id,
            signature_request_id,
            signer_role,
            signer_name,
            signer_document,
            signer_email,
            signer_phone,
            signature_data_url,
            ip_address,
            user_agent,
            signed_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
          )
        `,
        [
          randomUUID(),
          requestRow.sale_id,
          requestRow.id,
          requestRow.signer_role,
          payload.signerName,
          payload.signerDocument ?? null,
          payload.signerEmail ?? null,
          payload.signerPhone ?? null,
          payload.signatureDataUrl,
          getRequestIp(req),
          req.get("user-agent") || null,
        ],
      );

      await pool!.query(
        `
          UPDATE contract_signature_requests
          SET
            signer_name = $2,
            signer_document = $3,
            signer_email = $4,
            signer_phone = $5,
            status = 'signed',
            used_at = NOW()
          WHERE id = $1
        `,
        [
          requestRow.id,
          payload.signerName,
          payload.signerDocument ?? null,
          payload.signerEmail ?? null,
          payload.signerPhone ?? null,
        ],
      );

      await recalculateSaleSignatureState(requestRow.sale_id);

      return res.status(200).json({
        success: true,
        message: "Assinatura registrada com sucesso",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível salvar a assinatura",
      });
    }
  });

  app.get("/api/sales/:id/contract-preview", requireAuth, async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const saleResult = await pool!.query(
        `
          SELECT
            s.*,
            c.email AS client_email_from_db,
            d.billing_entity_id,
            be.corporate_name AS seller_name,
            be.document AS seller_document
          FROM sales s
          LEFT JOIN clients c ON c.id = s.client_id
          LEFT JOIN public_developments d ON d.id = s.development_id
          LEFT JOIN billing_entities be ON be.id = d.billing_entity_id
          WHERE s.id = $1
          LIMIT 1
        `,
        [req.params.id],
      );

      const sale = saleResult.rows[0];

      if (!sale) {
        return res.status(404).json({ message: "Venda não encontrada" });
      }

      const latestBuyerSignatureResult = await pool!.query(
        `
          SELECT
            cs.signer_name,
            cs.signer_document,
            cs.signature_data_url,
            cs.ip_address,
            cs.signed_at
          FROM contract_signatures cs
          INNER JOIN contract_signature_requests csr
            ON csr.id = cs.signature_request_id
          WHERE cs.sale_id = $1
            AND csr.signer_role = 'buyer'
          ORDER BY csr.created_at DESC, cs.signed_at DESC
          LIMIT 1
        `,
        [req.params.id],
      );

      const buyerSignature = latestBuyerSignatureResult.rows[0] ?? null;
      const sellerSignatureDataUrl = await getSellerDefaultSignatureDataUrl(
        sale.billing_entity_id,
      );

      const content = renderContractTemplate(defaultLotContractTemplate, {
        seller_name: sale.seller_name || "Loteadora",
        seller_document: sale.seller_document || "-",
        seller_signer_name: sale.seller_name || "-",
        seller_signer_document: sale.seller_document || "-",
        client_name: sale.client_name || "-",
        client_document: buyerSignature?.signer_document || "-",
        client_phone: sale.client_phone || "-",
        client_email: sale.client_email || sale.client_email_from_db || "-",
        development_name: sale.development_name || "-",
        lot_code: sale.lot_code || "-",
        sale_date: sale.sale_date || "-",
        total_value: `R$ ${Number(sale.total_value || 0).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        down_payment_value: `R$ ${Number(
          sale.down_payment_value || 0,
        ).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        financed_amount: `R$ ${Number(sale.financed_amount || 0).toLocaleString(
          "pt-BR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`,
        installments: String(sale.installments || 0),
        first_installment: `R$ ${Number(
          sale.first_installment || 0,
        ).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        interest_rate: String(sale.interest_rate || 0),
        correction_index: sale.correction_index || "-",
        payment_method: sale.payment_method || "-",
        notes: sale.notes || "-",
        broker_name: sale.broker_name || "-",
        buyer_signer_name: buyerSignature?.signer_name || sale.client_name || "-",
        buyer_signer_document: buyerSignature?.signer_document || "-",
        buyer_signature_status: buyerSignature ? "Assinado" : "Pendente",
        buyer_signed_at: buyerSignature
          ? formatDateTimeBR(buyerSignature.signed_at)
          : "-",
        seller_signature_status: sellerSignatureDataUrl
          ? "Assinatura padrão carregada"
          : "Pendente",
        seller_signed_at: sellerSignatureDataUrl ? "Arquivo padrão cadastrado" : "-",
      });

      return res.status(200).json({
        saleId: sale.id,
        contractNumber: sale.contract_number,
        content,
        buyerSignatureDataUrl: buyerSignature?.signature_data_url ?? null,
        sellerSignatureDataUrl,
        buyerIpAddress: buyerSignature?.ip_address ?? null,
      });
    } catch {
      return res.status(500).json({
        message: "Não foi possível gerar a prévia do contrato",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const payload = loginSchema.parse(req.body);
      const user = await storage.authenticate(payload.login, payload.password);

      if (!user) {
        clearAuthSession(req);
        return res.status(401).json({ message: "Usuário ou senha inválidos" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      return res.status(200).json({ user });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({ message: "Erro ao autenticar usuário" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((destroyError) => {
      if (destroyError) {
        return res
          .status(500)
          .json({ message: "Não foi possível encerrar a sessão" });
      }

      res.clearCookie("connect.sid");
      return res.status(200).json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const user = await getSessionUser(req);

    if (!user) {
      clearAuthSession(req);
      return res.status(401).json({ message: "Sessão expirada" });
    }

    return res.status(200).json(user);
  });

  app.get("/api/auth/session", requireAuth, async (req, res) => {
    const user = await getSessionUser(req);

    if (!user) {
      clearAuthSession(req);
      return res.status(401).json({ message: "Sessão expirada" });
    }

    return res.status(200).json({ authenticated: true, user });
  });

  app.post("/api/public/interests", async (req, res) => {
    try {
      if (!requireDatabase(res)) return;

      const payload = publicInterestSchema.parse(req.body);
      const id = randomUUID();

      await pool!.query(
        `
          INSERT INTO public_interests (
            id,
            project_id,
            project_name,
            source,
            full_name,
            phone,
            email,
            city_interest,
            objective,
            budget_range,
            timeline,
            family_profile,
            notes,
            status
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
        `,
        [
          id,
          payload.projectId ?? null,
          payload.projectName,
          payload.source ?? "landing_ai",
          payload.fullName,
          payload.phone,
          payload.email ?? null,
          payload.cityInterest ?? null,
          payload.objective ?? null,
          payload.budgetRange ?? null,
          payload.timeline ?? null,
          payload.familyProfile ?? null,
          payload.notes ?? null,
          "new",
        ],
      );

      return res.status(201).json({
        success: true,
        id,
        mode: "postgres",
        reference: `INT-${id.slice(0, 8).toUpperCase()}`,
        message: "Pré-atendimento salvo no banco de dados",
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Dados inválidos",
        });
      }

      return res.status(500).json({
        message: "Não foi possível registrar o pré-atendimento comercial",
      });
    }
  });

  app.get("/api/public/interests", requireAuth, async (_req, res) => {
    if (!requireDatabase(res)) return;

    const result = await pool!.query(`
      SELECT
        id,
        project_id,
        project_name,
        source,
        full_name,
        phone,
        email,
        city_interest,
        objective,
        budget_range,
        timeline,
        family_profile,
        notes,
        status,
        created_at,
        updated_at
      FROM public_interests
      ORDER BY created_at DESC
    `);

    return res.status(200).json(result.rows);
  });

  registerClientAdminRoutes(app);
  registerUserAdminRoutes(app);
  registerProposalRoutes(app);
  registerFinancialRoutes(app);

  return httpServer;
}