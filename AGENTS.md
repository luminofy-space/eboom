# AGENTS.md

Guidance for AI coding agents working in this repository. Human-facing docs:
- [README.md](README.md): overview + Docker
- [Setup.md](Setup.md): detailed setup
- [CONVENTIONS.md](CONVENTIONS.md): full coding conventions
- [docs/](docs/README.md): module-by-module engineering docs

Rules here are a summary. When this file and `CONVENTIONS.md` disagree, `CONVENTIONS.md` wins.

## Project overview

eBoom is a personal finance management app. Three independent npm packages, no monorepo tooling:

| Path | Stack |
|------|-------|
| `eboom-backend/` | Express 4 + TypeScript + Drizzle ORM + PostgreSQL 16 |
| `eboom-frontend/` | Next.js 15 (App Router) + React 19 + Tailwind 4 + shadcn/ui |
| `docs/` | VitePress docs site |

## Setup commands

Docker is the default dev path (Postgres, backend, frontend, Mailpit, docs, Drizzle Studio):

```bash
cp .env.example .env
docker compose up --build   # portal :3001 lists every app: frontend :3000, backend :4000, mailpit :8025, docs :5173, studio :4983
docker compose exec backend npm run db:migrate   # apply schema
docker compose exec backend npm run db:seed   # seed data
```

Without Docker, each app reads its own env file (`eboom-backend/.env.sample`,
`eboom-frontend/.env.example`) — the root `.env` is not used in that mode:

```bash
cd eboom-backend  && npm ci && npm run db:migrate && npm run dev   # :4000
cd eboom-frontend && npm ci && npm run dev                         # :3000
```

## Validation commands

Run these before declaring work done. They mirror `.github/workflows/ci.yml`, which
gates every PR against `main`:

```bash
cd eboom-backend  && npm run type-check && npm run build
cd eboom-frontend && npm run type-check && npm run lint && npm run build
cd docs           && npm run build     # fails on dead internal links and bad mermaid
```

There is **no test runner and no test files** in this repo yet. Do not invent one or
add a testing framework unless explicitly asked. `npm test --if-present` in CI is a
no-op placeholder.

There is **no Prettier config**. Match the formatting of surrounding code; do not
reformat files you are not otherwise changing.

## Architecture rules (non-negotiable)

These are correctness and security invariants, not style preferences.

- **Canvas access.** Every handler touching canvas-scoped data must use
  `requireCanvasAccess(level)` from `eboom-backend/src/middleware/canvasAccess.ts`, after
  auth middleware. Read `req.canvasId` / `req.canvasMembership` from the request, and for
  entity routes verify the record's `canvasId` matches before acting. Levels: `view`,
  `edit`, `manage_members`, `manage_canvas`.
- **Money movement.** All balance mutations go through `ledgerService`
  (`creditWalletBalance` / `debitWalletBalance`). Route handlers must never write
  `sub_wallets` directly. Model movements as `income_entries`, `expense_payments`, `transfers`.
- **Errors.** API failures return a stable i18n `errorKey`, never English copy. Use
  `sendError` / `sendFieldErrors` and the `ErrorKeys` catalog in `src/errors/`. Prefer
  throwing `AppError` inside `asyncHandler`. Never add new `{ error: "some English string" }`
  responses.
- **User-facing strings.** Never hardcode copy in JSX. Use `useTranslation(ns)` with the
  JSON namespaces in `eboom-frontend/public/locales/{lng}/`. Use `formatMoney` /
  `formatAmount` from `src/i18n/formatters.ts` instead of raw `Intl.NumberFormat`.
- **Docs.** Any change that alters architecture, schema, API contracts, money-flow rules,
  or a feature module must update the matching file under `docs/` in the same change set.
  See the "Documentation Criteria" section of `CONVENTIONS.md` for the full test.

## Code layout and style

