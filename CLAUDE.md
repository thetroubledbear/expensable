# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Expensable** — personal/family expense tracker. Ingests CSV, PDF, and receipt images → extracts transactions via Claude API → dashboard with insights, subscription detection, and categorization.

## Monorepo Structure

Turborepo + npm workspaces.

```
apps/web/          Next.js 16 (web + API backend)
apps/mobile/       Expo (React Native — Phase 5)
packages/types/    Shared TypeScript types (@expensable/types)
packages/utils/    Shared utilities (@expensable/utils)
packages/db/       Prisma client + schema (@expensable/db)
packages/api-client/ Typed fetch wrapper (@expensable/api-client)
```

## Commands

```bash
# Start local services (Postgres + MinIO)
docker-compose up -d

# Run Prisma migrations
npm run db:migrate           # from root or apps/web
npm run db:studio            # Prisma Studio on :5555

# Web dev server (Turbopack)
cd apps/web && npm run dev   # localhost:3000

# Typecheck all packages
npm run type-check

# Lint
cd apps/web && npm run lint
```

## Next.js 16 Critical Rules

**Breaking changes from training data — always apply these:**

- `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` are ALL async — always `await` them
- Middleware file is `proxy.ts` (not `middleware.ts`), export `proxy` function
- `next lint` removed — use `eslint .` directly
- `revalidateTag(tag, cacheLifeProfile)` now requires second arg
- Turbopack is default for both `dev` and `build`
- No `serverRuntimeConfig`/`publicRuntimeConfig` — use env vars directly

## Architecture

### Auth
- NextAuth v5 (beta) in `apps/web/lib/auth/config.ts`
- Providers: Google OAuth + email/password (bcryptjs)
- JWT sessions, Prisma adapter
- Route protection via `proxy.ts` + `requireAuth()` server helper

### File Processing Pipeline
1. User uploads → `POST /api/files` → stored in MinIO (S3-compatible)
2. Row created in `UploadedFile` with `status: "pending"`
3. Background job fetches file → passes to `lib/ai/parser.ts` (Claude API)
4. `ParseResult` transactions written to `Transaction` table
5. `needsReview: true` transactions surfaced in categorization UI

### Database
Prisma schema at `packages/db/prisma/schema.prisma`. Key models:
- `Household` — unit of multi-user sharing (family)
- `HouseholdMember` — user ↔ household with role (owner/member)
- `HouseholdBilling` — tier + Stripe IDs + monthly file counter
- `UploadedFile` → `Transaction` (one-to-many)
- `DetectedSubscription` — recurring payments auto-detected

### Plans / Limits
Defined in `packages/types/src/index.ts` as `PLANS` constant:
- free: 3 files/month, 1 member
- pro: 30 files/month, 1 member
- family: 60 files/month, 6 members

### Storage
`apps/web/lib/storage/index.ts` — S3-compatible (MinIO locally, real S3 in prod). Key: `households/{householdId}/files/{fileId}/{filename}`.

### AI Parsing
`apps/web/lib/ai/parser.ts` — sends file content (text or base64 image) to `claude-sonnet-4-6`. Returns structured `ParsedTransaction[]`. Set `needsReview: true` for ambiguous entries.

## Local Dev Setup

1. Copy `apps/web/.env.example` → `apps/web/.env.local`
2. `docker-compose up -d`
3. Create MinIO bucket `expensable` via console at `localhost:9001`
4. `npm run db:migrate` to apply schema
5. `cd apps/web && npm run dev`

## Phase Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| 1 | ✅ Done | Monorepo + auth + DB schema + git |
| 2 | Next | File upload UI + Claude parsing pipeline |
| 3 | — | Dashboard + categorization UI |
| 4 | — | Insights + Stripe subscription |
| 5 | — | Expo mobile app |
