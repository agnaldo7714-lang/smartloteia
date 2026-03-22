import fs from "fs";
import path from "path";
import { Pool } from "pg";

function loadEnvFromFile() {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) return;

  const envContent = fs.readFileSync(envPath, "utf-8");

  for (const rawLine of envContent.split("\n")) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFromFile();

const connectionString = process.env.DATABASE_URL?.trim() || "";

export const isDatabaseConfigured = Boolean(connectionString);

export const pool = isDatabaseConfigured
  ? new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    })
  : null;

export async function getDatabaseStatus() {
  if (!pool) {
    return {
      configured: false,
      connected: false,
      mode: "memory",
      message: "DATABASE_URL não configurado",
    };
  }

  try {
    await pool.query("select 1");
    return {
      configured: true,
      connected: true,
      mode: "postgres",
      message: "PostgreSQL conectado com sucesso",
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      mode: "postgres",
      message:
        error instanceof Error
          ? error.message
          : "Falha ao conectar ao PostgreSQL",
    };
  }
}

export async function ensurePublicInterestsTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_interests (
      id VARCHAR(36) PRIMARY KEY,
      project_id VARCHAR(50),
      project_name TEXT NOT NULL,
      source VARCHAR(80) NOT NULL DEFAULT 'landing_ai',
      full_name TEXT NOT NULL,
      phone VARCHAR(40) NOT NULL,
      email VARCHAR(160),
      city_interest VARCHAR(120),
      objective VARCHAR(120),
      budget_range VARCHAR(120),
      timeline VARCHAR(120),
      family_profile TEXT,
      notes TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function ensureClientsTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(36) PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone VARCHAR(40) NOT NULL,
      email VARCHAR(160),
      city VARCHAR(120),
      objective VARCHAR(120),
      budget_range VARCHAR(120),
      timeline VARCHAR(120),
      profile_notes TEXT,
      source VARCHAR(80) NOT NULL DEFAULT 'manual',
      project_id VARCHAR(50),
      project_name TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      assigned_broker TEXT,
      broker_id VARCHAR(36),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS broker_id VARCHAR(36)
  `);
}

export async function ensureBillingEntitiesTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS billing_entities (
      id VARCHAR(36) PRIMARY KEY,
      corporate_name TEXT NOT NULL,
      trade_name TEXT,
      document VARCHAR(20) NOT NULL,
      bank_code VARCHAR(10),
      bank_name VARCHAR(100),
      agency VARCHAR(30),
      account_number VARCHAR(40),
      wallet_code VARCHAR(40),
      agreement_code VARCHAR(60),
      cnab_layout VARCHAR(20) NOT NULL DEFAULT 'CNAB240',
      beneficiary_name TEXT,
      beneficiary_document VARCHAR(20),
      notes TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function ensureBrokersTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS brokers (
      id VARCHAR(36) PRIMARY KEY,
      billing_entity_id VARCHAR(36) NOT NULL,
      name TEXT NOT NULL,
      email VARCHAR(160),
      phone VARCHAR(40),
      creci VARCHAR(40),
      notes TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function ensureLotsTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lots (
      id VARCHAR(36) PRIMARY KEY,
      development_id VARCHAR(36) NOT NULL,
      code VARCHAR(80) NOT NULL UNIQUE,
      block VARCHAR(20) NOT NULL,
      lot VARCHAR(20) NOT NULL,
      area_m2 INTEGER NOT NULL DEFAULT 0,
      front_m NUMERIC(10,2) NOT NULL DEFAULT 0,
      price VARCHAR(40) NOT NULL DEFAULT '0',
      status VARCHAR(20) NOT NULL DEFAULT 'Disponível',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS development_id VARCHAR(36)
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS code VARCHAR(80)
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS block VARCHAR(20)
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS lot VARCHAR(20)
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS area_m2 INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS front_m NUMERIC(10,2) NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS price VARCHAR(40) NOT NULL DEFAULT '0'
  `);

  await pool.query(`
    ALTER TABLE lots
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Disponível'
  `);
}

export async function ensurePublicDevelopmentsTable() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_developments (
      id VARCHAR(36) PRIMARY KEY,
      billing_entity_id VARCHAR(36),
      name TEXT NOT NULL,
      city VARCHAR(120) NOT NULL,
      type VARCHAR(80) NOT NULL,
      price VARCHAR(120) NOT NULL,
      img TEXT NOT NULL,
      status VARCHAR(80) NOT NULL,
      area VARCHAR(120) NOT NULL,
      financing TEXT NOT NULL,
      description TEXT NOT NULL,
      highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
      total_lots INTEGER NOT NULL DEFAULT 0,
      plant_pdf_url TEXT,
      plant_image_url TEXT,
      overview_image_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE public_developments
    ADD COLUMN IF NOT EXISTS billing_entity_id VARCHAR(36)
  `);

  await pool.query(`
    ALTER TABLE public_developments
    ADD COLUMN IF NOT EXISTS total_lots INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE public_developments
    ADD COLUMN IF NOT EXISTS plant_pdf_url TEXT
  `);

  await pool.query(`
    ALTER TABLE public_developments
    ADD COLUMN IF NOT EXISTS plant_image_url TEXT
  `);

  await pool.query(`
    ALTER TABLE public_developments
    ADD COLUMN IF NOT EXISTS overview_image_url TEXT
  `);
}