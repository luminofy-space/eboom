# eBoom Coding Conventions

This document describes patterns already used in the eBoom codebase. Follow these conventions when adding or changing code so new work matches existing style.

For project overview and setup, see [README.md](README.md) and [Setup.md](Setup.md). For system and money-flow internals, read [ARCHITECTURE.md](ARCHITECTURE.md) and [TRANSACTIONS.md](TRANSACTIONS.md).

## Repository Layout

| Location | Purpose |
|----------|---------|
| `eboom-frontend/app/` | Thin Next.js route files — delegate to views |
| `eboom-frontend/src/views/{feature}/` | Feature pages, detail views, modals |
| `eboom-frontend/src/components/` | App-specific shared components |
| `eboom-frontend/components/ui/` | shadcn/ui primitives (no feature logic) |
| `eboom-frontend/src/api/` | Axios wrappers, URL constants, snake/camel transforms |
| `eboom-frontend/src/redux/` | UI state only (modals, search, canvas selection) |
| `eboom-frontend/src/hooks/` | Reusable React hooks |
| `eboom-backend/src/routes/` | Route handlers (inline; no separate controller layer) |
| `eboom-backend/src/db/schema/` | Drizzle schema and inferred types |
| `eboom-backend/src/middleware/` | Auth, upload, rate limiting |
| `eboom-backend/src/services/` | Shared services (email, attachments) |

## Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| TypeScript identifiers | camelCase | `expenseCategoryId` |
| React components / page files | PascalCase | `ExpensesListPage.tsx` |
| Hooks / utils | camelCase | `useAuth.ts`, `canvasUtils.ts` |
| Backend route files | kebab-case | `to-buy-items.ts`, `expense-categories.ts` |
| Redux slices | `{feature}Slice.ts` | `expenseSlice.ts` |
| DB columns in Drizzle TS | camelCase property, snake_case SQL | `firstName` → `first_name` |
| API JSON from DB | snake_case | Transformed to camelCase on frontend via `snakeToCamel` |

## Frontend Architecture

### State management split

| Concern | Tool | Examples |
|---------|------|----------|
| Server / API data | TanStack Query | Lists, details, currencies |
| UI chrome | Redux | Modal open/close, search query, canvas ID |
| Auth tokens | `AuthProvider` context + localStorage | Not Redux |

Use `useQueryApi` and `useMutationApi` from `src/api/` for API calls. Do not fetch server data into Redux slices.

### Thin pages, fat views

Route files in `app/` should only import and render a view component:

```tsx
"use client";

import IncomesListPage from "@/src/views/incomes/IncomesListPage";

export default function IncomesPage() {
  return <IncomesListPage />;
}
```

### List page template

Existing list pages follow a common pattern:

- `useInfiniteList` for paginated data
- `GridCard` for item display
- `FloatingAddButton` to open create modals
- Redux slice for modal open/close state
- `ConfirmDeleteDialog` for deletions

Reference: `src/views/expenses/ExpensesListPage.tsx`, `src/views/incomes/IncomesListPage.tsx`.

### Forms

- Use `react-hook-form` with shadcn Dialog and form field components
- Handle field errors from API `data.errors` in mutation callbacks

### API URLs

All endpoint paths belong in [`src/api/urls.ts`](eboom-frontend/src/api/urls.ts). Do not hardcode API paths in view components.

### Path aliases

- `@/*` → project root (`eboom-frontend/`)
- `@backend/*` → `../eboom-backend/src/*` (shared DB types)

Example: import types from `@backend/db/schema`.

## Backend Architecture

### Route structure

All routes mount under `/api` in [`src/app.ts`](eboom-backend/src/app.ts).

**Canvas-scoped resources** (list/create within a canvas):

```
/api/canvases/:canvasId/expenses
/api/canvases/:canvasId/income-resources
/api/canvases/:canvasId/wallets
```

**Entity CRUD** (get/update/delete by ID):

```
/api/expenses/:id
/api/wallets/:id
/api/income/resources/:id
```

Register new routers in [`src/routes/index.ts`](eboom-backend/src/routes/index.ts).

### Canvas access

