import type { Request, Response } from "express";
import type { SafeUser } from "@shared/schema";
import { storage } from "./storage";
import { pool } from "./db";

export type RequestScope = {
  user: SafeUser;
  isAdmin: boolean;
  developmentId: string | null;
  billingEntityId: string | null;
};

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

export async function getRequestScope(
  req: Request,
): Promise<RequestScope | null> {
  if (!req.session.userId) return null;

  const user = await storage.getSafeUser(req.session.userId);
  if (!user) return null;

  return {
    user,
    isAdmin: user.role === "admin",
    developmentId: user.developmentId ?? null,
    billingEntityId: user.billingEntityId ?? null,
  };
}

export async function requireScopedUser(
  req: Request,
  res: Response,
): Promise<RequestScope | null> {
  const scope = await getRequestScope(req);

  if (!scope) {
    res.status(401).json({ message: "Não autenticado" });
    return null;
  }

  if (!scope.isAdmin && !scope.developmentId && !scope.billingEntityId) {
    res.status(403).json({
      message:
        "Usuário sem escopo vinculado. Vincule o usuário a um empreendimento ou entidade cobradora.",
    });
    return null;
  }

  return scope;
}

export async function getScopedDevelopmentIds(
  scope: RequestScope,
): Promise<string[] | null> {
  if (scope.isAdmin) return null;

  if (scope.developmentId) {
    return [scope.developmentId];
  }

  if (scope.billingEntityId && pool) {
    const result = await pool.query(
      `
        SELECT id
        FROM public_developments
        WHERE billing_entity_id = $1
      `,
      [scope.billingEntityId],
    );

    return result.rows.map((row) => String(row.id));
  }

  return [];
}

export async function appendDevelopmentScope(
  scope: RequestScope,
  params: any[],
  where: string[],
  columnName: string,
): Promise<void> {
  if (scope.isAdmin) return;

  const developmentIds = await getScopedDevelopmentIds(scope);

  if (!developmentIds || developmentIds.length === 0) {
    where.push("1 = 0");
    return;
  }

  params.push(developmentIds);
  where.push(`${columnName} = ANY($${params.length}::text[])`);
}

export async function appendBillingEntityScope(
  scope: RequestScope,
  params: any[],
  where: string[],
  columnName: string,
): Promise<void> {
  if (scope.isAdmin) return;

  if (scope.billingEntityId) {
    params.push(scope.billingEntityId);
    where.push(`${columnName} = $${params.length}`);
    return;
  }

  const developmentIds = await getScopedDevelopmentIds(scope);

  if (!developmentIds || developmentIds.length === 0) {
    where.push("1 = 0");
    return;
  }

  if (!pool) {
    where.push("1 = 0");
    return;
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

  const billingEntityIds = result.rows
    .map((row) => row.billing_entity_id)
    .filter(Boolean)
    .map((value) => String(value));

  if (billingEntityIds.length === 0) {
    where.push("1 = 0");
    return;
  }

  params.push(billingEntityIds);
  where.push(`${columnName} = ANY($${params.length}::text[])`);
}

export function ensureCanAccessDevelopment(
  scope: RequestScope,
  developmentId?: string | null,
): boolean {
  if (scope.isAdmin) return true;
  if (!developmentId) return false;
  return scope.developmentId === developmentId;
}

export async function ensureCanAccessDevelopmentAsync(
  scope: RequestScope,
  developmentId?: string | null,
): Promise<boolean> {
  if (scope.isAdmin) return true;
  if (!developmentId) return false;

  const developmentIds = await getScopedDevelopmentIds(scope);
  if (!developmentIds) return true;

  return developmentIds.includes(String(developmentId));
}