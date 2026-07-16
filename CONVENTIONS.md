# eBoom Coding Conventions

This document describes patterns already used in the eBoom codebase. Follow these conventions when adding or changing code so new work matches existing style.

For project overview and setup, see [README.md](README.md) and [Setup.md](Setup.md). For product status and money-flow rules, read [`docs/00-overview.md`](docs/00-overview.md). For module-by-module engineering docs, see [`docs/`](docs/README.md).

## Documentation Criteria

> **Any major change that impacts the system must be documented.** Update the related sections under [`docs/`](docs/) in the same change set as the code. Do not leave engineering docs describing outdated behavior, APIs, file paths, or mental models.

**Treat a change as major (docs required) when it does any of the following:**

- Alters architecture, request lifecycle, tenancy, auth, or cross-cutting middleware/services
- Changes schema, API contracts, money-flow / ledger rules, or how modules cooperate
- Adds, removes, or substantially reshapes a feature module (routes, views, services, data model)
- Introduces a new pattern that future work should follow (or retires an existing one)
- Invalidates file references, diagrams, or “why / where / how” explanations already in `docs/`

**When docs are required:**

1. Identify the affected docs via the index in [`docs/README.md`](docs/README.md) (overview `00`, core `01`–`03`, feature docs `04`–`15`).
2. Edit those sections so they match the code **as it exists after the change** — why it exists, where the code lives, and how frontend and backend cooperate.
3. If you add a new major module, create a new numbered doc under `docs/` and register it in `docs/README.md`.
4. Keep concerns split: [`CONVENTIONS.md`](CONVENTIONS.md) for contribution patterns; [`docs/`](docs/) for how the system works (including [`docs/00-overview.md`](docs/00-overview.md) for status and money-flow rules).

Minor local fixes (typos, styling, isolated refactors with no behavioral or structural impact) do not require doc updates unless they change paths or examples cited in `docs/`.

## Repository Layout

| Location | Purpose |
|----------|---------|
| `docs/` | Module-by-module engineering docs — keep in sync with major system changes |
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
- Handle field errors from API `data.errors` (i18n keys) via `useMutationApi`'s `fieldError`
- For create/update/delete, pass `successKey` to `useMutationApi`; errors snackbar automatically from `errorKey`

```ts
useMutationApi(url, {
  method: "post",
  successKey: "success.expense.created",
});
```

### API URLs

All endpoint paths belong in [`src/api/urls.ts`](eboom-frontend/src/api/urls.ts). Do not hardcode API paths in view components.

### Path aliases

- `@/*` → project root (`eboom-frontend/`)
- `@backend/*` → `../eboom-backend/src/*` (shared DB types)

Example: import types from `@backend/db/schema`.

## Backend Architecture

### Route structure

All routes mount under `/api` in [`src/app.ts`](eboom-backend/src/app.ts).

**Canvas-scoped resources** (all entity operations include `:canvasId`):

```
/api/canvases/:canvasId/expenses
/api/canvases/:canvasId/incomes
/api/canvases/:canvasId/wallets
/api/canvases/:canvasId/assets
/api/canvases/:canvasId/transfers
```

**Entity CRUD** (get/update/delete by ID within a canvas):

```
/api/canvases/:canvasId/expenses/:expenseId
/api/canvases/:canvasId/wallets/:walletId
/api/canvases/:canvasId/incomes/:incomeId
```

Register new routers in [`src/routes/index.ts`](eboom-backend/src/routes/index.ts).

### Canvas access

Every protected handler that reads or writes canvas-scoped data must use the `requireCanvasAccess` middleware from [`middleware/canvasAccess.ts`](eboom-backend/src/middleware/canvasAccess.ts). Auth middleware must run first. All canvas-scoped routers are mounted under `/api/canvases/:canvasId/...`.

```typescript
import { requireCanvasAccess } from "../middleware/canvasAccess";

router.get("/summary", requireCanvasAccess("view"), async (req, res) => {
  const canvasId = req.canvasId!;
  const membership = req.canvasMembership!;
  // ...
});

// Entity routes: verify the record belongs to req.canvasId
router.put("/:expenseId", requireCanvasAccess("edit"), async (req, res) => {
  const canvasId = req.canvasId!;
  const [existing] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
  if (!existing || existing.canvasId !== canvasId) {
    return res.status(404).json({ error: "Expense not found" });
  }
  // ...
});
```

On success, the middleware sets `req.canvasId` and `req.canvasMembership`. Permission levels: `view`, `edit`, `manage_members`, `manage_canvas`.

### Error handling

All API failures use a stable **error key** (i18n path), not English copy, so the UI can translate them:

```json
{
  "errorKey": "errors.expense.notFound",
  "params": { "id": 12 }
}
```

Optional field errors (values are also keys):

```json
{
  "errorKey": "errors.validation.failed",
  "errors": { "amount": "errors.validation.amountPositive" }
}
```

Backend helpers (use these instead of ad-hoc `{ error: "..." }`):

- [`src/errors/errorKeys.ts`](eboom-backend/src/errors/errorKeys.ts) — catalog of keys
- [`src/errors/AppError.ts`](eboom-backend/src/errors/AppError.ts) — throwable typed error
- [`src/errors/sendError.ts`](eboom-backend/src/errors/sendError.ts) — `sendError` / `sendFieldErrors`
- [`src/middleware/errorHandler.ts`](eboom-backend/src/middleware/errorHandler.ts) — maps `AppError` / unknowns to the unified JSON
- [`src/utils/asyncHandler.ts`](eboom-backend/src/utils/asyncHandler.ts) — forwards async rejections to the error middleware

