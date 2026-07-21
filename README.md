# Kana Dojo

A focused hiragana-to-romaji practice app built with standard Next.js. Practice timing pauses when the browser loses focus, translations appear after submission, and statistics include adaptive kana mastery tracking.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Environment variables

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

Without Turso credentials, practice attempts fall back to browser-local storage.

## Verification

```bash
npm run lint
npm run build
npm test
```

`npm run build` uses the native Next.js builder and writes the Vercel-compatible `.next` output directory.

## Vercel

Import the repository with the Next.js framework preset and leave the Build Command and Output Directory overrides disabled. Add the two Turso variables above to the desired environments.
