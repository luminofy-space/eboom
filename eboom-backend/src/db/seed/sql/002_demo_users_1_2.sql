-- Demo seed for users 1 and 2
-- Prerequisites:
--   1. Users with id 1 and 2 must exist
--   2. Run 001_initialize.sql first (roles, currencies, categories)
--
-- Run: psql $DATABASE_URL -f src/db/seed/sql/002_demo_users_1_2.sql
--   or: npm run db:seed:specific demo_users_1_2  (via seed-hybrid / direct psql)
--
-- Covers: personal & shared canvases, collaboration, wallets (multi-currency),
-- incomes/expenses (all statuses, recurring patterns), transfers, assets,
-- budgets, savings goals, wishlists, AI insights, whiteboard, notifications.
-- Includes 3 months of historical income entries, expense payments, and transfers.

BEGIN;

-- ---------------------------------------------------------------------------
-- Lookup helpers (stable references from 001_initialize.sql)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _lk AS
SELECT
  (SELECT id FROM roles WHERE name = 'Collaborator' ORDER BY id LIMIT 1)              AS role_collaborator,
  (SELECT id FROM roles WHERE name = 'Modifier' ORDER BY id LIMIT 1)                  AS role_modifier,
  (SELECT id FROM roles WHERE name = 'Visitor' ORDER BY id LIMIT 1)                     AS role_visitor,
  (SELECT id FROM currencies WHERE code = 'USD' ORDER BY id LIMIT 1)                  AS cur_usd,
  (SELECT id FROM currencies WHERE code = 'EUR' ORDER BY id LIMIT 1)                    AS cur_eur,
  (SELECT id FROM currencies WHERE code = 'GBP' ORDER BY id LIMIT 1)                    AS cur_gbp,
  (SELECT id FROM currencies WHERE code = 'BTC' ORDER BY id LIMIT 1)                    AS cur_btc,
  (SELECT id FROM wallet_categories WHERE name = 'Checking Account' ORDER BY id LIMIT 1) AS wc_checking,
  (SELECT id FROM wallet_categories WHERE name = 'Savings Account' ORDER BY id LIMIT 1) AS wc_savings,
  (SELECT id FROM wallet_categories WHERE name = 'Credit Card' ORDER BY id LIMIT 1)     AS wc_credit,
  (SELECT id FROM wallet_categories WHERE name = 'Crypto Wallet' ORDER BY id LIMIT 1) AS wc_crypto,
  (SELECT id FROM income_categories WHERE name = 'Salary' ORDER BY id LIMIT 1)          AS ic_salary,
  (SELECT id FROM income_categories WHERE name = 'Freelance' ORDER BY id LIMIT 1)       AS ic_freelance,
  (SELECT id FROM income_categories WHERE name = 'Bonuses' ORDER BY id LIMIT 1)         AS ic_bonus,
  (SELECT id FROM income_categories WHERE name = 'Investment Returns' ORDER BY id LIMIT 1) AS ic_investment,
  (SELECT id FROM expense_categories WHERE name = 'Housing' ORDER BY id LIMIT 1)        AS ec_housing,
  (SELECT id FROM expense_categories WHERE name = 'Utilities' ORDER BY id LIMIT 1)      AS ec_utilities,
  (SELECT id FROM expense_categories WHERE name = 'Groceries' ORDER BY id LIMIT 1)      AS ec_groceries,
  (SELECT id FROM expense_categories WHERE name = 'Subscriptions' ORDER BY id LIMIT 1)  AS ec_subscriptions,
  (SELECT id FROM expense_categories WHERE name = 'Insurance' ORDER BY id LIMIT 1)      AS ec_insurance,
  (SELECT id FROM expense_categories WHERE name = 'Travel' ORDER BY id LIMIT 1)         AS ec_travel,
  (SELECT id FROM expense_categories WHERE name = 'Shopping & Clothing' ORDER BY id LIMIT 1) AS ec_shopping,
  (SELECT id FROM asset_categories WHERE name = 'Vehicle' ORDER BY id LIMIT 1)          AS ac_vehicle,
  (SELECT id FROM asset_categories WHERE name = 'Real Estate' ORDER BY id LIMIT 1)      AS ac_real_estate,
  (SELECT id FROM asset_categories WHERE name = 'Equipment' ORDER BY id LIMIT 1)        AS ac_equipment;

CREATE TEMP TABLE _demo (entity TEXT PRIMARY KEY, id INT);

-- ---------------------------------------------------------------------------
-- User settings
-- ---------------------------------------------------------------------------
INSERT INTO user_settings (user_id, timezone, language, date_format, default_currency_id, notification_enabled)
SELECT 1, 'America/New_York', 'en', 'YYYY-MM-DD', cur_usd, true FROM _lk
ON CONFLICT (user_id) DO UPDATE SET
  timezone = EXCLUDED.timezone,
  default_currency_id = EXCLUDED.default_currency_id,
  last_modified_at = NOW();

