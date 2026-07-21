import { createClient, type Client } from "@libsql/client/web";

let client: Client | null = null;
let initialized = false;

export function getTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  client ??= createClient({ url, authToken });
  return client;
}

export async function ensureSchema(db: Client) {
  if (initialized) return;
  await db.execute(`CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    kana TEXT NOT NULL,
    translation TEXT NOT NULL,
    expected TEXT NOT NULL,
    answer TEXT NOT NULL,
    correct INTEGER NOT NULL,
    kana_count INTEGER NOT NULL,
    correct_kana INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    kana_per_minute REAL NOT NULL,
    kana_breakdown TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  )`);
  try { await db.execute("ALTER TABLE attempts ADD COLUMN kana_breakdown TEXT NOT NULL DEFAULT '[]'"); } catch { /* Already present. */ }
  await db.execute("CREATE INDEX IF NOT EXISTS attempts_user_created_idx ON attempts (user_id, created_at DESC)");
  initialized = true;
}
