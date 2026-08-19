import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  contactInquiries,
  InsertUser,
  portfolioArticles,
  portfolioAssets,
  portfolioProfiles,
  portfolioProjects,
  portfolioSkills,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getPortfolioSnapshot() {
  const db = await getDb();
  if (!db) return null;
  const [profile] = await db.select().from(portfolioProfiles).where(eq(portfolioProfiles.id, 1)).limit(1);
  const [projects, skills, articles] = await Promise.all([
    db.select().from(portfolioProjects).where(eq(portfolioProjects.published, true)).orderBy(asc(portfolioProjects.orderIndex)),
    db.select().from(portfolioSkills).where(eq(portfolioSkills.published, true)).orderBy(asc(portfolioSkills.orderIndex)),
    db.select().from(portfolioArticles).where(eq(portfolioArticles.published, true)).orderBy(asc(portfolioArticles.orderIndex)),
  ]);
  const resume = profile?.resumeAssetId
    ? (await db.select().from(portfolioAssets).where(eq(portfolioAssets.id, profile.resumeAssetId)).limit(1))[0]
    : undefined;
  return { profile, projects, skills, articles, resume };
}

export async function createContactInquiry(input: { name: string; email: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(contactInquiries).values(input);
}

export async function saveResumeAsset(input: {
  fileName: string;
  fileKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const insert = await db.insert(portfolioAssets).values({ ...input, kind: "resume" });
  const assetId = Number(insert[0].insertId);
  await db.update(portfolioProfiles).set({ resumeAssetId: assetId }).where(eq(portfolioProfiles.id, 1));
  return assetId;
}

export async function saveProjectMedia(input: {
  projectId: number;
  fileName: string;
  fileKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const insert = await db.insert(portfolioAssets).values({
    kind: "project-media",
    fileName: input.fileName,
    fileKey: input.fileKey,
    url: input.url,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    uploadedByUserId: input.uploadedByUserId,
  });
  const assetId = Number(insert[0].insertId);
  await db.update(portfolioProjects).set({ imageUrl: input.url }).where(eq(portfolioProjects.id, input.projectId));
  return assetId;
}

export async function hasPublicProfile() {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: portfolioProfiles.id }).from(portfolioProfiles).where(and(eq(portfolioProfiles.id, 1))).limit(1);
  return result.length > 0;
}
