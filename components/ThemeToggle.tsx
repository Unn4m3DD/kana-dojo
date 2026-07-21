"use client";

type Theme = "dark" | "light";

export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("kana-dojo-theme", nextTheme);
  }

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
    >
      <svg className="theme-sun" aria-hidden="true" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="3.25" />
        <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" />
      </svg>
      <svg className="theme-moon" aria-hidden="true" viewBox="0 0 20 20">
        <path d="M16.5 12.9A7 7 0 0 1 7.1 3.5a7 7 0 1 0 9.4 9.4Z" />
      </svg>
    </button>
  );
}
