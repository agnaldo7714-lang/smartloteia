import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "broker",
  "financial",
]);

export const clientStatusEnum = pgEnum("client_status", [
  "lead",
  "active",
  "inactive",
]);

export const developmentStatusEnum = pgEnum("development_status", [
  "draft",
  "active",
  "paused",
  "sold_out",
]);

export const lotStatusEnum = pgEnum("lot_status", [
  "available",
  "reserved",
  "sold",
  "blocked",
  "negotiation",
]);

export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "contacted",
  "service",
  "visit",
  "proposal",
  "reservation",
  "won",
  "lost",
]);

export const saleStatusEnum = pgEnum("sale_status", [
  "draft",
  "approved",
  "signed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default("broker"),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isBootstrap: boolean("is_bootstrap").notNull().default(false),
  billingEntityId: varchar("billing_entity_id", { length: 36 }),
  developmentId: varchar("development_id", { length: 36 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }),
  email: varchar("email", { length: 160 }),
  phone: varchar("phone", { length: 30 }),
  status: clientStatusEnum("status").notNull().default("lead"),
  source: varchar("source", { length: 80 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const developments = pgTable("developments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  status: developmentStatusEnum("status").notNull().default("draft"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const lots = pgTable("lots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developmentId: varchar("development_id").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  sector: varchar("sector", { length: 80 }),
  block: varchar("block", { length: 40 }),
  number: varchar("number", { length: 20 }).notNull(),
  areaM2: integer("area_m2"),
  priceCents: integer("price_cents").notNull().default(0),
  status: lotStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 160 }),
  source: varchar("source", { length: 80 }),
  stage: leadStageEnum("stage").notNull().default("new"),
  assignedUserId: varchar("assigned_user_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  lotId: varchar("lot_id").notNull(),
  sellerUserId: varchar("seller_user_id").notNull(),
  status: saleStatusEnum("status").notNull().default("draft"),
  totalValueCents: integer("total_value_cents").notNull().default(0),
  downPaymentCents: integer("down_payment_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const loginSchema = z.object({
  login: z.string().trim().min(3, "Informe seu usuário ou e-mail"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    passwordHash: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    billingEntityId: z.string().optional().nullable(),
    developmentId: z.string().optional().nullable(),
    isBootstrap: z.boolean().optional(),
  });

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDevelopmentSchema = createInsertSchema(developments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLotSchema = createInsertSchema(lots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertDevelopment = z.infer<typeof insertDevelopmentSchema>;
export type InsertLot = z.infer<typeof insertLotSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Development = typeof developments.$inferSelect;
export type Lot = typeof lots.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Sale = typeof sales.$inferSelect;

export type SafeUser = Omit<User, "passwordHash">;
export type UserRole = User["role"];