INSERT INTO user_settings (user_id, timezone, language, date_format, default_currency_id, notification_enabled)
SELECT 2, 'Europe/London', 'en', 'DD/MM/YYYY', cur_gbp, true FROM _lk
ON CONFLICT (user_id) DO UPDATE SET
  timezone = EXCLUDED.timezone,
  default_currency_id = EXCLUDED.default_currency_id,
  last_modified_at = NOW();

-- ---------------------------------------------------------------------------
-- Canvases
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, created_by, last_modified_by)
  VALUES (
    'Personal Finance',
    'Primary household finances — income, expenses, budgets, and savings goals.',
    'personal',
    false,
    1,
    1
  )
  RETURNING id
)
INSERT INTO _demo SELECT 'canvas_personal', id FROM ins;

WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, created_by, last_modified_by)
  VALUES (
    'Shared Household',
    'Joint budget for rent, utilities, and shared savings — Alex & Jordan.',
    'household',
    false,
    1,
    1
  )
  RETURNING id
)
INSERT INTO _demo SELECT 'canvas_household', id FROM ins;

WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, created_by, last_modified_by)
  VALUES (
    'Consulting Practice',
    'Freelance consulting revenue and business expenses.',
    'business',
    false,
    2,
    2
  )
  RETURNING id
)
INSERT INTO _demo SELECT 'canvas_consulting', id FROM ins;

WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, created_by, last_modified_by)
  VALUES (
    'Legacy Portfolio',
    'Archived canvas from a previous financial plan.',
    'personal',
    true,
    1,
    1
  )
  RETURNING id
)
INSERT INTO _demo SELECT 'canvas_archived', id FROM ins;

-- ---------------------------------------------------------------------------
-- Canvas members
-- ---------------------------------------------------------------------------
INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 1, l.role_collaborator, true
FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';

INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 1, l.role_collaborator, true
FROM _demo d, _lk l WHERE d.entity = 'canvas_household';

INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 2, l.role_modifier, false
FROM _demo d, _lk l WHERE d.entity = 'canvas_household';

INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 2, l.role_collaborator, true
FROM _demo d, _lk l WHERE d.entity = 'canvas_consulting';

-- ---------------------------------------------------------------------------
-- Canvas invitations (all statuses — one invitee per canvas due to unique constraint)
-- ---------------------------------------------------------------------------
INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 2, 'jordan.lee@example.com', l.role_modifier, 1, 'pending',
       NOW() + INTERVAL '7 days', NULL
FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';

INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 2, 'jordan.lee@example.com', l.role_collaborator, 1, 'accepted',
       NOW() + INTERVAL '7 days', NOW() - INTERVAL '30 days'
FROM _demo d, _lk l WHERE d.entity = 'canvas_household';

INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 2, 'jordan.lee@example.com', l.role_visitor, 1, 'declined',
       NOW() + INTERVAL '7 days', NOW() - INTERVAL '60 days'
FROM _demo d, _lk l WHERE d.entity = 'canvas_archived';

INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 1, 'alex.morgan@example.com', l.role_visitor, 2, 'cancelled',
       NOW() + INTERVAL '7 days', NULL
FROM _demo d, _lk l WHERE d.entity = 'canvas_consulting';

INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 1, 'alex.morgan@example.com', l.role_modifier, 2, 'expired',
       NOW() - INTERVAL '1 day', NULL
FROM _demo d, _lk l WHERE d.entity = 'canvas_archived';

-- ---------------------------------------------------------------------------
-- Wallets — Personal Finance canvas
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Primary Checking', l.wc_checking,
         '{"summary": "Day-to-day operating account"}'::jsonb,
         false, 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'wallet_checking', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'High-Yield Savings', l.wc_savings,
         '{"summary": "Emergency fund and short-term goals"}'::jsonb,
         false, 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'wallet_savings', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Rewards Credit Card', l.wc_credit,
         '{"summary": "Monthly expenses paid on card, settled from checking"}'::jsonb,
         false, 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'wallet_credit', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Digital Assets', l.wc_crypto,
         '{"summary": "Long-term crypto holdings"}'::jsonb,
         false, 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'wallet_crypto', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Petty Cash', l.wc_checking,
         '{"summary": "Closed petty cash envelope"}'::jsonb,
         true, 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'wallet_archived', id FROM ins;

-- Wallets — Shared Household
WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Joint Checking', l.wc_checking,
         '{"summary": "Shared rent and bill payments"}'::jsonb,
         false, 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_household'
  RETURNING id
)
INSERT INTO _demo SELECT 'wallet_joint', id FROM ins;

-- Wallets — Consulting
WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Business Checking', l.wc_checking,
         '{"summary": "Client payments and business expenses"}'::jsonb,
         false, 2, 2
  FROM _demo d, _lk l WHERE d.entity = 'canvas_consulting'
  RETURNING id
)
INSERT INTO _demo SELECT 'wallet_business', id FROM ins;

