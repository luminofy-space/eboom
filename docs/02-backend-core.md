# 02 — Backend Core

The backend is a plain Express + TypeScript app. There is deliberately **no controller/service-per-entity scaffolding** — route handlers are written inline, and shared logic is pulled into a small set of services. This doc walks the plumbing that every feature route depends on: bootstrap, routing, middleware, the error system, the database layer, and services.

Source root: [`eboom-backend/src/`](../eboom-backend/src/)

```
src/
├── app.ts              # Express bootstrap (entry point)
├── routes/             # All HTTP handlers (inline, no controller layer)
│   └── index.ts        # The router tree — everything mounts here
├── middleware/         # auth, canvasAccess, errorHandler, rateLimiter
├── services/           # Shared logic (jwt, email, ledger, canvasAccess, ...)
├── errors/             # Error-key catalog, AppError, sendError helpers
├── db/                 # client, schema, migrations, seeds
├── jobs/               # Scheduled background jobs (email digests)
├── types/              # Ambient types (Express request augmentation, etc.)
└── utils/              # asyncHandler, valuation helpers
```

---

## 1. Bootstrap — `app.ts`

[`src/app.ts`](../eboom-backend/src/app.ts) is the whole server setup, and it's short. The order of `app.use(...)` calls is the middleware pipeline:

```1:31:eboom-backend/src/app.ts
import "dotenv/config";
import './types/express';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';


const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: "10mb" }));


import apiRouter from './routes';
import { startNotificationEmailJob } from './jobs/notificationEmailJob';
import { errorHandler } from './middleware/errorHandler';
app.use('/api', apiRouter);


app.get('/', (req, res) => res.json({ ok: true, service: 'pfm-backend' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);
```

What to notice:

1. **`import './types/express'`** is loaded for its side effect — it augments Express's `Request` type with `appUser`, `canvasId`, and `canvasMembership` (see §4).
2. **Global hardening**: `helmet` (security headers), `cors` (currently open — no allowlist), `morgan('dev')` (request logging), and a 10 MB JSON body limit.
3. **Everything mounts under `/api`** via a single router (§2).
4. **`/` and `/health`** are unauthenticated liveness endpoints. `/health` returns `{ status: 'ok' }`.
5. **`errorHandler` is registered last**, so it catches anything the routes forward to it (§4).
6. On `listen`, the server starts the **notification email job** and logs a loud warning if `TEST_USER_ID` (auth bypass) is set.
7. `module.exports = app;` — CommonJS export at the bottom.

> Note: the `SKIP_EMAIL_VERIFICATION` startup log block is gated by `false && ...`, so it never fires — but the flag itself is still honored inside the auth routes. See [Authentication](./04-authentication.md).

---

## 2. Routing tree — `routes/index.ts`

There is one router that mounts every feature sub-router. Reading [`routes/index.ts`](../eboom-backend/src/routes/index.ts) top-to-bottom tells you the entire API surface and, crucially, **which routes require auth**.

```29:68:eboom-backend/src/routes/index.ts
// Auth routes (no authentication required)
router.use('/auth', authRoutes);

// Canvas-scoped entity routes
router.use('/canvases/:canvasId/members', auth, canvasMembersRouter);
router.use('/canvases/:canvasId/whiteboard', auth, whiteboardRouter);
router.use('/canvases/:canvasId/budgets', auth, budgetsRouter);
router.use('/canvases/:canvasId/savings-goals', auth, savingsGoalsRouter);
router.use('/canvases/:canvasId/ai-insight-profile', auth, aiInsightProfilesRouter);
router.use('/canvases/:canvasId/ai-insights', auth, aiInsightsRouter);
router.use('/canvases/:canvasId/ai-chat', auth, aiChatRouter);
router.use('/canvases/:canvasId/expenses', auth, expenses);
router.use('/canvases/:canvasId/incomes', auth, income);
router.use('/canvases/:canvasId/wallets', auth, wallets);
router.use('/canvases/:canvasId/assets', auth, assets);
router.use('/canvases/:canvasId/transfers', auth, transfersRouter);
router.use('/canvases', auth, canvas);
```