Every protected handler that reads or writes canvas-scoped data must verify membership using the existing `checkCanvasAccess()` pattern in route handlers.

### Error handling

```typescript
try {
  // database operation
} catch (err) {
  console.error("Error fetching X:", err);
  res.status(500).json({ error: "Failed to fetch X" });
}
```

Use early returns for `400`, `401`, `403`, and `404`. Response shape: `{ error: "message" }`.

### Authentication

- Clients send `Authorization: Bearer <token>`
- [`middleware/auth.ts`](eboom-backend/src/middleware/auth.ts) validates the JWT locally and attaches `req.appUser`
- Dev bypass: set `TEST_USER_ID` in backend `.env` (never in production)

### Money movement rule

- All balance mutations must use `ledgerService` (`creditWalletBalance` / `debitWalletBalance`)
- Route handlers must not directly update `wallet_balances`
- Model movements as `income_entries`, `expense_payments`, and `transfers`

### File uploads

- Multer middleware writes files to `uploads/`
- Metadata stored via `attachmentService` in the `attachments` table
- Files served at `/uploads/*`

## Data Layer

### Schema changes

1. Edit [`src/db/schema/schema.ts`](eboom-backend/src/db/schema/schema.ts)
2. Run `npm run db:migrate`
3. Seed if needed: `npm run db:seed` (or `db:seed:safe`, `db:seed:hybrid`, `db:seed:specific`)

Do not edit `schema_old.ts` — it is legacy and unused.

### Shared types

The frontend imports database types from the backend via the `@backend/db/schema` path alias. There is no separate shared package; keep schema types in the backend and import them on the frontend when needed.

### Case transformation

- Database columns and raw API responses use snake_case
- Frontend transforms responses with `snakeToCamel()` in the API layer
- Request bodies are mixed today — match the nearest existing route when adding endpoints

## Adding a New Feature

1. Add or update Drizzle tables in `schema.ts`
2. Run migration (`npm run db:migrate`)
3. Add Express routes in `src/routes/` and register in `routes/index.ts`
4. Add URL constants to frontend `src/api/urls.ts`
5. Create views in `src/views/{feature}/` (list, detail, modals)
6. Add a thin page in `app/(dashboard)/`
7. Add a Redux slice if modal or search UI state is needed
8. Add a sidebar entry in [`src/components/layout/app-sidebar.tsx`](eboom-frontend/src/components/layout/app-sidebar.tsx)

For placeholder features not yet implemented, use `ComingSoonPlaceholder`.

## UI Conventions

- **Primary UI:** shadcn/ui + Tailwind CSS 4
- **Icons:** Lucide for sidebar and navigation; Tabler where already used in a feature
- **Toasts:** Prefer `sonner` (wired in the app layout). Do not add another toast library.
- **Themes:** Dark mode supported via `next-themes`

## Environment and Security

- Never commit `.env` files
- `TEST_USER_ID` (backend) and `NEXT_PUBLIC_TEST_MODE` (frontend) are dev-only auth bypasses
- `DEFAULT_GUEST_USER_ID` must be set for public wishlist routes to work
- Password reset and verification tokens are stored in memory on the backend (lost on restart)

## Known Inconsistencies

Do not extend these patterns; match nearby code when touching related areas:

| Issue | Guidance |
|-------|----------|
| Mixed request body casing | Signup uses `first_name`; some updates use `entityId` — follow the existing route you extend |
| Trailing slashes | Auth routes use trailing slashes (`/api/auth/login/`); most others do not — follow `urls.ts` per route group |
| Duplicate sidebar components | Use `src/components/layout/app-sidebar.tsx`, not `components/layout/SideBar.tsx` |
| Unused dependencies | `joi`, `roleAuth` middleware, and `i18next` are installed but not wired — do not build on them until integrated |
| Toast libraries | Both `sonner` and `react-toastify` exist — use `sonner` for new code |
| Redux persist whitelist | Store references `auth` reducer that does not exist — do not add auth to Redux |

## What We Don't Have Yet

There are no established conventions for:

- Automated tests (no test runner or test files)
- Code formatting (no Prettier config)
- API documentation (no OpenAPI spec)
- Monorepo tooling (each package has its own `package.json`)

When these are added, update this document.