-- ---------------------------------------------------------------------------
-- Sub-wallets (balances drive savings-goal progress)
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 4850.00 FROM _demo w, _lk l WHERE w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'sw_checking_usd', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_eur, 1200.00 FROM _demo w, _lk l WHERE w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'sw_checking_eur', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 11200.00 FROM _demo w, _lk l WHERE w.entity = 'wallet_savings'
  RETURNING id
)
INSERT INTO _demo SELECT 'sw_savings_usd', id FROM ins;

INSERT INTO sub_wallets (wallet_id, currency_id, amount)
SELECT w.id, l.cur_usd, 850.00 FROM _demo w, _lk l WHERE w.entity = 'wallet_credit';

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_btc, 0.04500000 FROM _demo w, _lk l WHERE w.entity = 'wallet_crypto'
  RETURNING id
)
INSERT INTO _demo SELECT 'sw_crypto_btc', id FROM ins;

INSERT INTO sub_wallets (wallet_id, currency_id, amount)
SELECT w.id, l.cur_usd, 3200.00 FROM _demo w, _lk l WHERE w.entity = 'wallet_joint';

INSERT INTO sub_wallets (wallet_id, currency_id, amount)
SELECT w.id, l.cur_usd, 6750.00 FROM _demo w, _lk l WHERE w.entity = 'wallet_business';

