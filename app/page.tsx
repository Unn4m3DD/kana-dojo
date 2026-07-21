"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function LoginPage() {
  const router = useRouter();
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");

  function signIn(event?: FormEvent) {
    event?.preventDefault();
    const value = uuid.trim();
    if (!UUID_V4.test(value)) {
      setError("That doesn’t look like a valid UUIDv4. Check it and try again.");
      return;
    }
    router.push(`/u/${value}/practice`);
  }

  function signUp() {
    const value = crypto.randomUUID();
    setUuid(value);
    setError("");
    router.push(`/u/${value}/practice`);
  }

  return (
    <main className="login-shell">
      <ThemeToggle className="login-theme-toggle" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="login-card">
        <div className="brand-lockup">
          <span className="brand-mark">あ</span>
          <span>kana dojo</span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">HIRAGANA, ONE WORD AT A TIME</p>
          <h1>Find your rhythm<br />in Japanese.</h1>
          <p>Short, focused drills that help romaji recall feel automatic. Your progress stays attached to one private key.</p>
        </div>
        <form className="login-form" onSubmit={signIn}>
          <label htmlFor="uuid">Your private study key</label>
          <input
            id="uuid"
            name="uuid"
            type="password"
            autoComplete="current-password"
            spellCheck={false}
            value={uuid}
            onChange={(event) => { setUuid(event.target.value); setError(""); }}
            placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            aria-describedby={error ? "uuid-error uuid-help" : "uuid-help"}
          />
          {error && <p className="form-error" id="uuid-error">{error}</p>}
          <p className="form-help" id="uuid-help">Keep this key somewhere safe. It is the only way back to your progress.</p>
          <div className="login-actions">
            <button className="button primary" type="submit">Sign in <span>→</span></button>
            <button className="button secondary" type="button" onClick={signUp}>Create a new key</button>
          </div>
        </form>
      </section>
      <aside className="login-preview" aria-hidden="true">
        <span className="preview-kana">きょう</span>
        <div className="preview-rule" />
        <span className="preview-translation">today</span>
        <div className="floating-score"><strong>24.8</strong><span>kana / min</span></div>
      </aside>
      <p className="login-foot">Built for quiet, consistent practice.</p>
    </main>
  );
}