The pattern is consistent and worth internalizing:

- **`/auth`** is the only public group (login, signup, refresh, verify, reset).
- **Everything else is mounted with `auth` as the first middleware**, so no unauthenticated request reaches those handlers.
- **Canvas-scoped resources** live under `/canvases/:canvasId/<resource>`. Because sub-routers are mounted with `express.Router({ mergeParams: true })`-style nesting, the `:canvasId` param is available inside each sub-router, where handlers call `requireCanvasAccess(...)` (§3).
- **Non-canvas-scoped** groups: `/currency`, `/income/categories`, `/wallet/categories`, `/expense/categories`, `/asset/categories`, `/calendar`, `/notifications`, `/canvas-invitations`, `/roles/canvas`.

> The frontend keeps a mirror of every path in [`eboom-frontend/src/api/urls.ts`](../eboom-frontend/src/api/urls.ts). If you add a route here, add its constant there too.

### Route param parsing

Route IDs arrive as strings. [`routes/routeParams.ts`](../eboom-backend/src/routes/routeParams.ts) provides `parseRouteParam(...)` to turn them into numbers safely, and handlers return `errors.common.invalidId` when parsing yields `NaN`. List endpoints share pagination/filter parsing in [`routes/listQueryParams.ts`](../eboom-backend/src/routes/listQueryParams.ts).

---

## 3. Middleware

Three middleware do the heavy lifting for security and correctness.

### `auth` — [`middleware/auth.ts`](../eboom-backend/src/middleware/auth.ts)

Runs on every protected group. Its job: prove who the caller is and attach the full user row to `req.appUser`.

Flow:

1. **Dev bypass check.** If `TEST_USER_ID` is set, it loads that user and calls `next()` immediately — no token required. (Never enable in production.)
2. Read the `Authorization` header; missing → `errors.common.missingAuthHeader` (401).
3. Strip the `Bearer ` prefix and `verifyAccessToken(token)` (via `jwtService`).
4. Load the user by `payload.sub`; if the token is invalid or the user is gone → `errors.common.invalidToken` (401).
5. `req.appUser = appUser; next();`

```37:54:eboom-backend/src/middleware/auth.ts
  const token = auth.replace(/^Bearer\s+/i, "");
  try {
    const payload = verifyAccessToken(token);
    const [appUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub));

    if (!appUser) {
      return sendError(res, ErrorKeys.common.invalidToken, 401);
    }

    req.appUser = appUser;
    next();
  } catch (err) {
    console.error("auth error", err);
    return sendError(res, ErrorKeys.common.invalidToken, 401);
  }
```

### `requireCanvasAccess(permission)` — [`middleware/canvasAccess.ts`](../eboom-backend/src/middleware/canvasAccess.ts)

This is the **authorization** layer (auth answers "who are you", this answers "are you allowed here"). It's a middleware **factory** — you call it with the permission a handler needs:

```11:33:eboom-backend/src/middleware/canvasAccess.ts
export function requireCanvasAccess(permission: CanvasPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.appUser) {
      return sendError(res, ErrorKeys.common.unauthorized, 401);
    }

    const canvasId = parseRouteParam(req.params.canvasId);
    if (Number.isNaN(canvasId)) {
      return sendError(res, ErrorKeys.common.invalidId, 400);
    }

    const membership = await getCanvasMembership(canvasId, req.appUser.id);
    if (!membership) {
      return sendError(res, ErrorKeys.canvas.accessDenied, 403);
    }
    if (!membershipHasPermission(membership, permission)) {
      return sendError(res, ErrorKeys.member.insufficientPermissions, 403);
    }

    req.canvasId = canvasId;
    req.canvasMembership = membership;
    next();
  };
}
```

