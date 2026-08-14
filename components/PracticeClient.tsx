"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "./AppShell";
import { randomWord, type KanaWord } from "@/lib/words";
import { getAttempts, saveAttempt } from "@/lib/storage";
import type { Attempt } from "@/lib/types";
import { adaptiveWord, kanaBreakdown, practiceKana, recentSuccessfulKana } from "@/lib/kana";

type PracticeMode = "words" | "kana";

const PRACTICE_MODES: { value: PracticeMode; label: string }[] = [
  { value: "words", label: "Words" },
  { value: "kana", label: "Kana" },
];

export function PracticeClient({ uuid }: { uuid: string }) {
  const [word, setWord] = useState<KanaWord>({ kana: "きょう", romaji: "kyou", translation: "today" });
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Attempt | null>(null);
  const [streak, setStreak] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [storageMode, setStorageMode] = useState<"turso" | "device" | null>(null);
  const [adaptive, setAdaptive] = useState(true);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("words");
  const [history, setHistory] = useState<Attempt[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const activeElapsed = useRef(0);
  const activeStartedAt = useRef<number | null>(null);
  const timingActive = useRef(true);
  const focusState = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePracticeFocus = useCallback((focused: boolean) => {
    focusState.current = focused;
    setIsFocused(focused);
    if (!timingActive.current) return;
    if (focused && activeStartedAt.current === null) activeStartedAt.current = performance.now();
    if (!focused && activeStartedAt.current !== null) {
      activeElapsed.current += performance.now() - activeStartedAt.current;
      activeStartedAt.current = null;
    }
  }, []);

  const resetActiveTimer = useCallback(() => {
    activeElapsed.current = 0;
    timingActive.current = true;
    activeStartedAt.current = focusState.current ? performance.now() : null;
  }, []);

  useEffect(() => {
    function syncFocus() {
      updatePracticeFocus(document.visibilityState === "visible" && document.hasFocus() && document.activeElement === inputRef.current);
    }
    window.addEventListener("focus", syncFocus);
    window.addEventListener("blur", syncFocus);
    document.addEventListener("visibilitychange", syncFocus);
    syncFocus();
    return () => {
      window.removeEventListener("focus", syncFocus);
      window.removeEventListener("blur", syncFocus);
      document.removeEventListener("visibilitychange", syncFocus);
    };
  }, [updatePracticeFocus]);

  useEffect(() => { getAttempts(uuid).then((items) => { setHistory(items); setWord(items.length ? adaptiveWord(items) : randomWord()); resetActiveTimer(); }); }, [resetActiveTimer, uuid]);

  useEffect(() => {
    if (!result) requestAnimationFrame(() => inputRef.current?.focus());
  }, [result]);

  const validateWord = useCallback(async () => {
    if (!answer.trim() || result || !focusState.current || !timingActive.current) return;
    const typed = answer.trim().toLowerCase();
    const accepted = [word.romaji, ...(word.alternatives || [])];
    const correct = accepted.includes(typed);
    if (activeStartedAt.current !== null) activeElapsed.current += performance.now() - activeStartedAt.current;
    activeStartedAt.current = null;
    timingActive.current = false;
    updatePracticeFocus(false);
    const durationMs = Math.max(1, activeElapsed.current);
    const breakdown = kanaBreakdown(word.kana, word.romaji, typed);
    const matched = breakdown.filter((item) => item.correct).length;
    const attempt: Attempt = {
      id: crypto.randomUUID(), userId: uuid, kana: word.kana, translation: word.translation,
      expected: word.romaji, answer: typed, correct, kanaCount: breakdown.length,
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
  }, [answer, result, updatePracticeFocus, uuid, word]);

  const pickPrompt = useCallback((mode: PracticeMode, except?: string) => {
    if (mode === "words") return adaptive ? adaptiveWord(history, except) : randomWord(except, recentSuccessfulKana(history));
    return practiceKana(history, except, adaptive);
  }, [adaptive, history]);

  const next = useCallback(() => {
    setWord(pickPrompt(practiceMode, word.kana));
    setAnswer("");
    setResult(null);
    resetActiveTimer();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [pickPrompt, practiceMode, resetActiveTimer, word.kana]);

  const changePracticeMode = useCallback((mode: PracticeMode) => {
    if (mode === practiceMode) return;
    setPracticeMode(mode);
    setWord(pickPrompt(mode));
    setAnswer("");
    setResult(null);
    setStreak(0);
    setSessionCount(0);
    resetActiveTimer();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [pickPrompt, practiceMode, resetActiveTimer]);

  function check(event: FormEvent) {
    event.preventDefault();
    void validateWord();
  }

  useEffect(() => {
    function handlePracticeKey(event: KeyboardEvent) {
      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        event.preventDefault();
        inputRef.current?.blur();
        return;
      }
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      if (!result && !isFocused) return;
      if (event.target instanceof HTMLElement && event.target !== inputRef.current && event.target.closest("button, a, select")) return;
      event.preventDefault();
      if (result) next();
      else if (answer.trim()) void validateWord();
    }
    window.addEventListener("keydown", handlePracticeKey);
    return () => window.removeEventListener("keydown", handlePracticeKey);
  }, [answer, isFocused, next, result, validateWord]);

  const maxLength = Math.max(answer.length, word.romaji.length);
  const promptIsVisible = isFocused || Boolean(result);
  const kanaLength = Array.from(word.kana).length;
  const kanaSize = kanaLength >= 7 ? "kana-seven-plus" : kanaLength === 6 ? "kana-six" : kanaLength === 5 ? "kana-five" : "";
  const promptLabel = practiceMode === "words" ? "words" : "kana";
  const footerLabel = practiceMode === "words" ? "Mixed hiragana words" : "Individual & combination hiragana";

  return (
    <AppShell uuid={uuid} kicker="DAILY PRACTICE" title="" aside={<div className="practice-controls">
      <div className="mode-picker" role="group" aria-label="Practice mode">
        {PRACTICE_MODES.map((mode) => <button type="button" className={practiceMode === mode.value ? "active" : ""} aria-pressed={practiceMode === mode.value} onClick={() => changePracticeMode(mode.value)} key={mode.value}>{mode.label}</button>)}
      </div>
      <button type="button" className={adaptive ? "adaptive-toggle on" : "adaptive-toggle"} onClick={() => setAdaptive((value) => !value)}><i /><span><b>Adaptive mix</b><small>{adaptive ? "Prioritizing tricky kana" : "Random within this mode"}</small></span></button>
      <div className="session-pills"><span><b>{streak}</b> streak</span><span><b>{sessionCount}</b> {promptLabel}</span></div>
    </div>}>
      <section className={`practice-card ${promptIsVisible ? "is-focused" : "is-unfocused"} ${result ? (result.correct ? "is-correct" : "is-wrong") : ""}`}>
        <div className="card-index"><span>{String(sessionCount + 1).padStart(2, "0")}</span><i /><span className="focus-badge"><b />{result ? "Submitted" : isFocused ? "Focused" : "Paused"}</span></div>
        <div className="practice-body">
          <div className="word-stage">
            <p className="stage-label">TYPE THIS IN ROMAJI</p>
            <div className={`kana-word ${kanaSize}`.trim()} lang="ja">{word.kana}</div>
            {!isFocused && !result && <div className="focus-overlay" role="status"><strong>Practice paused</strong><span>Focus the answer field to continue</span></div>}
          </div>
          <form className="answer-area" onSubmit={check}>
            <label htmlFor="answer">Your answer</label>
            <div className="answer-row">
              <input ref={inputRef} id="answer" autoFocus autoComplete="off" spellCheck={false} value={answer} disabled={Boolean(result)} onFocus={() => updatePracticeFocus(true)} onBlur={() => updatePracticeFocus(false)} onChange={(event) => setAnswer(event.target.value.replace(/[^a-zA-Z]/g, ""))} placeholder="type the romaji…" />
              {!result && <button className="check-button" type="submit" disabled={!answer || !isFocused} onPointerDown={(event) => event.preventDefault()}>Check <span>↵</span></button>}
              {result && <button className="check-button next" type="button" onClick={next}>Next <span>→</span></button>}
            </div>
            <div className="response-panel">
              {!result && <div className="coach-panel">
                <p className="eyebrow">KEYBOARD RHYTHM</p>
                <p>Type your answer, then use either key to check it. Press the same key again for the next prompt.</p>
                <div className="key-guide"><kbd>space</kbd><span>or</span><kbd>enter ↵</kbd></div>
                <button type="button" onClick={next}>Skip this prompt</button>
              </div>}
              {result && <div className="feedback" role="status">
                <div className="feedback-title"><span>{result.correct ? "✓" : "!"}</span><strong>{result.correct ? "Nicely done." : "Almost — look closely."}</strong><em>{result.kanaPerMinute} kana/min</em></div>
                <div className="feedback-translation">{word.translation}</div>
                {!result.correct && <div className="letter-check" aria-label={`Your answer ${answer}; expected ${word.romaji}`}>
                  {Array.from({ length: maxLength }).map((_, index) => {
                    const typed = answer[index] || "·"; const expected = word.romaji[index] || "·"; const ok = typed === expected;
                    return <span className={ok ? "letter-good" : "letter-bad"} key={index}><b>{typed}</b><small>{ok ? "✓" : expected}</small></span>;
                  })}
                </div>}
                {!result.correct && <p>You typed <b>{answer}</b>. The standard spelling is <strong>{word.romaji}</strong>.</p>}
                {result.correct && <p className="correct-copy">Ready for another? Press <kbd>space</kbd> or <kbd>enter ↵</kbd>.</p>}
              </div>}
            </div>
          </form>
        </div>
        <div className="card-footer"><span className="difficulty-dot" /> {footerLabel} <span className="footer-divider">•</span> {storageMode === "device" ? "Saving on this device until Turso is connected" : "Progress saves automatically"}</div>
      </section>
      <div className="practice-note"><span>⌁</span><p><b>Small steps compound.</b> Accuracy comes first; speed follows naturally.</p></div>
    </AppShell>
  );
}
