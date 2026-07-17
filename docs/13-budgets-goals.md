# 13 — Budgets & Goals (Planning)

This is the **forward-looking** layer. Everything so far recorded what *happened* (movements) or summarized what *is* (dashboard, calendar). Planning adds what you're *aiming for*: **budgets** (monthly spending limits per currency, broken down by category) and **savings goals** (a target amount you're working toward). It also produces the **cash-flow forecast** and the **budget alerts** that feed Notifications.

All of it lives in one place — [`planningService.ts`](../eboom-backend/src/services/planningService.ts) — consumed by two thin route files (`budgets`, `savings-goals`) and one frontend page. You've already seen it referenced: the [Dashboard](./10-dashboard.md) and [Calendar](./11-calendar.md) both call `getSavingsGoalProgress`.

**Prerequisites:** [Expenses](./08-expenses.md) (budgets track expense payments), [Wallets](./06-wallets.md) (goals measure against liquid balances), [Calendar](./11-calendar.md) (the forecast reuses calendar events).

---

## 1. Two planning primitives

| Concept | Tables | Grain | Measures against |
|---------|--------|-------|-----------------|
| **Budget** | `budgets` + `budget_lines` | one per **(canvas, currency)**, monthly | **paid** expense payments this month |
| **Savings goal** | `savings_goals` | one row | **liquid wallet balance** in its currency |

Two design decisions define the whole module:

1. **Budgets are monthly and per-currency.** `periodType` is always `MONTHLY_BUDGET_PERIOD` ("monthly") — there is no weekly/yearly. A canvas has at most **one budget per currency** (enforced by upsert logic, below). A budget has a `totalLimit` and optional per-category `budget_lines`, each with its own `amountLimit`.
2. **Nothing is "saved into" a goal.** A savings goal has no balance of its own. Its progress is simply the canvas's **current liquid balance in that currency** measured against the target. Add money to *any* wallet in that currency and every goal in that currency moves. This keeps goals honest and zero-maintenance — but means goals in the same currency all track the same pool.

---

## 2. Period math & the "spent" definition

Budgets operate on **calendar months** in UTC. `resolvePeriodBounds` returns `{ start, end, periodKey: "month:YYYY-MM" }` for a reference date; `resolvePreviousPeriodBounds` steps back one month (used for suggestions).

"Spent" has a precise meaning — **only expense payments with a `paidDate` inside the period count**, aggregated by the parent expense's category and currency:

```95:127:eboom-backend/src/services/planningService.ts
async function aggregateSpentByCategory(
  canvasId: number,
  currencyId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<Map<number, { spent: number; count: number }>> {
  const rows = await db
    .select({
      categoryId: expenses.expenseCategoryId,
      amount: expensePayments.amount,
    })
    .from(expensePayments)
    .innerJoin(expenses, eq(expensePayments.expenseId, expenses.id))
    .where(
      and(
        eq(expenses.canvasId, canvasId),
        eq(expenses.currencyId, currencyId),
        eq(expenses.isArchived, false),
        isNotNull(expensePayments.paidDate),
        gte(expensePayments.paidDate, periodStart),
        lte(expensePayments.paidDate, periodEnd)
      )
    );
  ...
```

⚠️ **Due-but-unpaid payments don't count as spent** — they're surfaced separately as `unscheduledPaymentCount` (payments with a `dueDate` in-period but no `paidDate`), so the UI can warn "N scheduled payments not yet counted." This is the opposite of the ledger's behavior (recall from [Expenses](./08-expenses.md) that a payment debits the wallet *regardless* of `paidDate`) — the **budget cares about paid, the ledger cares about recorded**. Keep that distinction clear.

---

## 3. Budget progress

`getBudgetProgress(budgetId)` is the core read: it resolves the current month, loads the budget's lines, aggregates spend by category, and computes a `percent`, `remaining`, `isOverThreshold`, and `isOverLimit` for **each line** and for the **total**:

- `computePercent(spent, limit)` — rounded to one decimal; a zero limit reports 100% if anything was spent, else 0%.
- **`isOverThreshold`** — `percent >= alertThresholdPercent` (line-level threshold falls back to the budget's default, which itself defaults to 80). This is what drives alerts.
- **`isOverLimit`** — `spent > limit` (fully exceeded).

`getBudgetSummaryForCanvas` rolls every budget into a per-currency dashboard card (counting categories on-track / over-threshold / over-limit) — this is what [`DashboardBudgetSection`](../eboom-frontend/src/views/dashboard/components/DashboardBudgetSection.tsx) renders.

---

## 4. Budget suggestions

To make budgeting less blank-page, `getBudgetSuggestions(canvasId, currencyId)` looks at **last month's** spend per category and proposes friendly round numbers: each category's suggestion is `roundToFriendly(lastMonthSpent)` (round up to nearest 5 under 100, nearest 10 above), and the suggested total is `roundToFriendly(rawTotal × 1.1)` — last month plus a 10% cushion. Categories are returned sorted by raw spend descending.

---

## 5. Savings goal progress

`getSavingsGoalProgress(goalId)` measures the goal's target against the **canvas's liquid balance** in the goal's currency (`getCanvasLiquidBalance` — the sum of all non-archived wallets' sub-wallet amounts in that currency):

```448:491:eboom-backend/src/services/planningService.ts
export async function getSavingsGoalProgress(goalId: number): Promise<SavingsGoalProgress | null> {
  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.id, goalId));
  if (!goal) return null;

  const [currency] = await db.select().from(currencies).where(eq(currencies.id, goal.currencyId));
  if (!currency) return null;

  const [availableAmount, walletCount] = await Promise.all([
    getCanvasLiquidBalance(goal.canvasId, goal.currencyId),
    getCanvasWalletCountForCurrency(goal.canvasId, goal.currencyId),
  ]);
  const targetAmount = parseAmount(goal.targetAmount);
  const remaining = Math.max(0, targetAmount - availableAmount);
  const percent = computePercent(availableAmount, targetAmount);

  let daysRemaining: number | null = null;
  if (goal.targetDate) {
    const today = startOfDay(new Date());
    const target = startOfDay(new Date(goal.targetDate));
    daysRemaining = Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  return {
    ...
    currentAmount: formatAmount(availableAmount),
    availableBalance: formatAmount(availableAmount),
    walletCount,
    remaining: formatAmount(remaining),
    percent,
    targetDate: goal.targetDate ? String(goal.targetDate) : null,
    daysRemaining,
    alertThresholdPercent: goal.alertThresholdPercent,
    isOverThreshold: targetAmount > 0 && percent >= goal.alertThresholdPercent,
  };
}
```

Note `currentAmount === availableBalance` — both are just the liquid balance; there's no separate "saved" number. A goal also carries a `status` (`active` / `achieved` / `dropped`), a `targetDate` (→ `daysRemaining`, and the calendar event you saw in doc 11), and — reusing the emoji/color `photoUrl` trick from [Canvas](./05-canvas-collaboration.md#the-photourl-trick) — an icon.