Usage inside a handler is uniform across the codebase:

```typescript
router.get("/summary", requireCanvasAccess("view"), async (req, res) => {
  const canvasId = req.canvasId!;          // guaranteed set by the middleware
  const membership = req.canvasMembership!; // role + computed permissions
  // ...
});
```

The permission model (`view`, `edit`, `manage_members`, `manage_canvas`) is computed in [`services/canvasAccessService.ts`](../eboom-backend/src/services/canvasAccessService.ts):

- Membership is resolved by joining `canvas_members` → `roles` for a `(canvasId, userId)` pair.
- **Owners get all permissions** unconditionally (`isOwner` short-circuits to `true` for every permission).
- Non-owners get permissions from their role's `permissions` JSON column. Seeded roles are **Collaborator**, **Modifier**, **Visitor**.

```42:61:eboom-backend/src/services/canvasAccessService.ts
export function computePermissions(
  isOwner: boolean,
  rolePermissions: RolePermissions
): CanvasPermissions {
  if (isOwner) {
    return {
      view: true,
      edit: true,
      manage_members: true,
      manage_canvas: true,
    };
  }

  return {
    view: !!rolePermissions.view,
    edit: !!rolePermissions.edit,
    manage_members: !!rolePermissions.manage_members,
    manage_canvas: !!rolePermissions.manage_canvas,
  };
}
```

> There is also a `middleware/roleAuth.ts`, but it is a **stub and not wired in**. Ignore it; use `requireCanvasAccess`.

### `authRateLimiter` etc. — [`middleware/rateLimiter.ts`](../eboom-backend/src/middleware/rateLimiter.ts)

Three `express-rate-limit` instances protect the auth surface: `authRateLimiter` (login/signup/refresh, 40 / 15 min), `passwordResetRateLimiter`, and `emailVerificationRateLimiter` (both 40 / hour). Applied per-route in [`routes/auth.ts`](../eboom-backend/src/routes/auth.ts).

---

## 4. Error handling

This is one of the most important backend conventions. **The API never returns English error strings.** It returns a stable **`errorKey`** — a dotted path that maps to the frontend's i18n `errors` namespace — so every failure can be translated into any supported language.

### The pieces

| File | Responsibility |
|------|----------------|
| [`errors/errorKeys.ts`](../eboom-backend/src/errors/errorKeys.ts) | The canonical catalog of every error key, grouped by domain (`common`, `validation`, `auth`, `canvas`, `expense`, ...). |
| [`errors/sendError.ts`](../eboom-backend/src/errors/sendError.ts) | `sendError` / `sendFieldErrors` / `sendAppError` — write the JSON error body. |
| [`errors/AppError.ts`](../eboom-backend/src/errors/AppError.ts) | A throwable typed error carrying `errorKey`, `status`, `params`, and optional `fieldErrors`. |
| [`middleware/errorHandler.ts`](../eboom-backend/src/middleware/errorHandler.ts) | Terminal handler: turns `AppError` (and unknown throws) into the unified JSON body. |
| [`utils/asyncHandler.ts`](../eboom-backend/src/utils/asyncHandler.ts) | Wraps async handlers so rejected promises reach `errorHandler`. |

### The response contract

A plain error:

```json
{ "errorKey": "errors.expense.notFound", "params": { "id": 12 } }
```

Field-level validation errors (values are also keys):

```json
{
  "errorKey": "errors.validation.failed",
  "errors": { "amount": "errors.validation.amountPositive" }
}
```

`sendError` builds this shape and only includes `params` when non-empty:

```11:22:eboom-backend/src/errors/sendError.ts
export function sendError(
  res: Response,
  errorKey: ErrorKey,
  status: number,
  params?: Record<string, string | number>
): Response {
  const body: ApiErrorBody = { errorKey };
  if (params && Object.keys(params).length > 0) {
    body.params = params;
  }
  return res.status(status).json(body);
}
```