-- ---------------------------------------------------------------------------
-- Incomes — Personal Finance
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO incomes (
    canvas_id, name, currency_id, wallet_id, amount, income_category_id,
    is_recurring, recurrence_pattern, status, description, created_by, last_modified_by
  )
  SELECT
    d.id, 'Acme Corp Salary', l.cur_usd, w.id, 8500, l.ic_salary,
    true,
    jsonb_build_object(
      'frequency', 'monthly',
      'interval', 1,
      'dayOfMonth', 1,
      'startDate', (CURRENT_DATE - INTERVAL '12 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '24 months')::text
    ),
    'completed',
    '{"employer": "Acme Corporation", "notes": "Direct deposit on the 1st"}'::jsonb,
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'income_salary', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (
    canvas_id, name, currency_id, wallet_id, amount, income_category_id,
    is_recurring, recurrence_pattern, status, description, created_by, last_modified_by
  )
  SELECT
    d.id, 'Design Consulting', l.cur_usd, w.id, 2200, l.ic_freelance,
    true,
    jsonb_build_object(
      'frequency', 'weekly',
      'interval', 1,
      'daysOfWeek', jsonb_build_array(5),
      'startDate', (CURRENT_DATE - INTERVAL '3 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '12 months')::text
    ),
    'pending',
    '{"client": "Northwind Studio", "notes": "Weekly retainer, Fridays"}'::jsonb,
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'income_freelance', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (
    canvas_id, name, currency_id, wallet_id, amount, income_category_id,
    is_recurring, recurrence_pattern, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Annual Performance Bonus', l.cur_usd, w.id, 5000, l.ic_bonus,
    true,
    jsonb_build_object(
      'frequency', 'yearly',
      'interval', 1,
      'startDate', (DATE_TRUNC('year', CURRENT_DATE))::date::text,
      'endDate', (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '5 years')::date::text
    ),
    'pending',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_savings'
  RETURNING id
)
INSERT INTO _demo SELECT 'income_bonus', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (
    canvas_id, name, currency_id, wallet_id, amount, income_category_id,
    is_recurring, status, description, created_by, last_modified_by
  )
  SELECT
    d.id, 'Client Project — Meridian', l.cur_usd, w.id, 3500, l.ic_freelance,
    false, 'pending',
    '{"invoice": "INV-2026-041", "notes": "Awaiting client approval"}'::jsonb,
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'income_onetime_pending', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (
    canvas_id, name, currency_id, wallet_id, amount, income_category_id,
    is_recurring, status, is_archived, created_by, last_modified_by
  )
  SELECT
    d.id, 'Cancelled Speaking Gig', l.cur_usd, w.id, 800, l.ic_freelance,
    false, 'cancelled', false,
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'income_cancelled', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (
    canvas_id, name, currency_id, wallet_id, amount, income_category_id,
    is_recurring, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Dividend Payout — Index Fund', l.cur_usd, w.id, 145, l.ic_investment,
    false, 'failed',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_savings'
  RETURNING id
)
INSERT INTO _demo SELECT 'income_failed', id FROM ins;

-- Income — Consulting canvas
WITH ins AS (
  INSERT INTO incomes (
    canvas_id, name, currency_id, wallet_id, amount, income_category_id,
    is_recurring, recurrence_pattern, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Retainer — Apex Legal', l.cur_usd, w.id, 4000, l.ic_freelance,
    true,
    jsonb_build_object(
      'frequency', 'monthly',
      'interval', 1,
      'dayOfMonth', 15,
      'startDate', (CURRENT_DATE - INTERVAL '6 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '18 months')::text
    ),
    'completed',
    2, 2
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_consulting' AND w.entity = 'wallet_business'
  RETURNING id
)
INSERT INTO _demo SELECT 'income_retainer', id FROM ins;

-- ---------------------------------------------------------------------------
-- Income entries — last 3 months + scenario-specific rows
-- ---------------------------------------------------------------------------

-- Salary: 1st of each month (3 months including current)
INSERT INTO income_entries (income_id, destination_wallet_id, amount, expected_date, received_date, notes, created_by, last_modified_by)
SELECT i.id, w.id, 8500.00,
       (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval)::timestamptz,
       (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval)::timestamptz,
       'Salary — ' || TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval, 'Mon YYYY'),
       1, 1
FROM _demo i, _demo w, generate_series(0, 2) AS n
WHERE i.entity = 'income_salary' AND w.entity = 'wallet_checking';

-- Freelance consulting: every Friday for the last 3 months
INSERT INTO income_entries (income_id, destination_wallet_id, amount, expected_date, received_date, notes, created_by, last_modified_by)
SELECT i.id, w.id, 2200.00,
       friday::timestamptz,
       friday::timestamptz,
       'Consulting retainer — week of ' || TO_CHAR(friday, 'Mon DD'),
       1, 1
FROM _demo i, _demo w,
LATERAL (
  SELECT gs::date AS friday
  FROM generate_series(
    (CURRENT_DATE - INTERVAL '3 months')::date,
    CURRENT_DATE,
    INTERVAL '1 day'
  ) gs
  WHERE EXTRACT(DOW FROM gs) = 5
) weeks
WHERE i.entity = 'income_freelance' AND w.entity = 'wallet_checking';

-- Retainer — Apex Legal: 15th of each month (2 paid + 1 upcoming)
INSERT INTO income_entries (income_id, destination_wallet_id, amount, expected_date, received_date, notes, created_by, last_modified_by)
SELECT i.id, w.id, 4000.00,
       pay_date::timestamptz,
       CASE WHEN pay_date <= CURRENT_DATE THEN pay_date::timestamptz ELSE NULL END,
       'Retainer — ' || TO_CHAR(pay_date, 'Mon YYYY'),
       2, 2
FROM _demo i, _demo w,
LATERAL (
  SELECT (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval + INTERVAL '14 days')::date AS pay_date
  FROM generate_series(0, 2) AS n
) months
WHERE i.entity = 'income_retainer' AND w.entity = 'wallet_business';

-- One-time overdue invoice
INSERT INTO income_entries (income_id, destination_wallet_id, amount, expected_date, received_date, notes, created_by, last_modified_by)
SELECT i.id, w.id, 3500.00,
       (CURRENT_DATE - INTERVAL '10 days')::timestamptz,
       NULL,
       'Overdue — invoice sent, payment not received', 1, 1
FROM _demo i, _demo w
WHERE i.entity = 'income_onetime_pending' AND w.entity = 'wallet_checking';

-- ---------------------------------------------------------------------------
-- Expenses — Personal Finance
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, recurrence_pattern, status, description, created_by, last_modified_by
  )
  SELECT
    d.id, 'Apartment Rent', l.ec_housing, l.cur_usd, w.id,
    true,
    jsonb_build_object(
      'frequency', 'monthly',
      'interval', 1,
      'dayOfMonth', 1,
      'startDate', (CURRENT_DATE - INTERVAL '12 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '24 months')::text
    ),
    'completed',
    '{"landlord": "Parkview Properties"}'::jsonb,
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_rent', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, recurrence_pattern, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Electric & Gas', l.ec_utilities, l.cur_usd, w.id,
    true,
    jsonb_build_object(
      'frequency', 'monthly',
      'interval', 1,
      'dayOfMonth', 15,
      'startDate', (CURRENT_DATE - INTERVAL '12 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '24 months')::text
    ),
    'pending',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_utilities', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, recurrence_pattern, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Weekly Groceries', l.ec_groceries, l.cur_usd, w.id,
    true,
    jsonb_build_object(
      'frequency', 'weekly',
      'interval', 1,
      'daysOfWeek', jsonb_build_array(0),
      'startDate', (CURRENT_DATE - INTERVAL '3 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '12 months')::text
    ),
    'completed',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_groceries', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, recurrence_pattern, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Software Subscriptions', l.ec_subscriptions, l.cur_usd, w.id,
    true,
    jsonb_build_object(
      'frequency', 'monthly',
      'interval', 1,
      'dayOfMonth', 20,
      'startDate', (CURRENT_DATE - INTERVAL '6 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '24 months')::text
    ),
    'pending',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_subscriptions', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, recurrence_pattern, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Home Insurance', l.ec_insurance, l.cur_usd, w.id,
    true,
    jsonb_build_object(
      'frequency', 'yearly',
      'interval', 1,
      'startDate', (DATE_TRUNC('year', CURRENT_DATE))::date::text,
      'endDate', (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '5 years')::date::text
    ),
    'pending',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_insurance', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'MacBook Pro Upgrade', l.ec_shopping, l.cur_usd, w.id,
    false, 'completed',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_laptop', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Credit Card Minimum', l.ec_housing, l.cur_usd, w.id,
    false, 'failed',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_failed', id FROM ins;

-- Expense — Shared Household
WITH ins AS (
  INSERT INTO expenses (
    canvas_id, name, expense_category_id, currency_id, wallet_id,
    is_recurring, recurrence_pattern, status, created_by, last_modified_by
  )
  SELECT
    d.id, 'Shared Rent', l.ec_housing, l.cur_usd, w.id,
    true,
    jsonb_build_object(
      'frequency', 'monthly',
      'interval', 1,
      'dayOfMonth', 1,
      'startDate', (CURRENT_DATE - INTERVAL '6 months')::text,
      'endDate', (CURRENT_DATE + INTERVAL '18 months')::text
    ),
    'pending',
    1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_household' AND w.entity = 'wallet_joint'
  RETURNING id
)
INSERT INTO _demo SELECT 'expense_shared_rent', id FROM ins;

-- ---------------------------------------------------------------------------
-- Expense payments — last 3 months + scenario-specific rows
-- ---------------------------------------------------------------------------

-- Rent: 1st of each month (3 months including current)
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id, 2100.00,
       (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval)::timestamptz,
       (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval)::timestamptz,
       'Rent — ' || TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval, 'Mon YYYY'),
       1, 1
FROM _demo e, _demo w, generate_series(0, 2) AS n
WHERE e.entity = 'expense_rent' AND w.entity = 'wallet_checking';

-- Utilities: 15th of each month — paid when due, current month overdue
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id,
       175.00 + (n * 3.25),
       due_date::timestamptz,
       CASE WHEN due_date < CURRENT_DATE THEN due_date::timestamptz ELSE NULL END,
       CASE
         WHEN due_date < CURRENT_DATE THEN 'Utilities — ' || TO_CHAR(due_date, 'Mon YYYY')
         ELSE 'Utilities — overdue bill'
       END,
       1, 1
FROM _demo e, _demo w,
LATERAL (
  SELECT (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval + INTERVAL '14 days')::date AS due_date, n
  FROM generate_series(0, 2) AS n
) months
WHERE e.entity = 'expense_utilities' AND w.entity = 'wallet_checking';

-- Utilities: fixed overdue entry (always visible in demo regardless of day-of-month)
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id, 185.50,
       (CURRENT_DATE - INTERVAL '5 days')::timestamptz,
       NULL,
       'Utilities — overdue bill', 1, 1
FROM _demo e, _demo w
WHERE e.entity = 'expense_utilities' AND w.entity = 'wallet_checking';

-- Groceries: every Sunday for the last 3 months
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id,
       125.00 + (ROW_NUMBER() OVER (ORDER BY sunday) % 4) * 18.50,
       sunday::timestamptz,
       sunday::timestamptz,
       'Groceries — week of ' || TO_CHAR(sunday, 'Mon DD'),
       1, 1
FROM _demo e, _demo w,
LATERAL (
  SELECT gs::date AS sunday
  FROM generate_series(
    (CURRENT_DATE - INTERVAL '3 months')::date,
    CURRENT_DATE,
    INTERVAL '1 day'
  ) gs
  WHERE EXTRACT(DOW FROM gs) = 0
) weeks
WHERE e.entity = 'expense_groceries' AND w.entity = 'wallet_credit';

-- Subscriptions: 20th of each month — paid when due, otherwise pending
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id, 89.99,
       due_date::timestamptz,
       CASE WHEN due_date <= CURRENT_DATE THEN due_date::timestamptz ELSE NULL END,
       'Subscriptions — ' || TO_CHAR(due_date, 'Mon YYYY'),
       1, 1
FROM _demo e, _demo w,
LATERAL (
  SELECT (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval + INTERVAL '19 days')::date AS due_date
  FROM generate_series(0, 2) AS n
) months
WHERE e.entity = 'expense_subscriptions' AND w.entity = 'wallet_credit';

-- One-time laptop purchase (within last 3 months)
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id, 2499.00,
       (CURRENT_DATE - INTERVAL '21 days')::timestamptz,
       (CURRENT_DATE - INTERVAL '21 days')::timestamptz,
       'One-time laptop purchase', 1, 1
FROM _demo e, _demo w
WHERE e.entity = 'expense_laptop' AND w.entity = 'wallet_credit';

-- Shared rent: paid for prior 2 months, upcoming this month
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id, 1800.00,
       (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval)::timestamptz,
       CASE WHEN n > 0 THEN (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval)::timestamptz ELSE NULL END,
       CASE
         WHEN n > 0 THEN 'Shared rent — ' || TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval, 'Mon YYYY')
         ELSE 'Shared rent — upcoming'
       END,
       1, 1
FROM _demo e, _demo w, generate_series(0, 2) AS n
WHERE e.entity = 'expense_shared_rent' AND w.entity = 'wallet_joint';

-- ---------------------------------------------------------------------------
-- Assets
-- ---------------------------------------------------------------------------
INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, estimated_value, description, created_by, last_modified_by)
SELECT d.id, '2022 Toyota Camry', l.ac_vehicle, l.cur_usd, 18500.00,
       '{"year": 2022, "notes": "Primary vehicle"}'::jsonb,
       1, 1
FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';

INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, estimated_value, description, created_by, last_modified_by)
SELECT d.id, 'Primary Residence Equity', l.ac_real_estate, l.cur_usd, 85000.00,
       '{"notes": "Estimated equity after mortgage"}'::jsonb,
       1, 1
FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';

INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, estimated_value, description, created_by, last_modified_by)
SELECT d.id, 'Workstation Setup', l.ac_equipment, l.cur_usd, 4200.00,
       '{"items": ["MacBook Pro", "Monitor", "Desk"]}'::jsonb,
       2, 2
FROM _demo d, _lk l WHERE d.entity = 'canvas_consulting';

-- ---------------------------------------------------------------------------
-- Transfers — monthly for last 3 months + upcoming cross-currency
-- ---------------------------------------------------------------------------
INSERT INTO transfers (
  source_wallet_id, destination_wallet_id, source_amount, destination_amount,
  exchange_rate, transaction_fee, transfer_date, notes, created_by, last_modified_by
)
SELECT sw_src.id, sw_dst.id, 500.00, 500.00,
       1.00000000, 0.00,
       (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval + INTERVAL '2 days')::timestamptz,
       'Checking → Savings — ' || TO_CHAR(DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval, 'Mon YYYY'),
       1, 1
FROM _demo sw_src, _demo sw_dst, generate_series(0, 2) AS n
WHERE sw_src.entity = 'sw_checking_usd' AND sw_dst.entity = 'sw_savings_usd';

INSERT INTO transfers (
  source_wallet_id, destination_wallet_id, source_amount, destination_amount,
  exchange_rate, transaction_fee, transfer_date, notes, created_by, last_modified_by
)
SELECT sw_usd.id, sw_eur.id, 200.00, 184.00,
       0.92000000, 2.50,
       (CURRENT_DATE + INTERVAL '2 days')::timestamptz,
       'USD → EUR for upcoming trip', 1, 1
FROM _demo sw_usd, _demo sw_eur
WHERE sw_usd.entity = 'sw_checking_usd' AND sw_eur.entity = 'sw_checking_eur';

-- ---------------------------------------------------------------------------
-- Budgets & budget lines
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO budgets (
    canvas_id, currency_id, period_type, period_start, total_limit,
    alert_threshold_percent, alerts_enabled, name, created_by, last_modified_by
  )
  SELECT
    d.id, l.cur_usd, 'monthly', DATE_TRUNC('month', CURRENT_DATE)::date,
    4500.00, 80, true, 'Monthly Spending Plan', 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'budget_monthly', id FROM ins;

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_housing, 2200.00, 90
FROM _demo b, _lk l WHERE b.entity = 'budget_monthly';

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_groceries, 600.00, 75
FROM _demo b, _lk l WHERE b.entity = 'budget_monthly';

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_subscriptions, 150.00, 80
FROM _demo b, _lk l WHERE b.entity = 'budget_monthly';

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit)
SELECT b.id, l.ec_utilities, 250.00
FROM _demo b, _lk l WHERE b.entity = 'budget_monthly';

