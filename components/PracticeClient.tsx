"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AppShell } from "./AppShell";
import { randomWord, type KanaWord } from "@/lib/words";
import { getAttempts, saveAttempt } from "@/lib/storage";
import type { Attempt } from "@/lib/types";
import { adaptiveWord, kanaBreakdown } from "@/lib/kana";

export function PracticeClient({ uuid }: { uuid: string }) {
  const [word, setWord] = useState<KanaWord>({ kana: "きょう", romaji: "kyou", translation: "today" });
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Attempt | null>(null);
  const [streak, setStreak] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [storageMode, setStorageMode] = useState<"turso" | "device" | null>(null);
  const [adaptive, setAdaptive] = useState(true);
  const [history, setHistory] = useState<Attempt[]>([]);
  const startedAt = useRef(performance.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getAttempts(uuid).then((items) => { setHistory(items); setWord(items.length ? adaptiveWord(items) : randomWord()); startedAt.current = performance.now(); }); }, [uuid]);

  async function check(event: FormEvent) {
    event.preventDefault();
    if (!answer.trim() || result) return;
    const typed = answer.trim().toLowerCase();
    const accepted = [word.romaji, ...(word.alternatives || [])];
    const correct = accepted.includes(typed);
    const durationMs = Math.max(800, performance.now() - startedAt.current);
    const breakdown = kanaBreakdown(word.kana, word.romaji, typed);
    const matched = breakdown.filter((item) => item.correct).length;
    const attempt: Attempt = {
      id: crypto.randomUUID(), userId: uuid, kana: word.kana, translation: word.translation,
      expected: word.romaji, answer: typed, correct, kanaCount: word.kana.length,
      correctKana: matched, durationMs: Math.round(durationMs),
      kanaPerMinute: Math.round((matched * 60000 / durationMs) * 10) / 10,
      kanaBreakdown: breakdown,
      createdAt: new Date().toISOString(),
    };
    setResult(attempt);
    setHistory((items) => [attempt, ...items]);
    setStreak((value) => correct ? value + 1 : 0);
    setSessionCount((value) => value + 1);
    setStorageMode(await saveAttempt(uuid, attempt));
  }

  function next() {
    setWord(adaptive ? adaptiveWord(history, word.kana) : randomWord(word.kana));
    setAnswer("");
    setResult(null);
    startedAt.current = performance.now();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const maxLength = Math.max(answer.length, word.romaji.length);

  return (
    <AppShell uuid={uuid} kicker="DAILY PRACTICE" title="One word. Full focus." aside={<div className="practice-controls"><button className={adaptive ? "adaptive-toggle on" : "adaptive-toggle"} onClick={() => setAdaptive((value) => !value)}><i /><span><b>Adaptive mix</b><small>{adaptive ? "Prioritizing tricky kana" : "Fully random words"}</small></span></button><div className="session-pills"><span><b>{streak}</b> streak</span><span><b>{sessionCount}</b> words</span></div></div>}>
      <section className={`practice-card ${result ? (result.correct ? "is-correct" : "is-wrong") : ""}`}>
        <div className="card-index"><span>{String(sessionCount + 1).padStart(2, "0")}</span><i /></div>
        <div className="word-stage">
          <p className="stage-label">TYPE THIS IN ROMAJI</p>
          <div className="kana-word" lang="ja">{word.kana}</div>
          <div className="translation"><span className="translation-line" /> {word.translation} <span className="translation-line" /></div>
        </div>
        <form className="answer-area" onSubmit={check}>
          <label htmlFor="answer">Your answer</label>
          <div className="answer-row">
            <input ref={inputRef} id="answer" autoFocus autoComplete="off" spellCheck={false} value={answer} disabled={Boolean(result)} onChange={(event) => setAnswer(event.target.value.replace(/[^a-zA-Z]/g, ""))} placeholder="type the romaji…" />
            {!result && <button className="check-button" type="submit" disabled={!answer}>Check <span>↵</span></button>}
            {result && <button className="check-button next" type="button" onClick={next}>Next <span>→</span></button>}
          </div>
          {!result && <div className="answer-hint"><span>Press enter to check</span><button type="button" onClick={next}>Skip this word</button></div>}
          {result && (
            <div className="feedback" role="status">
              <div className="feedback-title"><span>{result.correct ? "✓" : "!"}</span><strong>{result.correct ? "Nicely done." : "Almost — look closely."}</strong><em>{result.kanaPerMinute} kana/min</em></div>
              {!result.correct && <div className="letter-check" aria-label={`Your answer ${answer}; expected ${word.romaji}`}>
                {Array.from({ length: maxLength }).map((_, index) => {
                  const typed = answer[index] || "·"; const expected = word.romaji[index] || "·"; const ok = typed === expected;
                  return <span className={ok ? "letter-good" : "letter-bad"} key={index}><b>{typed}</b><small>{ok ? "✓" : expected}</small></span>;
                })}
              </div>}
              {!result.correct && <p>You typed <b>{answer}</b>. The standard spelling is <strong>{word.romaji}</strong>.</p>}
            </div>
          )}
        </form>
        <div className="card-footer"><span className="difficulty-dot" /> Mixed hiragana <span className="footer-divider">•</span> {storageMode === "device" ? "Saving on this device until Turso is connected" : "Progress saves automatically"}</div>
      </section>
      <div className="practice-note"><span>⌁</span><p><b>Small steps compound.</b> Accuracy comes first; speed follows naturally.</p></div>
    </AppShell>
  );
}
