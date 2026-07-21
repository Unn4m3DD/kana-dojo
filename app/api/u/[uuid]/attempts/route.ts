import { NextResponse } from "next/server";
import { ensureSchema, getTurso } from "@/lib/turso";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  if (!UUID_V4.test(uuid)) return NextResponse.json({ error: "Invalid study key" }, { status: 400 });
  const db = getTurso();
  if (!db) return NextResponse.json({ error: "Turso is not configured" }, { status: 503 });
  await ensureSchema(db);
  const result = await db.execute({
    sql: `SELECT id, user_id, kana, translation, expected, answer, correct, kana_count,
      correct_kana, duration_ms, kana_per_minute, kana_breakdown, created_at
      FROM attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 500`,
    args: [uuid],
  });
  const attempts = result.rows.map((row) => ({
    id: row.id, userId: row.user_id, kana: row.kana, translation: row.translation,
    expected: row.expected, answer: row.answer, correct: Boolean(row.correct),
    kanaCount: row.kana_count, correctKana: row.correct_kana, durationMs: row.duration_ms,
    kanaPerMinute: row.kana_per_minute, kanaBreakdown: JSON.parse(String(row.kana_breakdown || "[]")), createdAt: row.created_at,
  }));
  return NextResponse.json({ attempts });
}

export async function POST(request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  if (!UUID_V4.test(uuid)) return NextResponse.json({ error: "Invalid study key" }, { status: 400 });
  const body = await request.json();
  const db = getTurso();
  if (!db) return NextResponse.json({ error: "Turso is not configured" }, { status: 503 });
  await ensureSchema(db);
  await db.execute({
    sql: `INSERT INTO attempts (id, user_id, kana, translation, expected, answer, correct,
      kana_count, correct_kana, duration_ms, kana_per_minute, kana_breakdown, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [body.id, uuid, body.kana, body.translation, body.expected, body.answer,
      body.correct ? 1 : 0, body.kanaCount, body.correctKana, body.durationMs,
      body.kanaPerMinute, JSON.stringify(body.kanaBreakdown || []), body.createdAt],
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
