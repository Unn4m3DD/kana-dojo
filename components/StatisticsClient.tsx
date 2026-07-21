"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./AppShell";
import { getAttempts } from "@/lib/storage";
import type { Attempt } from "@/lib/types";
import { kanaMastery } from "@/lib/kana";

type TimeRange = "7d" | "30d" | "all";

const RANGE_DAYS: Record<Exclude<TimeRange, "all">, number> = {
  "7d": 7,
  "30d": 30,
};

const GOJUON_ROWS = [
  { label: "Vowels", kana: ["あ", "い", "う", "え", "お"] },
  { label: "K", kana: ["か", "き", "く", "け", "こ"] },
  { label: "S", kana: ["さ", "し", "す", "せ", "そ"] },
  { label: "T", kana: ["た", "ち", "つ", "て", "と"] },
  { label: "N", kana: ["な", "に", "ぬ", "ね", "の"] },
  { label: "H", kana: ["は", "ひ", "ふ", "へ", "ほ"] },
  { label: "M", kana: ["ま", "み", "む", "め", "も"] },
  { label: "Y", kana: ["や", null, "ゆ", null, "よ"] },
  { label: "R", kana: ["ら", "り", "る", "れ", "ろ"] },
  { label: "W", kana: ["わ", null, null, null, "を"] },
  { label: "N", kana: ["ん", null, null, null, null] },
] as const;

const ROMAJI_COLUMNS = ["a", "i", "u", "e", "o"];
const GOJUON_KANA: ReadonlySet<string> = new Set(GOJUON_ROWS.flatMap((row) => row.kana.filter((kana): kana is NonNullable<typeof kana> => Boolean(kana))));

