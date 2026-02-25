# Project knowledge

## What this is
Social media video performance analyzer — users upload a video (or paste a URL), pick a platform (TikTok / Instagram / YouTube), define target audience criteria, and get AI-predicted KPI scores via a Gemini-powered pipeline.

## Tech stack
- **Framework:** Next.js 16 (App Router) with React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix primitives + CVA)
- **Auth & DB:** Supabase (Auth, Postgres, Storage, Realtime)
- **AI:** Google Gemini 2.5 Flash via REST (Files API upload → generateContent)
- **Forms:** react-hook-form + zod validation
- **Package manager:** Yarn 1.x

## Commands
- `yarn install` — install dependencies
- `yarn dev` — start Next.js dev server (port 3000)
- `yarn build` — production build
- `yarn lint` — ESLint (next core-web-vitals + typescript)
- `npx supabase start` — start local Supabase stack
- `npx supabase db push` — apply migrations to remote

## Key directories
- `src/app/` — Next.js App Router pages & API routes
  - `(auth)/` — sign-in / sign-up pages
  - `(dashboard)/` — main app (analyze, history, results/[id])
  - `api/analyze/` — POST endpoint: creates DB record, fires Gemini pipeline
  - `api/webhook/results/` — callback that stores pipeline results
- `src/components/` — React components (shadcn `ui/`, feature folders)
- `src/lib/` — shared logic
  - `gemini/pipeline.ts` — full Gemini video analysis pipeline (download → upload → extract → score → callback)
  - `supabase/` — client/server/admin Supabase helpers
  - `validators.ts` — Zod schemas for forms & API
  - `constants.ts` — platforms, KPIs, age ranges, genders
- `src/types/database.ts` — generated Supabase DB types
- `supabase/migrations/` — SQL migration files

## Data flow
1. User submits video via `/analyze` form
2. `POST /api/analyze` creates an `analysis_requests` row (status: processing), then fire-and-forgets `runGeminiPipeline`
3. Pipeline: download video → upload to Gemini Files API → poll until ACTIVE → extract characteristics → score KPIs → POST results to webhook callback
4. `POST /api/webhook/results` inserts `analysis_results` rows, updates request status to "completed", stores characteristics
5. Frontend polls / uses Realtime to show results on `/results/[id]`

## Conventions
- Path alias: `@/*` → `./src/*`
- UI components live in `src/components/ui/` (shadcn)
- Feature components grouped by folder (analyze/, results/, history/, layout/)
- Zod schemas in `src/lib/validators.ts`
- Supabase DB types generated into `src/types/database.ts`
- ESLint config: next core-web-vitals + typescript rules

## Environment variables
- `GEMINI_API_KEY` — Google Gemini API key (required for pipeline)
- `N8N_WEBHOOK_SECRET` — optional bearer token for webhook auth
- `APP_URL` — base URL override (defaults to request origin)
- Supabase vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
