import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { type InsertUser, type SafeUser, type User } from "@shared/schema";
import { pool } from "./db";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const hashedBuffer = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");

  if (hashedBuffer.length !== keyBuffer.length) return false;

  return timingSafeEqual(hashedBuffer, keyBuffer);
}

function sanitizeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function ensureUsersTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name TEXT NOT NULL,
      username VARCHAR(80) NOT NULL UNIQUE,
      email VARCHAR(160) NOT NULL UNIQUE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'broker', 'financial')),
      password_hash TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_bootstrap BOOLEAN NOT NULL DEFAULT FALSE,
      billing_entity_id VARCHAR(36),
      development_id VARCHAR(36),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_bootstrap BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_entity_id VARCHAR(36)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS development_id VARCHAR(36)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
}

function mapDbRowToUser(row: any): User {
  return {
    id: String(row.id),
    name: String(row.name),
    username: String(row.username),
    email: String(row.email),
    role: row.role,
    passwordHash: String(row.password_hash),
    isActive: Boolean(row.is_active),
    isBootstrap: Boolean(row.is_bootstrap),
    billingEntityId: row.billing_entity_id ? String(row.billing_entity_id) : null,
    developmentId: row.development_id ? String(row.development_id) : null,
    createdAt:
      row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getSafeUser(id: string): Promise<SafeUser | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<SafeUser>;
  authenticate(login: string, password: string): Promise<SafeUser | null>;
}

class DatabaseStorage implements IStorage {
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await ensureUsersTable();
        await this.bootstrapInitialAdmin();
      })();
    }

    await this.initPromise;
  }

  private async bootstrapInitialAdmin() {
    if (!pool) return;

    const result = await pool.query(`SELECT COUNT(*)::int AS total FROM users`);
    const total = Number(result.rows[0]?.total || 0);
    if (total > 0) return;

    const password = process.env.ADMIN_PASSWORD?.trim();
    if (!password) {
      console.warn(
        "[auth] Nenhum usuário encontrado. Defina ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL e ADMIN_PASSWORD para criar o admin inicial.",
      );
      return;
    }

    const adminUser: InsertUser = {
      name: process.env.ADMIN_NAME?.trim() || "Administrador SmartloteIA",
      username: process.env.ADMIN_USERNAME?.trim() || "admin",
      email: process.env.ADMIN_EMAIL?.trim() || "admin@abrolhos.eng.br",
      role: "admin",
      password,
      isActive: true,
      isBootstrap: true,
      billingEntityId: null,
      developmentId: null,
    };

    await this.insertUser(adminUser);
    console.log(`[auth] Usuário admin inicial criado: ${adminUser.username}`);
  }

  private async insertUser(insertUser: InsertUser): Promise<User> {
    if (!pool) {
      throw new Error("Banco de dados não configurado");
    }

    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      name: insertUser.name.trim(),
      username: normalizeUsername(insertUser.username),
      email: normalizeEmail(insertUser.email),
      role: insertUser.role ?? "broker",
      isActive: insertUser.isActive ?? true,
      isBootstrap: insertUser.isBootstrap ?? false,
      billingEntityId: insertUser.billingEntityId ?? null,
      developmentId: insertUser.developmentId ?? null,
      passwordHash: hashPassword(insertUser.password),
      createdAt: now,
      updatedAt: now,
    };

    await pool.query(
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
      [
        user.id,
        user.name,
        user.username,
        user.email,
        user.role,
        user.passwordHash,
        user.isActive,
        user.isBootstrap,
        user.billingEntityId,
        user.developmentId,
        user.createdAt,
        user.updatedAt,
      ],
    );

    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureInitialized();
    if (!pool) return undefined;

    const result = await pool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    const row = result.rows[0];
    return row ? mapDbRowToUser(row) : undefined;
  }

  async getSafeUser(id: string): Promise<SafeUser | undefined> {
    const user = await this.getUser(id);
    return user ? sanitizeUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    if (!pool) return undefined;

    const result = await pool.query(
      `SELECT * FROM users WHERE LOWER(username) = $1 LIMIT 1`,
      [normalizeUsername(username)],
    );
    const row = result.rows[0];
    return row ? mapDbRowToUser(row) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureInitialized();
    if (!pool) return undefined;

    const result = await pool.query(
      `SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizeEmail(email)],
    );
    const row = result.rows[0];
    return row ? mapDbRowToUser(row) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<SafeUser> {
    await this.ensureInitialized();
    if (!pool) {
      throw new Error("Banco de dados não configurado");
    }

    const username = normalizeUsername(insertUser.username);
    const email = normalizeEmail(insertUser.email);

    const existing = await pool.query(
      `
        SELECT id
        FROM users
        WHERE LOWER(username) = $1 OR LOWER(email) = $2
        LIMIT 1
      `,
      [username, email],
    );

    if (existing.rowCount) {
      throw new Error("Já existe um usuário com este login ou e-mail.");
    }

    const user = await this.insertUser({
      ...insertUser,
      username,
      email,
    });

    return sanitizeUser(user);
  }

  async authenticate(login: string, password: string): Promise<SafeUser | null> {
    await this.ensureInitialized();

    const normalizedLogin = login.trim().toLowerCase();

    const user = normalizedLogin.includes("@")
      ? await this.getUserByEmail(normalizedLogin)
      : await this.getUserByUsername(normalizedLogin);

    if (!user || !user.isActive) return null;
    if (!verifyPassword(password, user.passwordHash)) return null;

    return sanitizeUser(user);
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
    this.bootstrapFromEnv();
  }

  private bootstrapFromEnv() {
    const password = process.env.ADMIN_PASSWORD?.trim();
    if (!password) return;

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      name: process.env.ADMIN_NAME?.trim() || "Administrador SmartloteIA",
      username: process.env.ADMIN_USERNAME?.trim() || "admin",
      email: process.env.ADMIN_EMAIL?.trim() || "admin@abrolhos.eng.br",
      role: "admin",
      passwordHash: hashPassword(password),
      isActive: true,
      isBootstrap: true,
      billingEntityId: null,
      developmentId: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getSafeUser(id: string): Promise<SafeUser | undefined> {
    const user = this.users.get(id);
    return user ? sanitizeUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const normalized = normalizeUsername(username);
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === normalized,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = normalizeEmail(email);
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === normalized,
    );
  }

  async createUser(insertUser: InsertUser): Promise<SafeUser> {
    const user: User = {
      id: randomUUID(),
      name: insertUser.name.trim(),
      username: normalizeUsername(insertUser.username),
      email: normalizeEmail(insertUser.email),
      role: insertUser.role ?? "broker",
      isActive: insertUser.isActive ?? true,
      isBootstrap: insertUser.isBootstrap ?? false,
      billingEntityId: insertUser.billingEntityId ?? null,
      developmentId: insertUser.developmentId ?? null,
      passwordHash: hashPassword(insertUser.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return sanitizeUser(user);
  }

  async authenticate(login: string, password: string): Promise<SafeUser | null> {
    const normalizedLogin = login.trim().toLowerCase();

    const user = normalizedLogin.includes("@")
      ? await this.getUserByEmail(normalizedLogin)
      : await this.getUserByUsername(normalizedLogin);

    if (!user || !user.isActive) return null;
    if (!verifyPassword(password, user.passwordHash)) return null;

    return sanitizeUser(user);
  }
}

export const storage: IStorage = pool ? new DatabaseStorage() : new MemStorage();