WITH ins AS (
  INSERT INTO budgets (
    canvas_id, currency_id, period_type, period_start, total_limit,
    alert_threshold_percent, alerts_enabled, name, created_by, last_modified_by
  )
  SELECT
    d.id, l.cur_usd, 'yearly', DATE_TRUNC('year', CURRENT_DATE)::date,
    52000.00, 85, true, 'Annual Overview', 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'budget_yearly', id FROM ins;

WITH ins AS (
  INSERT INTO budgets (
    canvas_id, currency_id, period_type, period_start, total_limit,
    alert_threshold_percent, alerts_enabled, name, created_by, last_modified_by
  )
  SELECT
    d.id, l.cur_usd, 'weekly', DATE_TRUNC('week', CURRENT_DATE)::date,
    800.00, 70, true, 'Shared Weekly Allowance', 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_household'
  RETURNING id
)
INSERT INTO _demo SELECT 'budget_weekly', id FROM ins;

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit)
SELECT b.id, l.ec_groceries, 350.00
FROM _demo b, _lk l WHERE b.entity = 'budget_weekly';

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit)
SELECT b.id, l.ec_travel, 200.00
FROM _demo b, _lk l WHERE b.entity = 'budget_weekly';

-- ---------------------------------------------------------------------------
-- Savings goals (active / achieved / dropped + calendar targets)
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO savings_goals (
    canvas_id, currency_id, name, target_amount, target_date,
    linked_wallet_id, alert_threshold_percent, status, created_by, last_modified_by
  )
  SELECT
    d.id, l.cur_usd, 'Emergency Fund', 15000.00,
    (CURRENT_DATE + INTERVAL '14 days')::date,
    w.id, 80, 'active', 1, 1
  FROM _demo d, _demo w, _lk l
  WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_savings'
  RETURNING id
)
INSERT INTO _demo SELECT 'goal_emergency', id FROM ins;

