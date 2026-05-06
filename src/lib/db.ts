import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - DB features will fail at request time");
}

let initPromise: Promise<void> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return neon(process.env.DATABASE_URL);
}

async function runInit() {
  const db = getDb();
  await db`
    CREATE TABLE IF NOT EXISTS sf_specs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      input_type TEXT NOT NULL,
      input_excerpt TEXT NOT NULL,
      target_platform TEXT NOT NULL DEFAULT 'web',
      spec JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_sf_specs_created ON sf_specs(created_at DESC)`;
  await db`CREATE INDEX IF NOT EXISTS idx_sf_specs_platform ON sf_specs(target_platform)`;
}

export async function ensureDb() {
  if (!initPromise) {
    initPromise = runInit().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}