For goals, `isOverThreshold` is actually a *good* thing (you're near your target), and it's what raises a celebratory alert.

---

## 6. Cash-flow forecast

`getCashFlowForecast(canvasId, currencyId, startDate, endDate)` projects a running balance forward. It **reuses the [Calendar](./11-calendar.md) engine** (`getCalendarEvents`), filters to the currency, seeds today's liquid balance, and walks day by day adding expected income and subtracting expected expenses — skipping `completed` events (already reflected in the balance) so only future/pending movements move the projection:

```531:564:eboom-backend/src/services/planningService.ts
  for (const event of currencyEvents) {
    const dateKey = toDateKey(new Date(event.date));
    const bucket = dayMap.get(dateKey);
    if (!bucket) continue;

    const amount = parseAmount(event.amount);
    if (event.status === "completed") continue;

    if (event.type === "income") {
      bucket.expectedIn += amount;
    } else if (event.type === "expense") {
      bucket.expectedOut += amount;
    }
  }

  let runningBalance = currentBalance;
  ...
  for (const [date, bucket] of [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    totalExpectedIn += bucket.expectedIn;
    totalExpectedOut += bucket.expectedOut;
    const net = bucket.expectedIn - bucket.expectedOut;
    runningBalance += net;
    points.push({ date, expectedIn: ..., expectedOut: ..., netExpected: ..., projectedBalance: formatAmount(runningBalance) });
  }
```

The result is a per-day series of `expectedIn`, `expectedOut`, `netExpected`, and `projectedBalance` — a "will I run dry before payday?" chart. Because it inherits the calendar's **predicted recurrences**, the forecast automatically includes projected future rent/salary.

---

## 7. Budget alerts

`getBudgetAlertsForUser(userId)` powers proactive notifications. It walks every canvas the user belongs to, and for each **alerts-enabled** monthly budget emits a `budget_total` alert if the total is over threshold plus a `budget_category` alert per over-threshold line; for each **active** savings goal over threshold it emits a `savings_goal` alert. Results are sorted by `percent` descending.

`budgetAlertSourceKey(alert)` builds a **stable dedup key** per alert (embedding the budget/line/goal id, `periodKey`, and threshold) so the Notifications system can raise each alert **once per period per threshold** rather than every poll — the bridge into the next module.

---

## 8. API surface

Both route files are canvas-scoped and permission-gated. Note these use **plain `{ error }` JSON**, not the `errorKey` system — a small inconsistency with the rest of the API.

**Budgets** ([`routes/budgets.ts`](../eboom-backend/src/routes/budgets.ts)):

| Method & path | Perm | Purpose |
|---------------|------|---------|
| `GET /budgets` | view | List budgets with lines + live progress. |
| `POST /budgets` | edit | **Upsert** budget for a currency (see below) + progress. |
| `GET /budgets/:id` / `/:id/progress` | view | Detail / progress only. |
| `PATCH /budgets/:id` | edit | Update limits/lines. |
| `DELETE /budgets/:id` | edit | Hard delete. |
| `GET /budgets/summary` | view | Per-currency dashboard cards. |
| `GET /budgets/suggestions?currencyId=` | view | Last-month-based suggestions. |
| `GET /budgets/forecast?currencyId=&startDate=&endDate=` | view | Cash-flow forecast. |
| `GET /budgets/currency-usage` | view | Currencies used by expenses/wallets (for the picker). |

**Savings goals** ([`routes/savings-goals.ts`](../eboom-backend/src/routes/savings-goals.ts)): `GET /` (list + progress), `POST /` (create), `GET /:id/progress`, `PATCH /:id` (edit / change status), `DELETE /:id` (soft: sets `status: "dropped"`, `isArchived: true`).

### The budget upsert

`POST /budgets` is not a plain create — `upsertBudgetWithLines` looks for an existing `(canvas, currency, monthly)` budget and **updates it in place if found, else inserts**, then **replaces all lines** (delete-then-insert). This enforces "one budget per currency per canvas" and makes the create form idempotent. `PATCH` does the same line-replacement when `lines` are provided.

---

## 9. Frontend

[`BudgetPlanningPage`](../eboom-frontend/src/views/budget-planning/BudgetPlanningPage.tsx) is a two-section page (Budgets + Goals) driven by a **currency selector** — since budgets are per-currency, picking a currency shows that currency's budget. It fetches budgets (`["budgets", canvas]`) and goals (`["savings-goals", canvas]`), auto-selects the first budget's (or first available) currency, and renders:

- **Budget card** — total `BudgetProgressBar` (colored by threshold), spent/left/limit stats, the `unscheduledPaymentCount` hint, and per-category line bars. Edit/delete via a dropdown.
- **Goals** — status-tabbed (`active`/`achieved`/`dropped`) grid of `GoalCard`s, each showing progress and a status-change control. Changing a goal's status invalidates both `["savings-goals"]` and `["calendar"]` (goals appear on the calendar).
- **Modals** — `BudgetFormModal` (with suggestions) and `GoalFormModal`, both reused by the Calendar and Whiteboard.

Everything is `canEdit`-gated. `GoalFormModal` is the same component the Calendar and Dashboard open, keeping goal creation consistent everywhere.

---

## 10. Gotchas & conventions

- **Budgets are monthly-only and one-per-currency** — enforced by `upsertBudgetWithLines`; `POST` is an upsert, not a plain insert.
- **"Spent" = paid payments only** (`paidDate` in period). Due-but-unpaid are counted separately as `unscheduledPaymentCount`. This differs from the ledger, which debits regardless of paid date.
- **Goals have no balance** — progress = current liquid balance in the currency; goals sharing a currency track the same pool.
- **`isOverThreshold` means "alert"** — bad for budgets (overspending), good for goals (near target).
- **The forecast reuses calendar events** (including predicted recurrences) and skips `completed` ones.
- **`budgetAlertSourceKey` dedups alerts** per (entity, period, threshold) — critical for the Notifications module.
- **These routes return `{ error }`, not `errorKey`s** — inconsistent with the rest of the API.
- **Goal delete is soft** (`dropped` + archived); **budget delete is hard**.
- **Line edits are delete-then-reinsert**, so `lineId`s are not stable across saves.

---

Next: **Notifications** — where budget alerts, overdue payments, canvas invitations, and other events converge into the bell icon, using dedup keys like `budgetAlertSourceKey` to avoid nagging.