export function StatisticsClient({ uuid }: { uuid: string }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>("all");
  const [rangeReference, setRangeReference] = useState(0);
  useEffect(() => { getAttempts(uuid).then(setAttempts).finally(() => setLoading(false)); }, [uuid]);

  const visibleAttempts = useMemo(() => {
    if (range === "all") return attempts;
    const cutoff = rangeReference - RANGE_DAYS[range] * 24 * 60 * 60 * 1000;
    return attempts.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
  }, [attempts, range, rangeReference]);

  const stats = useMemo(() => {
    const correct = visibleAttempts.filter((item) => item.correct).length;
    const totalKana = visibleAttempts.reduce((sum, item) => sum + item.correctKana, 0);
    const totalMs = visibleAttempts.reduce((sum, item) => sum + item.durationMs, 0);
    const kpm = totalMs ? totalKana * 60000 / totalMs : 0;
    const days = new Map<string, Attempt[]>();
    [...visibleAttempts].reverse().forEach((item) => {
      const key = item.createdAt.slice(0, 10); days.set(key, [...(days.get(key) || []), item]);
    });
    const series = Array.from(days.entries()).slice(-12).map(([date, items]) => ({
      date, value: items.reduce((sum, item) => sum + item.kanaPerMinute, 0) / items.length,
    }));
    return { correct, accuracy: visibleAttempts.length ? correct / visibleAttempts.length * 100 : 0, kpm, series, mastery: kanaMastery(visibleAttempts) };
  }, [visibleAttempts]);

  const max = Math.max(20, ...stats.series.map((item) => item.value));
  const recentMistakes = visibleAttempts.filter((item) => !item.correct).slice(0, 5);
  const masteryByKana = new Map(stats.mastery.map((item) => [item.kana, item]));
  const additionalSounds = stats.mastery.filter((item) => !GOJUON_KANA.has(item.kana));

  return (
    <AppShell uuid={uuid} kicker="YOUR PROGRESS" title="Consistency, made visible." aside={
      <div className="period-picker">
        <select aria-label="Statistics time range" value={range} onChange={(event) => { setRange(event.target.value as TimeRange); setRangeReference(Date.now()); }}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
        <span aria-hidden="true">⌄</span>
      </div>
    }>
      {loading ? <div className="loading-card">Gathering your practice history…</div> : attempts.length === 0 ? (
        <section className="empty-state"><span className="empty-kana">あ</span><h2>Your story starts with one word.</h2><p>Complete a few practice prompts and your pace, accuracy, and tricky spellings will appear here.</p><a href={`/u/${uuid}/practice`} className="button primary">Start practicing <span>→</span></a></section>
      ) : <>
        <section className="metric-grid">
          <article><span className="metric-label">CURRENT PACE</span><strong>{stats.kpm.toFixed(1)}</strong><p>kana / minute</p><i className="metric-accent mint" /></article>
          <article><span className="metric-label">ACCURACY</span><strong>{Math.round(stats.accuracy)}<small>%</small></strong><p>{stats.correct} of {visibleAttempts.length} words correct</p><i className="metric-accent coral" /></article>
          <article><span className="metric-label">WORDS PRACTICED</span><strong>{visibleAttempts.length}</strong><p>across {stats.series.length} study {stats.series.length === 1 ? "day" : "days"}</p><i className="metric-accent gold" /></article>
        </section>
        <section className="stats-grid">
          <article className="chart-card">
            <div className="section-title"><div><p className="eyebrow">PACE OVER TIME</p><h2>Your kana rhythm</h2></div><span className="chart-legend"><i /> kana/min</span></div>
            <div className="bar-chart" aria-label="Kana per minute over time">
              {stats.series.map((item) => <div className="bar-column" key={item.date}><div className="bar-value">{Math.round(item.value)}</div><div className="bar-track"><i style={{ height: `${Math.max(8, item.value / max * 100)}%` }} /></div><span>{new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>)}
            </div>
          </article>
          <article className="mistakes-card">
            <div className="section-title"><div><p className="eyebrow">FOCUS NEXT</p><h2>Recent mix-ups</h2></div></div>
            {recentMistakes.length ? <div className="mistake-list">{recentMistakes.map((item) => <div key={item.id}><span className="mistake-kana">{item.kana}</span><p><b>{item.answer}</b><small>should be {item.expected}</small></p><em>{item.translation}</em></div>)}</div> : <div className="perfect-state"><span>✓</span><p>No mistakes yet. Beautiful work.</p></div>}
          </article>
        </section>
        <section className="mastery-card">
          <div className="section-title"><div><p className="eyebrow">KANA MASTERY</p><h2>What’s sticking — and what isn’t</h2></div><span>Adaptive practice uses this signal</span></div>
          <div className="mastery-table-wrap">
            <table className="mastery-table" aria-label="Standard hiragana mastery table">
              <thead><tr><th scope="col">ROW</th>{ROMAJI_COLUMNS.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
              <tbody>{GOJUON_ROWS.map((row, rowIndex) => <tr key={`${row.label}-${rowIndex}`}>
                <th scope="row">{row.label}</th>
                {row.kana.map((kana, columnIndex) => {
                  if (!kana) return <td className="mastery-empty" aria-hidden="true" key={`${row.label}-${ROMAJI_COLUMNS[columnIndex]}`} />;
                  const item = masteryByKana.get(kana);
                  const accuracy = item ? Math.round(item.accuracy) : null;
                  return <td className={item ? "mastery-cell is-practiced" : "mastery-cell"} key={kana} title={item ? `${accuracy}% accuracy across ${item.hits + item.misses} attempts` : "Not practiced yet"}>
                    <span lang="ja">{kana}</span>
                    <small>{accuracy === null ? "—" : `${accuracy}%`}</small>
                    <i><em style={{ width: `${accuracy ?? 0}%` }} /></i>
                  </td>;
                })}
              </tr>)}</tbody>
            </table>
          </div>
          {additionalSounds.length > 0 && <div className="additional-mastery"><p>ADDITIONAL SOUNDS</p><div>{additionalSounds.map((item) => <span key={item.kana} title={`${item.hits + item.misses} attempts`}><b lang="ja">{item.kana}</b><small>{Math.round(item.accuracy)}%</small></span>)}</div></div>}
        </section>
        <section className="recent-card"><div className="section-title"><div><p className="eyebrow">LATEST ANSWERS</p><h2>Practice log</h2></div><span>{visibleAttempts.length} in range</span></div><div className="table-wrap"><table><thead><tr><th>WORD</th><th>YOUR ANSWER</th><th>RESULT</th><th>PACE</th><th>WHEN</th></tr></thead><tbody>{visibleAttempts.slice(0, 8).map((item) => <tr key={item.id}><td><b>{item.kana}</b><small>{item.translation}</small></td><td>{item.answer}</td><td><span className={item.correct ? "result-good" : "result-bad"}>{item.correct ? "Correct" : `→ ${item.expected}`}</span></td><td>{item.kanaPerMinute} k/m</td><td>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td></tr>)}</tbody></table></div></section>
      </>}
    </AppShell>
  );
}
