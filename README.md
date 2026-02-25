# Video Analyzer

AI-powered social media video performance analyzer. Upload a video or paste a URL, select a target platform (TikTok, Instagram, or YouTube), define your audience criteria, and get predicted KPI scores powered by Google Gemini.

## Features

- **Video analysis** — Upload a video file (up to 50 MB) or provide a direct URL
- **Multi-platform support** — TikTok, Instagram, and YouTube
- **Audience targeting** — Configure age range, gender, and interest tags
- **AI-predicted KPIs** — Impressions, Reach, CPM, CTR, CPC, Completion Rate, Conversions, CPA, ROAS, and View Duration
- **Video characteristics** — Quality score, hook strength, audience relevance, and detailed production metrics
- **Analysis history** — Browse and revisit past analyses
- **Realtime updates** — Results stream in via Supabase Realtime

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) with React 19 and TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
- **Auth & Database:** [Supabase](https://supabase.com/) (Auth, Postgres, Storage, Realtime)
- **AI:** [Google Gemini 2.5 Flash](https://ai.google.dev/) via REST API
- **Validation:** [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)

## Getting Started

### Prerequisites

- Node.js 20+
- [Yarn](https://classic.yarnpkg.com/) 1.x
- A [Supabase](https://supabase.com/) project (or the local CLI)
- A [Google Gemini API key](https://ai.google.dev/)

### Installation

```bash
yarn install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>

# Optional
APP_URL=http://localhost:3000
N8N_WEBHOOK_SECRET=<optional-webhook-bearer-token>
```

### Database Setup

Apply the Supabase migrations:

```bash
npx supabase db push
```

Or start a local Supabase stack:

```bash
npx supabase start
```

### Development

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
yarn build
yarn start
```

### Lint

```bash
yarn lint
```

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Sign-in / sign-up pages
│   ├── (dashboard)/     # Main app — analyze, history, results
│   └── api/
│       ├── analyze/     # POST: creates request, launches Gemini pipeline
│       └── webhook/     # POST: receives pipeline results
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── analyze/         # Video upload & analysis form
│   ├── results/         # KPI cards & results display
│   ├── history/         # Analysis history table
│   └── layout/          # Navbar, theme toggle, user menu
├── lib/
│   ├── gemini/          # Gemini video analysis pipeline
│   ├── supabase/        # Client, server, and admin helpers
│   ├── validators.ts    # Zod schemas
│   └── constants.ts     # Platforms, KPIs, audience options
├── types/
│   └── database.ts      # Generated Supabase types
supabase/
└── migrations/          # SQL migration files
```

### Data Flow

1. User submits a video via the `/analyze` form
2. `POST /api/analyze` creates an `analysis_requests` row and fire-and-forgets the Gemini pipeline
3. The pipeline downloads the video, uploads it to the Gemini Files API, extracts characteristics, and scores KPIs
4. Results are posted back to `POST /api/webhook/results`, which stores them in the database
5. The frontend receives updates via Supabase Realtime and displays results on `/results/[id]`