INSERT INTO savings_goals (
  canvas_id, currency_id, name, target_amount, target_date,
  alert_threshold_percent, status, created_by, last_modified_by
)
SELECT
  d.id, l.cur_usd, 'Summer Vacation', 5000.00,
  (CURRENT_DATE + INTERVAL '90 days')::date,
  75, 'active', 1, 1
FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';

INSERT INTO savings_goals (
  canvas_id, currency_id, name, target_amount, target_date,
  alert_threshold_percent, status, is_archived, created_by, last_modified_by
)
SELECT
  d.id, l.cur_usd, 'New Laptop Fund', 3000.00,
  (CURRENT_DATE - INTERVAL '30 days')::date,
  80, 'achieved', true, 1, 1
FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';

INSERT INTO savings_goals (
  canvas_id, currency_id, name, target_amount, target_date,
  alert_threshold_percent, status, is_archived, created_by, last_modified_by
)
SELECT
  d.id, l.cur_usd, 'Kitchen Renovation', 12000.00,
  (CURRENT_DATE + INTERVAL '180 days')::date,
  80, 'dropped', true, 1, 1
FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';

INSERT INTO savings_goals (
  canvas_id, currency_id, name, target_amount, target_date,
  alert_threshold_percent, status, created_by, last_modified_by
)
SELECT
  d.id, l.cur_usd, 'Holiday Travel Fund', 2500.00,
  (CURRENT_DATE - INTERVAL '7 days')::date,
  80, 'active', 1, 1