### Two ways to raise an error

1. **Early return with `sendError`** — most common inside inline handlers:

```typescript
if (!existing) {
  return sendError(res, ErrorKeys.expense.notFound, 404);
}
```

2. **Throw an `AppError`** — cleaner when the whole handler is wrapped in `asyncHandler`, letting `errorHandler` produce the response:

```16:22:eboom-backend/src/middleware/errorHandler.ts
  if (err instanceof AppError) {
    sendAppError(res, err);
    return;
  }

  console.error("Unhandled error:", err);
  sendError(res, ErrorKeys.common.internal, 500);
```

Anything not an `AppError` becomes a generic `errors.common.internal` (500) so raw stack traces never leak to clients.

> When adding routes: **never** write `res.json({ error: "English text" })`. Always use a key from `ErrorKeys` (add one if missing). The frontend's `useMutationApi`/`notify` layer relies on this to show translated snackbars — see [Frontend Core §Errors](./03-frontend-core.md#5-errors-and-notifications).

---

## 5. Data layer

### Connection — [`db/client.ts`](../eboom-backend/src/db/client.ts)

A single pooled `postgres-js` connection wrapped by Drizzle. This `db` object is imported everywhere data is read or written.

```12:19:eboom-backend/src/db/client.ts
export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(sql, { schema });
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

- Pool capped at 10 connections.
- `DATABASE_URL` is required — the module throws on import if it's missing.
- `DbTransaction` is the type you use when passing a transaction handle into a service (`db.transaction(async (tx) => ...)`).

### Schema — [`db/schema/schema.ts`](../eboom-backend/src/db/schema/schema.ts)

Every table is a Drizzle `pgTable` in this single file. Conventions you'll see throughout:

- **Property names are `camelCase`, SQL column names are `snake_case`**: `firstName: varchar("first_name", ...)`.
- **Postgres enums** are defined at the top (`transactionStatusEnum`, `recurrenceFrequencyEnum`, `canvasInvitationStatusEnum`, `budgetPeriodTypeEnum`, `savingsGoalStatusEnum`, ...).
- **Money is `numeric(20, 8)`** — high precision for multi-currency and crypto. Balances live in `sub_wallets.amount`.
- **Audit columns** are near-ubiquitous: `createdAt`, `createdBy`, `lastModifiedAt`, `lastModifiedBy`.
- **Integrity is enforced in the DB**, not just app code: `unique()` constraints (e.g. one membership per `(canvasId, userId)`, one `sub_wallet` per `(walletId, currencyId)`) and `check()` constraints (e.g. amounts `>= 0`).

The two anchor tables:

```60:91:eboom-backend/src/db/schema/schema.ts
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    photoUrl: text("photo_url"),
    age: integer("age").$type<number | null>(),
    phone: varchar("phone", { length: 50 }),
    emailVerified: boolean("email_verified").default(false),
    passwordHash: varchar("password_hash", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: integer("created_by").references((): AnyPgColumn => users.id),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }).defaultNow(),
    lastModifiedBy: integer("last_modified_by").references((): AnyPgColumn => users.id),
  },
  (table) => [check("age_check", sql`${table.age} > 0`)]
);
```

### Inferred types — [`db/schema/models.ts`](../eboom-backend/src/db/schema/models.ts)

For each table, Drizzle infers a **select** type and an **insert** type:

```typescript
export type User = typeof users.$inferSelect;      // shape of a row you read
export type NewUser = typeof users.$inferInsert;   // shape you insert
```

These are re-exported from [`db/schema/index.ts`](../eboom-backend/src/db/schema/index.ts) and are **the same types the frontend imports** through the `@backend/db/schema` path alias. Change a column here and both sides update.

### Migrations & seeds

| Command | What it does |
|---------|--------------|
| `npm run db:migrate` | Apply SQL migrations from `db/migrations/`. |
| `npm run db:push` / `db:generate` | `drizzle-kit push` — sync schema directly (used by Docker startup). |
| `npm run db:studio` | Open Drizzle Studio. |
| `npm run db:seed` (+ `:safe`, `:hybrid`, `:specific`) | Seed demo data from `db/seed/`. |
| `npm run db:reset` | Reset the database. |

Migrations live in [`db/migrations/`](../eboom-backend/src/db/migrations/); seeds (including raw SQL for currencies/roles) in [`db/seed/`](../eboom-backend/src/db/seed/). `schema_old.ts` is legacy — do not touch it.

---

## 6. Services

Services hold logic that is shared across routes or too involved to inline. They are plain modules exporting functions (no classes, no DI container). The core ones:

| Service | Purpose |
|---------|---------|
| [`jwtService.ts`](../eboom-backend/src/services/jwtService.ts) | Password hashing (bcrypt) + JWT sign/verify. Covered in [Authentication](./04-authentication.md). |
| [`canvasAccessService.ts`](../eboom-backend/src/services/canvasAccessService.ts) | Membership + permission resolution (backs `requireCanvasAccess`). |
| [`ledgerService.ts`](../eboom-backend/src/services/ledgerService.ts) | **The only place `sub_wallets` balances change.** `creditWalletBalance` / `debitWalletBalance`. |
| [`transferService.ts`](../eboom-backend/src/services/transferService.ts) | Atomic wallet-to-wallet transfers (debit + credit). |
| [`emailService.ts`](../eboom-backend/src/services/emailService.ts) | Nodemailer transport + typed senders (verification, reset, digests). |
| [`dashboardService.ts`](../eboom-backend/src/services/dashboardService.ts) | Aggregations for the canvas summary. |
| [`calendarService.ts`](../eboom-backend/src/services/calendarService.ts) | Expands movements + recurrence into calendar events. |
| [`whiteboardService.ts`](../eboom-backend/src/services/whiteboardService.ts) | Whiteboard node/viewport persistence. |
| [`notificationService.ts`](../eboom-backend/src/services/notificationService.ts) | Overdue detection, feeds the email job. |
| `ai*Service.ts` / `llmClient.ts` | AI Insights + chat (feature module). |

The **money-movement invariant** is the single most important service rule: route handlers must **never** update `sub_wallets` directly — all balance changes go through `ledgerService` (and `transferService` for transfers). The precise contract, with worked examples, is in [Overview → Transaction Logic](./00-overview.md#transaction-logic).

---

## 7. Background jobs

[`jobs/notificationEmailJob.ts`](../eboom-backend/src/jobs/notificationEmailJob.ts) is started from `app.ts` on boot. On an interval (`NOTIFICATION_EMAIL_INTERVAL_MS`, default 1h; toggle with `NOTIFICATION_EMAIL_ENABLED`) it scans for overdue expense payments / unreceived income across all canvases a user belongs to and sends digest emails via `emailService`. This is the Notifications module's backend engine (documented fully in its own module doc later).

---

## 8. Conventions cheat-sheet for adding a backend route

1. Add/adjust tables in [`schema.ts`](../eboom-backend/src/db/schema/schema.ts); run `npm run db:migrate`.
2. Create the router in `src/routes/<name>.ts`. Wrap async handlers or use `try/catch`.
3. Guard with `auth` (in `routes/index.ts`) and `requireCanvasAccess(permission)` (in the handler) for canvas data.
4. Return data as-is (snake_case JSON) on success; use `sendError(res, ErrorKeys.<...>, status)` on failure — **no English strings**.
5. Mutate balances only through `ledgerService`.
6. Register the router in [`routes/index.ts`](../eboom-backend/src/routes/index.ts).
7. Mirror the path in the frontend's [`urls.ts`](../eboom-frontend/src/api/urls.ts).

---

Next: **[03 — Frontend Core](./03-frontend-core.md)**.
