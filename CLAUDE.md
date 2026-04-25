# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Expensable** — personal/family expense tracker. Ingests CSV, PDF, and receipt images → extracts transactions via AI → dashboard with insights, subscription detection, and categorization.

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

# Run Prisma migrations (always from packages/db — never from apps/web)
cd packages/db && npx prisma migrate dev
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
- `after()` from `next/server` runs work after response is sent (stable since v15.1)

## Architecture

### Auth
- NextAuth v5 (beta) in `apps/web/lib/auth/config.ts`
- Providers: Google OAuth + email/password (bcryptjs)
- JWT sessions, Prisma adapter
- Route protection via `proxy.ts` + `requireAuth()` server helper
- Register API at `POST /api/auth/register` — creates User + Household + HouseholdBilling + sets `defaultCurrency`

### File Processing Pipeline
1. User uploads via drag-and-drop → `POST /api/files` (multipart/form-data, max 20 MB)
2. Magic-byte validation runs before storage (PDF=`%PDF`, JPEG=`FFD8FF`, PNG=`89504E47`, WebP=`RIFF`, CSV=UTF-8 text)
3. File stored in MinIO, `UploadedFile` row created with `status: "pending"`
4. `after()` fires `processFile()` after response — sets `status: "processing"`
5. `lib/ai/parser.ts` sanitizes input, dispatches to Claude or Ollama based on env
6. `ParseResult` transactions written to `Transaction` table, `status: "done"`
7. On error: `status: "failed"`, error stored in `errorMsg`
8. Files page polls every 3 s while any file is pending/processing

### AI Parsing — dual provider
`apps/web/lib/ai/parser.ts` dispatches based on `ANTHROPIC_API_KEY`:

| Env | Provider | CSV | PDF | Images |
|-----|----------|-----|-----|--------|
| `ANTHROPIC_API_KEY` set | Claude (`claude-sonnet-4-6`) | ✅ | ✅ | ✅ |
| `ANTHROPIC_API_KEY` empty | Ollama (`OLLAMA_MODEL`) | ✅ | ❌ | ✅ (if model supports vision) |

- Ollama client: `apps/web/lib/ai/ollama.ts` — calls `/api/chat` with `format: "json"`
- Default Ollama model: `gemma4:e4b` (set via `OLLAMA_MODEL` env var)
- PDF parsing with Ollama throws a clear error — requires Claude key
- AI prompt injection sanitization: `lib/ai/sanitize.ts` — strips 17 injection patterns, caps cells at 500 chars

### Null-safety in transaction mapping
Ollama models may return `null` for optional fields. `processFile()` applies fallbacks:
- `currency ?? "USD"` (uses household defaultCurrency in display, DB stores raw)
- `date ?? new Date()`
- `needsReview` auto-set `true` when date or currency was missing

### Auto-categorization in processFile
After AI parsing, `processFile()` maps `categoryHint` → system `Category` row:
- Hint→name map in `apps/web/lib/categories.ts` (`HINT_TO_CATEGORY`)
- Hints: food→Food & Drink, transport→Transport, utilities→Bills & Utilities, entertainment, health, shopping, travel, subscription→Bills & Utilities, income→Income
- `other` / `transfer` / no match / missing hint → categoryId=Other + `needsReview=true`
- `ensureCategories()` called before mapping — seeds system categories if table is empty (lazy seed, no separate CLI command needed)

### Database
Prisma schema at `packages/db/prisma/schema.prisma`. Key models:
- `Household` — `defaultCurrency String @default("USD")` — per-household currency preference
- `HouseholdMember` — user ↔ household with role (owner/member)
- `HouseholdBilling` — tier + Stripe IDs + monthly file counter
- `UploadedFile` → `Transaction` (one-to-many)
- `DetectedSubscription` — recurring payments auto-detected

Prisma env: `DATABASE_URL` = Neon pooled URL (pgbouncer, used at runtime); `DIRECT_URL` = Neon direct URL (used by migrations only). Set both in `apps/web/.env.local` and Vercel env vars.  
Do NOT run `db:migrate` from both `packages/db` and `apps/web` at the same time — advisory lock conflict.  
If `prisma generate` fails with EPERM on `.dll.node`: dev server is holding the file — kill node, delete the `.node` file, regenerate.

### Plans / Limits
Defined in `packages/types/src/index.ts` as `PLANS` constant:
- free: 25 files/month, 1 member
- pro: 60 files/month, 1 member
- family: 1000 files/month, 6 members

### Storage
`apps/web/lib/storage/index.ts` — Google Cloud Storage.  
Key pattern: `households/{householdId}/files/{fileId}/{filename}`.  
Auth: `GCS_SERVICE_ACCOUNT_KEY` env (full service account JSON string) for Vercel; locally use `gcloud auth application-default login`.  
Bucket name via `GCS_BUCKET` env (default: `expensable`).

### Household & Currency API
- `GET /api/household` — returns current user's household (name, defaultCurrency, etc.)
- `PATCH /api/household` — owner-only; updates name and/or defaultCurrency
- Supported currencies: USD, EUR, GBP, CHF, CAD, AUD, JPY, NOK, SEK, DKK, NZD, SGD, HKD, PLN