FROM _demo d, _lk l WHERE d.entity = 'canvas_household';

-- ---------------------------------------------------------------------------
-- Wishlists & to-buy items
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO wishlists (name, path, description, is_public, created_by, last_modified_by)
  VALUES (
    'Home Office Upgrades',
    'demo-home-office-upgrades',
    'Equipment and furniture for a productive workspace.',
    true, 1, 1
  )
  RETURNING id
)
INSERT INTO _demo SELECT 'wishlist_office', id FROM ins;

WITH ins AS (
  INSERT INTO wishlists (name, path, description, is_public, created_by, last_modified_by)
  VALUES (
    'Consulting Toolkit',
    'demo-consulting-toolkit',
    'Software and hardware for client engagements.',
    false, 2, 2
  )
  RETURNING id
)
INSERT INTO _demo SELECT 'wishlist_consulting', id FROM ins;

INSERT INTO to_buy_items (
  wishlist_id, name, description, estimated_price, currency_id, priority,
  due_date, target_purchase_date, status, links, created_by, last_modified_by
)
SELECT wl.id, 'Ergonomic Desk Chair', 'Herman Miller or equivalent', 895.00, l.cur_usd, 1,
       (CURRENT_DATE + INTERVAL '30 days')::date,
       (CURRENT_DATE + INTERVAL '45 days')::date,
       'planned',
       '[{"label": "Product page", "url": "https://example.com/chair"}]'::jsonb,
       1, 1
FROM _demo wl, _lk l WHERE wl.entity = 'wishlist_office';

INSERT INTO to_buy_items (
  wishlist_id, name, description, estimated_price, currency_id, priority,
  due_date, actual_purchase_date, actual_price, purchased_from_wallet_id, status, created_by, last_modified_by
)
SELECT wl.id, '27" 4K Monitor', 'Calibrated display for design work', 549.00, l.cur_usd, 2,
       (CURRENT_DATE - INTERVAL '14 days')::date,
       (CURRENT_DATE - INTERVAL '10 days')::date,
       529.99,
       w.id, 'purchased',
       1, 1
FROM _demo wl, _demo w, _lk l
WHERE wl.entity = 'wishlist_office' AND w.entity = 'wallet_checking';

INSERT INTO to_buy_items (
  wishlist_id, name, description, estimated_price, currency_id, priority,
  target_purchase_date, status, created_by, last_modified_by
)
SELECT wl.id, 'Project Management License', 'Annual team subscription', 240.00, l.cur_usd, 1,
       (CURRENT_DATE + INTERVAL '60 days')::date,
       'researching',
       2, 2
FROM _demo wl, _lk l WHERE wl.entity = 'wishlist_consulting';