| Location | Purpose |
|----------|---------|
| `eboom-frontend/app/` | Thin Next.js route files — render a view, nothing else |
| `eboom-frontend/src/views/{feature}/` | Pages, detail views, modals (the real logic) |
| `eboom-frontend/src/api/` | Axios wrappers, `urls.ts`, snake↔camel transforms |
| `eboom-frontend/src/redux/` | UI state only (modals, search, canvas selection) |
| `eboom-frontend/components/ui/` | shadcn/ui primitives — no feature logic |
| `eboom-backend/src/routes/` | Route handlers inline; no controller layer |
| `eboom-backend/src/services/` | Shared services (ledger, email, AI, canvas access) |
| `eboom-backend/src/db/schema/` | Drizzle schema + inferred types |

Naming: camelCase TS identifiers, PascalCase React components, kebab-case backend route
files (`expense-categories.ts`), `{feature}Slice.ts` for Redux slices.

Frontend state split: **TanStack Query** for server data (via `useQueryApi` /
`useMutationApi`), **Redux** for UI chrome only, **`AuthProvider` context** for tokens.
Never fetch server data into Redux.

All endpoint paths belong in `eboom-frontend/src/api/urls.ts` — do not hardcode paths in
components. Path aliases: `@/*` → frontend root, `@backend/*` → `eboom-backend/src/*`.

UI: shadcn/ui + Tailwind 4. Use the `Stack` / `Grid` / `Container` / `Typography`
primitives from `components/ui/` instead of repeating utility classes. Snackbars go
through notistack helpers in `src/lib/notify.ts` — do not add new `sonner` usage.

## Schema changes

1. Edit `eboom-backend/src/db/schema/schema.ts` (never `schema_old.ts` — legacy, unused).
2. Run `npm run db:generate` in `eboom-backend` and **commit** the generated files under
   `src/db/migrations/`. CI has a drift gate that fails the build if the schema changed
   without a matching migration.
3. Apply with `npm run db:migrate` — in every environment. No container applies the
   schema on boot. `db:push` bypasses the migration journal and `--force` drops columns
   to match the schema, so use it only against a local database you can throw away.

## Adding a feature

Schema → migration → route in `src/routes/` registered in `routes/index.ts` → URL constant
in `src/api/urls.ts` → views in `src/views/{feature}/` → thin page in `app/(dashboard)/` →
Redux slice if modal state is needed → sidebar entry in
`src/components/layout/app-sidebar.tsx` → doc under `docs/`.

## Security

- Never commit `.env`, `.env.prod`, or any real secret. Only `*.example` files are tracked.
- `TEST_USER_ID` (backend) and `NEXT_PUBLIC_TEST_MODE` (frontend) are dev-only auth
  bypasses. Never enable them in production paths or default them to on.
- Password reset and verification tokens live in backend memory and are lost on restart —
  do not build persistence assumptions on them.

## Known inconsistencies — do not extend

Match nearby code rather than "fixing" these globally:

- Mixed request body casing (signup uses `first_name`; some updates use `entityId`).
- Trailing slashes on auth routes (`/api/auth/login/`) but not elsewhere — follow `urls.ts`.
- Two sidebar components exist; use `src/components/layout/app-sidebar.tsx`.
- `joi` and `roleAuth` middleware are installed but unwired — do not build on them.
- Redux persist whitelist references a nonexistent `auth` reducer — do not add auth to Redux.

## Git and PR conventions

- Branch off `main`; branch names like `feat/…`, `fix/…`, `docs/…`.
- Commit subjects are short, lowercase, imperative (`add exchange rate`, `fix lint issues`).
- **Agents must not run `git add`, `git commit`, `git push`, `git pull`, or `git merge`,
  and must not revert or unstage changes.** Stop and let a human review and commit.
- PRs into `main` must pass the `backend`, `frontend`, `docs`, and `db-schema` CI jobs.

## Answering style

Keep responses short and direct. Prefer editing existing files over creating new ones, and
do not create documentation files unless asked.

## Updating agent guidance

When a session surfaces a learning worth persisting for future agents (a convention, a
gotcha, a corrected assumption), update this `AGENTS.md` file in place. Do not create or
edit a `CLAUDE.md` or any other agent context file for this purpose — this file is the
single source of truth for agent guidance in this repo.
