import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing the Manus OAuth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Public identity and primary links for the portfolio. */
export const portfolioProfiles = mysqlTable("portfolioProfiles", {
  id: int("id").primaryKey(),
  publicName: varchar("publicName", { length: 160 }).notNull(),
  headline: varchar("headline", { length: 220 }).notNull(),
  introduction: text("introduction").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  location: varchar("location", { length: 180 }),
  githubUrl: varchar("githubUrl", { length: 500 }).notNull(),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  resumeAssetId: int("resumeAssetId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Portfolio project records, published selectively and ordered explicitly. */
export const portfolioProjects = mysqlTable("portfolioProjects", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  stack: text("stack").notNull(),
  repoUrl: varchar("repoUrl", { length: 500 }).notNull(),
  demoUrl: varchar("demoUrl", { length: 500 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  status: varchar("status", { length: 80 }).notNull().default("Open source"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  orderIndex: int("orderIndex").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Skill statements are independent content records so they can be updated without code changes. */
export const portfolioSkills = mysqlTable("portfolioSkills", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  proficiency: int("proficiency").notNull(),
  description: varchar("description", { length: 280 }),
  published: boolean("published").notNull().default(true),
  orderIndex: int("orderIndex").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Writing index entries can point to internal or external technical articles. */
export const portfolioArticles = mysqlTable("portfolioArticles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  excerpt: text("excerpt").notNull(),
  articleUrl: varchar("articleUrl", { length: 500 }),
  readTime: varchar("readTime", { length: 40 }),
  published: boolean("published").notNull().default(true),
  orderIndex: int("orderIndex").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** File bytes live in object storage; this table retains only secure object references and metadata. */
export const portfolioAssets = mysqlTable("portfolioAssets", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["resume", "project-media"]).notNull(),
  fileName: varchar("fileName", { length: 180 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull().unique(),
  url: varchar("url", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  uploadedByUserId: int("uploadedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Contact submissions are persisted for owner follow-up and intentionally excluded from public APIs. */
export const contactInquiries = mysqlTable("contactInquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "archived"]).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
