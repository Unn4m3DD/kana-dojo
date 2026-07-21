"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./AppShell";
import { getAttempts } from "@/lib/storage";
import type { Attempt } from "@/lib/types";
import { kanaMastery } from "@/lib/kana";

export function StatisticsClient({ uuid }: { uuid: string }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAttempts(uuid).then(setAttempts).finally(() => setLoading(false)); }, [uuid]);

  const stats = useMemo(() => {
    const correct = attempts.filter((item) => item.correct).length;
    const totalKana = attempts.reduce((sum, item) => sum + item.correctKana, 0);
    const totalMs = attempts.reduce((sum, item) => sum + item.durationMs, 0);
    const kpm = totalMs ? totalKana * 60000 / totalMs : 0;
    const days = new Map<string, Attempt[]>();
    [...attempts].reverse().forEach((item) => {
      const key = item.createdAt.slice(0, 10); days.set(key, [...(days.get(key) || []), item]);
    });
    const series = Array.from(days.entries()).slice(-12).map(([date, items]) => ({
      date, value: items.reduce((sum, item) => sum + item.kanaPerMinute, 0) / items.length,
    }));
    return { correct, accuracy: attempts.length ? correct / attempts.length * 100 : 0, kpm, series, mastery: kanaMastery(attempts) };
  }, [attempts]);

  const max = Math.max(20, ...stats.series.map((item) => item.value));
  const recentMistakes = attempts.filter((item) => !item.correct).slice(0, 5);

  return (
    <AppShell uuid={uuid} kicker="YOUR PROGRESS" title="Consistency, made visible." aside={<div className="period-pill">All time <span>⌄</span></div>}>
      {loading ? <div className="loading-card">Gathering your practice history…</div> : attempts.length === 0 ? (
        <section className="empty-state"><span className="empty-kana">あ</span><h2>Your story starts with one word.</h2><p>Complete a few practice prompts and your pace, accuracy, and tricky spellings will appear here.</p><a href={`/u/${uuid}/practice`} className="button primary">Start practicing <span>→</span></a></section>
      ) : <>
        <section className="metric-grid">
          <article><span className="metric-label">CURRENT PACE</span><strong>{stats.kpm.toFixed(1)}</strong><p>kana / minute</p><i className="metric-accent mint" /></article>
          <article><span className="metric-label">ACCURACY</span><strong>{Math.round(stats.accuracy)}<small>%</small></strong><p>{stats.correct} of {attempts.length} words correct</p><i className="metric-accent coral" /></article>
          <article><span className="metric-label">WORDS PRACTICED</span><strong>{attempts.length}</strong><p>across {stats.series.length} study {stats.series.length === 1 ? "day" : "days"}</p><i className="metric-accent gold" /></article>
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
          <div className="mastery-grid">{stats.mastery.map((item) => <div className="mastery-item" key={item.kana} title={`${Math.round(item.accuracy)}% accuracy across ${item.hits + item.misses} attempts`}><span>{item.kana}</span><div><b>{Math.round(item.accuracy)}%</b><small>{item.misses ? `${item.misses} missed` : "solid"}</small></div><i><em style={{ width: `${item.accuracy}%` }} /></i></div>)}</div>
        </section>
        <section className="recent-card"><div className="section-title"><div><p className="eyebrow">LATEST ANSWERS</p><h2>Practice log</h2></div><span>{attempts.length} total</span></div><div className="table-wrap"><table><thead><tr><th>WORD</th><th>YOUR ANSWER</th><th>RESULT</th><th>PACE</th><th>WHEN</th></tr></thead><tbody>{attempts.slice(0, 8).map((item) => <tr key={item.id}><td><b>{item.kana}</b><small>{item.translation}</small></td><td>{item.answer}</td><td><span className={item.correct ? "result-good" : "result-bad"}>{item.correct ? "Correct" : `→ ${item.expected}`}</span></td><td>{item.kanaPerMinute} k/m</td><td>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td></tr>)}</tbody></table></div></section>
      </>}
    </AppShell>
  );
}