```typescript
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

if (!existing) {
  return sendError(res, ErrorKeys.expense.notFound, 404);
}

try {
  // database operation
} catch (err) {
  console.error("Error creating expense:", err);
  return sendError(res, ErrorKeys.expense.createFailed, 500);
}
```

Prefer throwing `AppError` inside `asyncHandler` when a whole handler can be wrapped; otherwise early-return with `sendError`. New and updated handlers must use `errorKey` responses.

### Authentication

- Clients send `Authorization: Bearer <token>`
- [`middleware/auth.ts`](eboom-backend/src/middleware/auth.ts) validates the JWT locally and attaches `req.appUser`
- Dev bypass: set `TEST_USER_ID` in backend `.env` (never in production)

### Money movement rule

- All balance mutations must use `ledgerService` (`creditWalletBalance` / `debitWalletBalance`)
- Route handlers must not directly update `sub_wallets`
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
9. Document the feature under [`docs/`](docs/) (new numbered doc and/or updates to related core/feature sections) — see [Documentation Criteria](#documentation-criteria)

For placeholder features not yet implemented, use `ComingSoonPlaceholder`.

## UI Conventions

- **Primary UI:** shadcn/ui + Tailwind CSS 4
- **Layout primitives:** `Stack`, `Grid`, `Container`, `Center` from [`components/ui/`](eboom-frontend/components/ui/) — use these instead of repeating flex/grid/padding classes on raw `div`s
- **Typography:** `Typography` from [`components/ui/typography.tsx`](eboom-frontend/components/ui/typography.tsx) — use variants (`display`, `heading`, `title`, `muted-sm`, `stat`, etc.) instead of repeating text size/color classes on raw elements
- **Page loading:** `PageLoader` from [`components/ui/page-loader.tsx`](eboom-frontend/components/ui/page-loader.tsx) in route `loading.tsx` files; use `Spinner` for inline/button loading states
- **Forms:** shadcn `Field`, `FieldGroup`, `FieldLabel` for form layout; combine with `Stack` for multi-column rows
- **Icons:** Lucide for sidebar and navigation; Tabler where already used in a feature
- **Snackbars:** Prefer **notistack** via [`src/lib/notify.ts`](eboom-frontend/src/lib/notify.ts) (`notifySuccess` / `notifyError`). Do not add new `sonner` or ad-hoc toast usage. Wire success through `useMutationApi`'s `successKey` whenever possible so CRUD feedback stays centralized.
- **Themes:** Dark mode supported via `next-themes`

## Internationalization (i18n)

- **Stack:** `i18next` + `react-i18next` with JSON files in [`public/locales/{lng}/`](eboom-frontend/public/locales/)
- **Config:** [`src/i18n/index.ts`](eboom-frontend/src/i18n/index.ts), wrapped by `I18nProvider` in the root layout
- **Namespaces:** One JSON file per feature area — `common`, `errors`, `success`, `auth`, `navigation`, `expenses`, `incomes`, `wallets`, `profile`, `canvas`, …
- **API errors / success:** Backend `errorKey` values map to the `errors` namespace (strip leading `errors.`). Mutation success copy uses the `success` namespace via `successKey` on `useMutationApi` (e.g. `success.expense.created`).
- **Usage:** `const { t } = useTranslation("expenses")` then `t("modal.create.title")` — never hardcode user-facing strings in JSX
- **Key naming:** Nested camelCase objects grouped by section (e.g. `actions.add`, `status.paid`); use `{{variable}}` for interpolation
- **Shared strings:** Put reusable labels (`Add`, `Cancel`, `Delete`) in `common.json`
- **Formatting:** Use `formatMoney` / `formatAmount` / `formatRelativeEdit` from [`src/i18n/formatters.ts`](eboom-frontend/src/i18n/formatters.ts) instead of hardcoded `Intl.NumberFormat("en-US", ...)`
- **Language selector:** `LanguageSwitcher` in the sidebar account menu; preference stored in localStorage (`eboom-language`)
- **Adding locales:** Mirror the `en/` JSON structure under a new folder (e.g. `de/`, `fa/`), extend `SUPPORTED_LANGUAGES` in [`src/i18n/languages.ts`](eboom-frontend/src/i18n/languages.ts), and add the locale to `supportedLngs` in `index.ts`. RTL languages (currently `fa`) set `document.documentElement.dir` automatically.

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
| Unused dependencies | `joi` and `roleAuth` middleware are installed but not wired — do not build on them until integrated |
| Toast libraries | Prefer notistack (`notify*`); migrate remaining `sonner` / custom `useToast` usages when touching those files |
| Legacy `{ error: "English" }` responses | Do not add new ones — use `sendError` / `errorKey`. Some niche routers may still be mid-migration |
| Redux persist whitelist | Store references `auth` reducer that does not exist — do not add auth to Redux |

## What We Don't Have Yet

There are no established conventions for:

- Automated tests (no test runner or test files)
- Code formatting (no Prettier config)
- API documentation (no OpenAPI spec)
- Monorepo tooling (each package has its own `package.json`)

When these are added, update this document.
