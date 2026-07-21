"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function AppShell({ uuid, children, kicker, title, aside }: { uuid: string; children: ReactNode; kicker: string; title: string; aside?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const shortKey = `${uuid.slice(0, 4)}••${uuid.slice(-4)}`;
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href={`/u/${uuid}/practice`} className="brand-lockup"><span className="brand-mark">あ</span><span>kana dojo</span></Link>
        <nav className="tabs" aria-label="Main navigation">
          <Link className={pathname.endsWith("/practice") ? "active" : ""} href={`/u/${uuid}/practice`}>Practice</Link>
          <Link className={pathname.endsWith("/statistics") ? "active" : ""} href={`/u/${uuid}/statistics`}>Statistics</Link>
        </nav>
        <button className="profile-pill" onClick={() => router.push("/")} aria-label="Sign out and return to login">
          <span className="profile-dot" /> {shortKey} <span className="exit-icon">↗</span>
        </button>
      </header>
      <main className="app-main">
        <div className="page-heading">
          <div><p className="eyebrow">{kicker}</p><h1>{title}</h1></div>
          {aside}
        </div>
        {children}
      </main>
    </div>
  );
}