### UI Design System
- **Sidebar**: dark (`bg-slate-950`), emerald active state, lucide-react icons
- **Main area**: `bg-slate-50` background, white cards with `rounded-2xl`
- **Accent**: `emerald-600` for buttons, active nav, progress bars
- **Page containers**: always `mx-auto w-full` with a `max-w-*` — never left-aligned
- **Auth pages**: centered card on `slate-50`, Wallet logomark in emerald
- **Status badges**: amber=pending, blue=processing, emerald=done, red=failed
- **Table cards**: do NOT use `overflow-hidden` — clips dropdown menus (CategoryPicker, delete confirm)
- Component files: `components/sidebar.tsx`, `components/upload-dropzone.tsx`, `components/files-poller.tsx`, `components/category-picker.tsx`, `components/transactions-table.tsx`, `components/file-delete-button.tsx`

### Onboarding (Phase 3.5)
5-step intro wizard shown once to new users on both web and mobile.

**DB:** `User.onboardingCompleted Boolean @default(false)` — run migration after pulling: `cd packages/db && npx prisma migrate dev --name add-onboarding-flag`

**Web flow:**
- Register → redirects to `/onboarding` (callbackUrl changed in register page)
- Dashboard checks `!onboardingCompleted && fileCount === 0` → redirects to `/onboarding` (catches users who land on dashboard directly)
- Server page: `apps/web/app/onboarding/page.tsx` — checks auth + flag, redirects if already done
- Client wizard: `apps/web/components/onboarding-wizard.tsx` — matches dark glassmorphic auth design
- API: `POST /api/user/complete-onboarding` — sets `onboardingCompleted = true`

**Mobile flow:**
- `apps/mobile/lib/auth.tsx` — `onboardingCompleted` state (defaults `true` to avoid flash), read from `SecureStore` key `onboarding_<userId>` on login/init
- `completeOnboarding()` in auth context — saves to SecureStore + calls API
- `apps/mobile/App.tsx` — `RootNavigator` renders `<OnboardingScreen />` when `user && !onboardingCompleted`
- Screen: `apps/mobile/screens/OnboardingScreen.tsx`

**Steps (same content on both platforms):**
1. Welcome / Meet Expensable — stat cards preview
2. Import Any File — CSV / PDF / IMG file type badges
3. AI Does the Work — categorized transaction rows preview
4. Powerful Dashboard — bar chart + top merchant preview
5. Bring Your Household — avatar stack + family badge

### Dashboard Analytics
Dashboard shows (current month only):
- **Money out** — sum of debit transactions
- **Money in** — sum of credit transactions
- **Net** — money in minus money out (green if positive, red if negative)
- **Recent transactions** — last 6, with merchant name + formatted amount
- **Top spending** — top 5 merchants by debit total, with % bar
- Amounts formatted with `Intl.NumberFormat` using household `defaultCurrency`

### Transaction APIs (Phase 3)
- `GET /api/transactions` — paginated list (25/page), filters: `search`, `type` (debit|credit), `categoryId` (id or "uncategorized"), `needsReview=true`
- `PATCH /api/transactions/[id]` — update `categoryId` (nullable) or `needsReview`; IDOR-protected
- `DELETE /api/transactions` — bulk delete, body `{ ids: string[] }` (max 200); IDOR via householdId filter
- `GET /api/categories` — list all, lazy-seeds system categories on first call
- `GET /api/files/[id]` — single file with transaction count; `DELETE /api/files/[id]` — deletes storage + DB (cascades transactions)

### Security (implemented by SuperSecGuy)
- Magic-byte file validation — MIME type alone is not trusted
- AI prompt injection sanitization via `lib/ai/sanitize.ts`
- Rate limit on `POST /api/files`: 10 uploads/minute per user (in-memory Map)
- All DB/storage errors return generic messages — no internal paths or stack traces leaked
- All API routes validate input with zod, length-bounded
- IDOR protection: file/transaction access always verified against caller's household membership

## Local Dev Setup

1. Copy `apps/web/.env.example` → `apps/web/.env.local` and fill in `NEXTAUTH_SECRET`
2. `docker-compose up -d`
3. Create MinIO bucket `expensable` via console at `localhost:9001` (minioadmin / minioadmin)
4. `cd packages/db && npx prisma migrate dev --name init`
5. `cd apps/web && npm run dev`
6. For AI parsing without Claude: install Ollama, pull `ollama pull gemma4:e4b`, leave `ANTHROPIC_API_KEY` empty

## Monorepo Fixes Applied
- `packageManager` field added to root `package.json` (required by Turborepo 2.x)
- All shared packages (`types`, `utils`, `api-client`, `db`, `mobile`) have `tsconfig.json` + `type-check` script
- `db:migrate` script removed from `apps/web/package.json` to avoid dual-run lock conflict

## Phase Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| 1 | ✅ Done | Monorepo + auth + DB schema + git |
| 2 | ✅ Done | File upload UI + AI parsing + files list + security hardening |
| 2.5 | ✅ Done | Dashboard analytics (money in/out/net, top merchants) + currency settings + page centering |
| 3 | ✅ Done | Transaction list + auto-categorization + bulk delete + category picker UI |
| 3.5 | ✅ Done | Onboarding wizard — 5-step flow (web + mobile) |
| 4 | — | Insights + Stripe subscription |
| 5 | — | Expo mobile app |