-- ---------------------------------------------------------------------------
-- AI insight profile & generated insights (Personal Finance)
-- ---------------------------------------------------------------------------
WITH ins AS (
  INSERT INTO ai_insight_profiles (
    canvas_id, status, current_step, risk_profile, investment_goals,
    esg_preferences, financial_knowledge, financial_picture,
    completed_at, updated_by_user_id
  )
  SELECT
    d.id, 'completed', 5,
    '{"tolerance": "moderate", "horizon_years": 15}'::jsonb,
    '{"primary": "retirement", "secondary": "home_down_payment"}'::jsonb,
    '{"preference": "neutral", "exclude_sectors": []}'::jsonb,
    '{"level": "intermediate", "familiar_with_etfs": true}'::jsonb,
    '{"monthly_income": 8500, "monthly_expenses": 4200, "emergency_months": 3}'::jsonb,
    NOW(), 1
  FROM _demo d WHERE d.entity = 'canvas_personal'
  RETURNING id
)
INSERT INTO _demo SELECT 'ai_profile', id FROM ins;

INSERT INTO ai_financial_insights (
  canvas_id, profile_id, generated_by_user_id, insights, completeness_score,
  completeness_breakdown, context_summary, model
)
SELECT
  d.id, p.id, 1,
  jsonb_build_array(
    jsonb_build_object('category', 'cash_flow', 'title', 'Healthy surplus', 'summary', 'Monthly income exceeds expenses by approximately $4,300.', 'priority', 'info'),
    jsonb_build_object('category', 'savings', 'title', 'Emergency fund on track', 'summary', 'You are at 75% of your $15,000 emergency fund target.', 'priority', 'positive'),
    jsonb_build_object('category', 'budget', 'title', 'Groceries approaching limit', 'summary', 'Grocery spending is at 87% of the monthly category budget.', 'priority', 'warning')
  ),
  82,
  '{"profile": 100, "wallets": 90, "budgets": 75, "goals": 80}'::jsonb,
  '{"canvas_name": "Personal Finance", "currency": "USD"}'::jsonb,
  'gpt-4o'
FROM _demo d, _demo p
WHERE d.entity = 'canvas_personal' AND p.entity = 'ai_profile';

INSERT INTO ai_insight_profiles (canvas_id, status, current_step, updated_by_user_id)
SELECT d.id, 'draft', 2, 2
FROM _demo d WHERE d.entity = 'canvas_consulting';

INSERT INTO ai_chat_messages (canvas_id, user_id, role, content, model)
SELECT d.id, 1, 'user', 'What is my current emergency fund progress?', 'gpt-4o'
FROM _demo d WHERE d.entity = 'canvas_personal';

INSERT INTO ai_chat_messages (canvas_id, user_id, role, content, model)
SELECT d.id, NULL, 'assistant',
       'Your emergency fund goal is $15,000. Based on liquid USD balances across active wallets, you have approximately $11,200 saved — about 75% of your target with 14 days remaining.',
       'gpt-4o'
FROM _demo d WHERE d.entity = 'canvas_personal';

INSERT INTO ai_chat_messages (canvas_id, user_id, role, content, model)
SELECT d.id, 2, 'user', 'Summarize my consulting income this quarter.', 'gpt-4o'
FROM _demo d WHERE d.entity = 'canvas_consulting';

-- ---------------------------------------------------------------------------
-- Whiteboard layout
-- ---------------------------------------------------------------------------
INSERT INTO whiteboard_viewports (canvas_id, x, y, zoom)
SELECT d.id, -120.0000, -80.0000, 0.8500
FROM _demo d WHERE d.entity = 'canvas_personal';

INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'wallet', w.id, 100.0000, 200.0000
FROM _demo d, _demo w
WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking';

INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'wallet', w.id, 350.0000, 200.0000
FROM _demo d, _demo w
WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_savings';

INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'income', i.id, 100.0000, 50.0000
FROM _demo d, _demo i
WHERE d.entity = 'canvas_personal' AND i.entity = 'income_salary';

INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'expense', e.id, 350.0000, 50.0000
FROM _demo d, _demo e
WHERE d.entity = 'canvas_personal' AND e.entity = 'expense_rent';

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, is_read)
VALUES
  (1, 'Budget alert: Groceries', 'You have used 87% of your monthly grocery budget.', false),
  (1, 'Income received', 'Acme Corp Salary of $8,500 was deposited to Primary Checking.', true),
  (1, 'Savings goal milestone', 'Emergency Fund reached 75% of target amount.', true),
  (2, 'Canvas invitation accepted', 'You joined Shared Household as a Modifier.', true),
  (2, 'Upcoming payment', 'Shared Rent of $1,800 is due in 3 days.', false);

-- ---------------------------------------------------------------------------
-- Cleanup temp tables
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS _demo;
DROP TABLE IF EXISTS _lk;

COMMIT;
