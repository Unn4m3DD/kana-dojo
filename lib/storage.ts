"use client";

import type { Attempt } from "./types";

const key = (uuid: string) => `kana-dojo:${uuid}:attempts`;

function readLocal(uuid: string): Attempt[] {
  try { return JSON.parse(localStorage.getItem(key(uuid)) || "[]"); }
  catch { return []; }
}

export async function getAttempts(uuid: string): Promise<Attempt[]> {
  try {
    const response = await fetch(`/api/u/${uuid}/attempts`, { cache: "no-store" });
    if (response.ok) return (await response.json()).attempts;
  } catch { /* Turso is optional until credentials are supplied. */ }
  return readLocal(uuid);
}

export async function saveAttempt(uuid: string, attempt: Attempt): Promise<"turso" | "device"> {
  try {
    const response = await fetch(`/api/u/${uuid}/attempts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(attempt),
    });
    if (response.ok) return "turso";
  } catch { /* Fall through to an offline-friendly device copy. */ }
  const attempts = readLocal(uuid);
  localStorage.setItem(key(uuid), JSON.stringify([attempt, ...attempts].slice(0, 500)));
  return "device";
}
