"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function AppShell({ uuid, children, kicker, title, aside }: { uuid: string; children: ReactNode; kicker: string; title: string; aside?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (copyResetTimer.current !== null) window.clearTimeout(copyResetTimer.current);
  }, []);

  async function copyStudyId() {
    try {
      await navigator.clipboard.writeText(uuid);
    } catch {
      const field = document.createElement("textarea");
      field.value = uuid;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    if (copyResetTimer.current !== null) window.clearTimeout(copyResetTimer.current);
    copyResetTimer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href={`/u/${uuid}/practice`} className="brand-lockup"><span className="brand-mark">あ</span><span>kana dojo</span></Link>
        <nav className="tabs" aria-label="Main navigation">
          <Link className={pathname.endsWith("/practice") ? "active" : ""} href={`/u/${uuid}/practice`}>Practice</Link>
          <Link className={pathname.endsWith("/statistics") ? "active" : ""} href={`/u/${uuid}/statistics`}>Statistics</Link>
        </nav>
        <div className="profile-pill" aria-label={`Study ID ${uuid}`}>
          <span className="profile-dot" />
          <span className="profile-key"><small>STUDY ID</small><code>{uuid}</code></span>
          <button className="copy-id" type="button" onClick={() => void copyStudyId()} aria-label="Copy study ID">{copied ? "Copied" : "Copy"}</button>
          <button className="logout-button" type="button" onClick={() => router.push("/")} aria-label="Log out and return to login">
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M6.25 2.5H3.5v11h2.75M9.5 5l3 3-3 3M12.5 8H6" /></svg>
            <span>Log out</span>
          </button>
        </div>
      </header>
      <main className="app-main">
        <div className="page-heading">
          <div><p className="eyebrow">{kicker}</p>{title ? <h1>{title}</h1> : null}</div>
          {aside}
        </div>
        {children}
      </main>
    </div>
  );
}
