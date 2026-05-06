# SpecForge

Spec-writing is the new core skill. SpecForge turns rough ideas, screenshots, or natural-language descriptions into structured specs (UI components, data model, process flow, acceptance criteria) that AI dev agents (Cursor, Claude Code, an Appian dev agent) can execute against.

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind v4, dark mode, mobile-first
- Neon Postgres via @neondatabase/serverless (ensureDb pattern, no /api/init)
- Anthropic Claude with structured tool use for forced-shape output
- @vercel/analytics + @vercel/speed-insights
- Vercel for deployment

## Env vars

```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
ANTHROPIC_API_KEY=sk-ant-...
```

## Routes

- `/` - generate a spec from text or image
- `/spec/[id]` - shareable spec view
- `/about` - what this is and why
- `/api/spec` POST - generate a new spec
- `/api/spec/[id]` GET - fetch a stored spec
- `/api/export/[id]/[format]` GET - export as cursor / appian / linear / json

## Local dev

```
npm install
DATABASE_URL=... ANTHROPIC_API_KEY=... npm run dev
```
