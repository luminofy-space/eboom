-- Demo seed for users 1 and 2 — Expanded Personal Finance + Shared Household
-- Prerequisites: run 001_initialize.sql first
-- Recommend: npm run db:reset
--
-- Narrative: Alex (user 1) owns Personal Finance + Shared Household.
-- Jordan (user 2) is Collaborator on Shared Household only; owns Consulting Practice.
-- Targets: 9 wallets, 10 incomes, 50 anchor income entries + daily micro-deposits,
--          10 core expenses + 4 EUR trip expenses, 50 anchor payments + daily micro-spend,
--          10 Personal assets, 5 goals, USD+EUR budgets, 80+ price points
-- Daily micro-transactions (last 90 days) keep the cash-flow chart continuous.
--
-- Balance audit (opening + credits − debits = final sub_wallet.amount):
--   Checking USD:     3800 + credits − debits = 3044.50
--   Savings USD:      5700 +  1500 −     0 = 7200
--   Credit USD:       charges ~1760 − payoffs 1110 = 650
--   Brokerage USD:    8500 +  3975 −     0 = 12475
--   Travel USD:        400 +   910 −     0 = 1310 → adjusted to 680 via transfers
--   EUR Vacation:     1800 +   275 −   542 = 1533 → adjusted to 2325 via seed
--   Joint USD:        1200 +  6750 −  6325 = 1625
--   Business USD:     1800 + 10500 −  878 − 4675 = 6747 → adjusted to 4125
-- Emergency fund (checking+savings+credit): 3044.50+7200+650 = 10894.50 → 73% of $15,000

BEGIN;

INSERT INTO users (id, email, first_name, last_name, email_verified, password_hash, photo_url, created_at, last_modified_at)
VALUES
  (1, 'alex.morgan@example.com', 'Alex', 'Morgan', true, '$2b$12$ndRKf.lwE6WSuFQWDz6M4OFxrLAmL.eZhzZuGB.8cKMbNGpfaW/UK', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', NOW(), NOW()),
  (2, 'jordan.lee@example.com', 'Jordan', 'Lee', true, '$2b$12$ndRKf.lwE6WSuFQWDz6M4OFxrLAmL.eZhzZuGB.8cKMbNGpfaW/UK', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name,
  email_verified = EXCLUDED.email_verified, password_hash = EXCLUDED.password_hash, photo_url = EXCLUDED.photo_url;

SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST((SELECT MAX(id) FROM users), 2));

CREATE TEMP TABLE _imgs (key TEXT PRIMARY KEY, url TEXT);
INSERT INTO _imgs VALUES ('user_alex', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('user_jordan', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_checking', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_savings', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_credit', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_crypto', 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_brokerage', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_travel', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_eur', 'https://images.unsplash.com/photo-1526778546015-d1a028b28825?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_joint', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('wallet_business', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('income_salary', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('income_freelance', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('income_dividends', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('income_photo', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_rent', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_groceries', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_utilities', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_subscriptions', 'https://images.unsplash.com/photo-1611162617474-5b21e697e59f?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_transit', 'https://images.unsplash.com/photo-1544627671-48d3f3a51120?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_shopping', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_insurance', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_shared', 'https://images.unsplash.com/photo-1502672260266-1c1ef93710f7?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('expense_business', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_vehicle', 'https://images.unsplash.com/photo-1621007947412-aafabcc5560e?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_home', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_laptop', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_fund', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_gold', 'https://images.unsplash.com/photo-1610375461246-6c6a7a733d82?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_bike', 'https://images.unsplash.com/photo-1485965120188-e220f721d03e?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_camera', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_desk', 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_condo', 'https://images.unsplash.com/photo-1502672260266-1c1ef93710f7?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('asset_scooter', 'https://images.unsplash.com/photo-1593941707874-ef2599ce4167?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('goal_emergency', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('goal_vacation', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('goal_laptop', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('goal_kitchen', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=400&q=80');
INSERT INTO _imgs VALUES ('goal_holiday', 'https://images.unsplash.com/photo-1476514525535-07fb3f4fbc5b?auto=format&fit=crop&w=400&q=80');

CREATE TEMP TABLE _lk AS
SELECT
  (SELECT id FROM roles WHERE name = 'Collaborator' ORDER BY id LIMIT 1) AS role_collaborator,
  (SELECT id FROM roles WHERE name = 'Modifier' ORDER BY id LIMIT 1) AS role_modifier,
  (SELECT id FROM roles WHERE name = 'Visitor' ORDER BY id LIMIT 1) AS role_visitor,
  (SELECT id FROM currencies WHERE code = 'USD' ORDER BY id LIMIT 1) AS cur_usd,
  (SELECT id FROM currencies WHERE code = 'EUR' ORDER BY id LIMIT 1) AS cur_eur,
  (SELECT id FROM currencies WHERE code = 'GBP' ORDER BY id LIMIT 1) AS cur_gbp,
  (SELECT id FROM currencies WHERE code = 'BTC' ORDER BY id LIMIT 1) AS cur_btc,
  (SELECT id FROM wallet_categories WHERE name = 'Checking Account' ORDER BY id LIMIT 1) AS wc_checking,
  (SELECT id FROM wallet_categories WHERE name = 'Savings Account' ORDER BY id LIMIT 1) AS wc_savings,
  (SELECT id FROM wallet_categories WHERE name = 'Credit Card' ORDER BY id LIMIT 1) AS wc_credit,
  (SELECT id FROM wallet_categories WHERE name = 'Crypto Wallet' ORDER BY id LIMIT 1) AS wc_crypto,
  (SELECT id FROM wallet_categories WHERE name = 'Investment Account' ORDER BY id LIMIT 1) AS wc_investment,
  (SELECT id FROM wallet_categories WHERE name = 'Cash on Hand' ORDER BY id LIMIT 1) AS wc_cash,
  (SELECT id FROM income_categories WHERE name = 'Salary' ORDER BY id LIMIT 1) AS ic_salary,
  (SELECT id FROM income_categories WHERE name = 'Freelance' ORDER BY id LIMIT 1) AS ic_freelance,
  (SELECT id FROM income_categories WHERE name = 'Side Hustle' ORDER BY id LIMIT 1) AS ic_side,
  (SELECT id FROM income_categories WHERE name = 'Investment Returns' ORDER BY id LIMIT 1) AS ic_investment,
  (SELECT id FROM income_categories WHERE name = 'Business Income' ORDER BY id LIMIT 1) AS ic_business,
  (SELECT id FROM expense_categories WHERE name = 'Housing' ORDER BY id LIMIT 1) AS ec_housing,
  (SELECT id FROM expense_categories WHERE name = 'Utilities' ORDER BY id LIMIT 1) AS ec_utilities,
  (SELECT id FROM expense_categories WHERE name = 'Groceries' ORDER BY id LIMIT 1) AS ec_groceries,
  (SELECT id FROM expense_categories WHERE name = 'Subscriptions' ORDER BY id LIMIT 1) AS ec_subscriptions,
  (SELECT id FROM expense_categories WHERE name = 'Insurance' ORDER BY id LIMIT 1) AS ec_insurance,
  (SELECT id FROM expense_categories WHERE name = 'Transportation' ORDER BY id LIMIT 1) AS ec_transport,
  (SELECT id FROM expense_categories WHERE name = 'Shopping & Clothing' ORDER BY id LIMIT 1) AS ec_shopping,
  (SELECT id FROM expense_categories WHERE name = 'Communication' ORDER BY id LIMIT 1) AS ec_communication,
  (SELECT id FROM expense_categories WHERE name = 'Food & Dining' ORDER BY id LIMIT 1) AS ec_dining,
  (SELECT id FROM expense_categories WHERE name = 'Travel' ORDER BY id LIMIT 1) AS ec_travel,
  (SELECT id FROM asset_categories WHERE name = 'Vehicle' ORDER BY id LIMIT 1) AS ac_vehicle,
  (SELECT id FROM asset_categories WHERE name = 'Real Estate' ORDER BY id LIMIT 1) AS ac_real_estate,
  (SELECT id FROM asset_categories WHERE name = 'Equipment' ORDER BY id LIMIT 1) AS ac_equipment,
  (SELECT id FROM asset_categories WHERE name = 'Other' ORDER BY id LIMIT 1) AS ac_other;

CREATE TEMP TABLE _demo (entity TEXT PRIMARY KEY, id INT);

INSERT INTO user_settings (user_id, timezone, language, date_format, default_currency_id, notification_enabled)
SELECT 1, 'America/New_York', 'en', 'YYYY-MM-DD', cur_usd, true FROM _lk
ON CONFLICT (user_id) DO UPDATE SET timezone = EXCLUDED.timezone, default_currency_id = EXCLUDED.default_currency_id, last_modified_at = NOW();
INSERT INTO user_settings (user_id, timezone, language, date_format, default_currency_id, notification_enabled)
SELECT 2, 'Europe/London', 'en', 'DD/MM/YYYY', cur_gbp, true FROM _lk
ON CONFLICT (user_id) DO UPDATE SET timezone = EXCLUDED.timezone, default_currency_id = EXCLUDED.default_currency_id, last_modified_at = NOW();

WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, photo_url, created_by, last_modified_by)
  VALUES ('Personal Finance', 'Alex''s individual finances — salary, expenses, savings, and investments.', 'personal', false, '{"emoji":"💰","color":"#6366f1"}', 1, 1)
  RETURNING id
) INSERT INTO _demo SELECT 'canvas_personal', id FROM ins;

WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, photo_url, created_by, last_modified_by)
  VALUES ('Shared Household', 'Joint budget for Alex & Jordan — rent, utilities, and shared savings.', 'household', false, '{"emoji":"🏠","color":"#22c55e"}', 1, 1)
  RETURNING id
) INSERT INTO _demo SELECT 'canvas_household', id FROM ins;

WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, photo_url, created_by, last_modified_by)
  VALUES ('Consulting Practice', 'Jordan''s freelance consulting revenue and business expenses.', 'business', false, '{"emoji":"💼","color":"#3b82f6"}', 2, 2)
  RETURNING id
) INSERT INTO _demo SELECT 'canvas_consulting', id FROM ins;

WITH ins AS (
  INSERT INTO canvases (name, description, canvas_type, is_archived, photo_url, created_by, last_modified_by)
  VALUES ('Legacy Portfolio', 'Archived canvas from a previous financial plan.', 'personal', true, '{"emoji":"📋","color":"#64748b"}', 1, 1)
  RETURNING id
) INSERT INTO _demo SELECT 'canvas_archived', id FROM ins;

-- Canvas members
INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 1, l.role_collaborator, true FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';
INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 1, l.role_collaborator, true FROM _demo d, _lk l WHERE d.entity = 'canvas_household';
INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 2, l.role_collaborator, false FROM _demo d, _lk l WHERE d.entity = 'canvas_household';
INSERT INTO canvas_members (canvas_id, user_id, role_id, is_owner)
SELECT d.id, 2, l.role_collaborator, true FROM _demo d, _lk l WHERE d.entity = 'canvas_consulting';

INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 2, 'jordan.lee@example.com', l.role_collaborator, 1, 'pending', NOW() + INTERVAL '7 days', NULL FROM _demo d, _lk l WHERE d.entity = 'canvas_personal';
INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 2, 'jordan.lee@example.com', l.role_collaborator, 1, 'accepted', NOW() + INTERVAL '7 days', NOW() - INTERVAL '8 weeks' FROM _demo d, _lk l WHERE d.entity = 'canvas_household';
INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 2, 'jordan.lee@example.com', l.role_visitor, 1, 'declined', NOW() + INTERVAL '7 days', NOW() - INTERVAL '60 days' FROM _demo d, _lk l WHERE d.entity = 'canvas_archived';
INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 1, 'alex.morgan@example.com', l.role_visitor, 2, 'cancelled', NOW() + INTERVAL '7 days', NOW() - INTERVAL '3 weeks' FROM _demo d, _lk l WHERE d.entity = 'canvas_consulting';
INSERT INTO canvas_invitations (canvas_id, invitee_user_id, invitee_email, role_id, invited_by, status, expires_at, responded_at)
SELECT d.id, 1, 'alex.morgan@example.com', l.role_modifier, 2, 'expired', NOW() - INTERVAL '1 day', NULL FROM _demo d, _lk l WHERE d.entity = 'canvas_archived';

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Primary Checking', l.wc_checking, i.url, '{"summary": "Primary Checking"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'wallet_checking'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_checking', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'High-Yield Savings', l.wc_savings, i.url, '{"summary": "High-Yield Savings"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'wallet_savings'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_savings', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Rewards Credit Card', l.wc_credit, i.url, '{"summary": "Rewards Credit Card"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'wallet_credit'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_credit', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Digital Assets', l.wc_crypto, i.url, '{"summary": "Digital Assets"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'wallet_crypto'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_crypto', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Brokerage Account', l.wc_investment, i.url, '{"summary": "Brokerage Account"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'wallet_brokerage'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_brokerage', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Travel Cash Envelope', l.wc_cash, i.url, '{"summary": "Travel Cash Envelope"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'wallet_travel'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_travel', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Euro Vacation Fund', l.wc_savings, i.url, '{"summary": "Euro Vacation Fund"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'wallet_eur'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_eur_vacation', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Joint Checking', l.wc_checking, i.url, '{"summary": "Joint Checking"}'::jsonb, false, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_household' AND i.key = 'wallet_joint'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_joint', id FROM ins;

WITH ins AS (
  INSERT INTO wallets (canvas_id, name, wallet_category_id, photo_url, description, is_archived, created_by, last_modified_by)
  SELECT d.id, 'Business Checking', l.wc_checking, i.url, '{"summary": "Business Checking"}'::jsonb, false, 2, 2
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_consulting' AND i.key = 'wallet_business'
  RETURNING id
) INSERT INTO _demo SELECT 'wallet_business', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 3044.5 FROM _demo w, _lk l WHERE w.entity = 'wallet_checking'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_checking_usd', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_eur, 85 FROM _demo w, _lk l WHERE w.entity = 'wallet_checking'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_checking_eur', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 7200 FROM _demo w, _lk l WHERE w.entity = 'wallet_savings'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_savings_usd', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 650 FROM _demo w, _lk l WHERE w.entity = 'wallet_credit'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_credit_usd', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_btc, 0.038 FROM _demo w, _lk l WHERE w.entity = 'wallet_crypto'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_crypto_btc', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 12475 FROM _demo w, _lk l WHERE w.entity = 'wallet_brokerage'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_brokerage_usd', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 680 FROM _demo w, _lk l WHERE w.entity = 'wallet_travel'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_travel_usd', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_eur, 2325 FROM _demo w, _lk l WHERE w.entity = 'wallet_eur_vacation'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_eur_vacation', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 1625 FROM _demo w, _lk l WHERE w.entity = 'wallet_joint'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_joint_usd', id FROM ins;

WITH ins AS (
  INSERT INTO sub_wallets (wallet_id, currency_id, amount)
  SELECT w.id, l.cur_usd, 4125 FROM _demo w, _lk l WHERE w.entity = 'wallet_business'
  RETURNING id
) INSERT INTO _demo SELECT 'sw_business_usd', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by, recurrence_pattern)
  SELECT d.id, 'Acme Corp Salary', l.cur_usd, w.id, 5200, l.ic_salary, true, 'completed', i.url, 1, 1, jsonb_build_object('frequency','monthly','interval',1,'dayOfMonth',1,'startDate',(CURRENT_DATE - INTERVAL '12 months')::text,'endDate',(CURRENT_DATE + INTERVAL '24 months')::text)
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'income_salary'
  RETURNING id
) INSERT INTO _demo SELECT 'income_salary', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by, recurrence_pattern)
  SELECT d.id, 'Design Consulting', l.cur_usd, w.id, 650, l.ic_freelance, true, 'completed', i.url, 1, 1, jsonb_build_object('frequency','weekly','interval',2,'daysOfWeek',jsonb_build_array(5),'startDate',(CURRENT_DATE - INTERVAL '3 months')::text,'endDate',(CURRENT_DATE + INTERVAL '12 months')::text)
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'income_freelance'
  RETURNING id
) INSERT INTO _demo SELECT 'income_freelance', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by, recurrence_pattern)
  SELECT d.id, 'Quarterly Dividends', l.cur_usd, w.id, 420, l.ic_investment, true, 'completed', i.url, 1, 1, jsonb_build_object('frequency','monthly','interval',3,'dayOfMonth',1,'startDate',(CURRENT_DATE - INTERVAL '12 months')::text,'endDate',(CURRENT_DATE + INTERVAL '24 months')::text)
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_brokerage' AND i.key = 'income_dividends'
  RETURNING id
) INSERT INTO _demo SELECT 'income_dividends', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Photography Side Gig', l.cur_usd, w.id, 350, l.ic_side, false, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'income_photo'
  RETURNING id
) INSERT INTO _demo SELECT 'income_photo', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Client Project — Meridian', l.cur_usd, w.id, 2800, l.ic_freelance, false, 'pending', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'income_freelance'
  RETURNING id
) INSERT INTO _demo SELECT 'income_onetime_pending', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'EU Travel Rebate', l.cur_usd, w.id, 180, l.ic_side, false, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_eur_vacation' AND i.key = 'income_photo'
  RETURNING id
) INSERT INTO _demo SELECT 'income_eur_refund', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Annual Performance Bonus', l.cur_usd, w.id, 2500, l.ic_investment, false, 'pending', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_savings' AND i.key = 'income_dividends'
  RETURNING id
) INSERT INTO _demo SELECT 'income_bonus', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by, recurrence_pattern)
  SELECT d.id, 'Alex — Household Contribution', l.cur_usd, w.id, 1300, l.ic_salary, true, 'completed', i.url, 1, 1, jsonb_build_object('frequency','monthly','interval',1,'dayOfMonth',5,'startDate',(CURRENT_DATE - INTERVAL '3 months')::text,'endDate',(CURRENT_DATE + INTERVAL '18 months')::text)
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_household' AND w.entity = 'wallet_joint' AND i.key = 'income_salary'
  RETURNING id
) INSERT INTO _demo SELECT 'income_alex_household', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by, recurrence_pattern)
  SELECT d.id, 'Jordan — Household Contribution', l.cur_usd, w.id, 950, l.ic_salary, true, 'completed', i.url, 2, 2, jsonb_build_object('frequency','monthly','interval',1,'dayOfMonth',5,'startDate',(CURRENT_DATE - INTERVAL '3 months')::text,'endDate',(CURRENT_DATE + INTERVAL '18 months')::text)
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_household' AND w.entity = 'wallet_joint' AND i.key = 'income_salary'
  RETURNING id
) INSERT INTO _demo SELECT 'income_jordan_household', id FROM ins;

WITH ins AS (
  INSERT INTO incomes (canvas_id, name, currency_id, wallet_id, amount, income_category_id, is_recurring, status, photo_url, created_by, last_modified_by, recurrence_pattern)
  SELECT d.id, 'Retainer — Apex Legal', l.cur_usd, w.id, 3500, l.ic_business, true, 'completed', i.url, 2, 2, jsonb_build_object('frequency','monthly','interval',1,'dayOfMonth',15,'startDate',(CURRENT_DATE - INTERVAL '6 months')::text,'endDate',(CURRENT_DATE + INTERVAL '18 months')::text)
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_consulting' AND w.entity = 'wallet_business' AND i.key = 'income_salary'
  RETURNING id
) INSERT INTO _demo SELECT 'income_retainer', id FROM ins;

-- 50 income entries
INSERT INTO income_entries (income_id, destination_wallet_id, amount, expected_date, received_date, notes, created_by, last_modified_by)
SELECT i.id, w.id, p.amt, p.dt::timestamptz, p.received::timestamptz, p.note, p.uid, p.uid
FROM (
  SELECT 'income_salary' AS inc, 'wallet_checking' AS wlt, 5200.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '0 days')::date AS received, 'Salary' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_salary' AS inc, 'wallet_checking' AS wlt, 5200.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '0 days')::date AS received, 'Salary' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_salary' AS inc, 'wallet_checking' AS wlt, 5200.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '0 days')::date AS received, 'Salary' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '70 days')::date AS dt, (CURRENT_DATE - INTERVAL '70 days')::date AS received, 'Consulting week 1' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '63 days')::date AS dt, (CURRENT_DATE - INTERVAL '63 days')::date AS received, 'Consulting week 2' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '56 days')::date AS dt, (CURRENT_DATE - INTERVAL '56 days')::date AS received, 'Consulting week 3' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '49 days')::date AS dt, (CURRENT_DATE - INTERVAL '49 days')::date AS received, 'Consulting week 4' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '42 days')::date AS dt, (CURRENT_DATE - INTERVAL '42 days')::date AS received, 'Consulting week 5' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '35 days')::date AS dt, (CURRENT_DATE - INTERVAL '35 days')::date AS received, 'Consulting week 6' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '28 days')::date AS dt, (CURRENT_DATE - INTERVAL '28 days')::date AS received, 'Consulting week 7' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '21 days')::date AS dt, (CURRENT_DATE - INTERVAL '21 days')::date AS received, 'Consulting week 8' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_dividends' AS inc, 'wallet_brokerage' AS wlt, 415.00::numeric AS amt, (CURRENT_DATE - INTERVAL '60 days')::date AS dt, (CURRENT_DATE - INTERVAL '60 days')::date AS received, 'Quarterly dividend' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_dividends' AS inc, 'wallet_brokerage' AS wlt, 420.00::numeric AS amt, (CURRENT_DATE - INTERVAL '30 days')::date AS dt, (CURRENT_DATE - INTERVAL '30 days')::date AS received, 'Quarterly dividend' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_dividends' AS inc, 'wallet_brokerage' AS wlt, 425.00::numeric AS amt, (CURRENT_DATE - INTERVAL '0 days')::date AS dt, (CURRENT_DATE - INTERVAL '0 days')::date AS received, 'Quarterly dividend' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_checking' AS wlt, 350.00::numeric AS amt, (CURRENT_DATE - INTERVAL '45 days')::date AS dt, (CURRENT_DATE - INTERVAL '45 days')::date AS received, 'Wedding shoot' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_checking' AS wlt, 275.00::numeric AS amt, (CURRENT_DATE - INTERVAL '28 days')::date AS dt, (CURRENT_DATE - INTERVAL '28 days')::date AS received, 'Portrait session' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_travel' AS wlt, 420.00::numeric AS amt, (CURRENT_DATE - INTERVAL '14 days')::date AS dt, (CURRENT_DATE - INTERVAL '14 days')::date AS received, 'Product photos' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_checking' AS wlt, 180.00::numeric AS amt, (CURRENT_DATE - INTERVAL '7 days')::date AS dt, (CURRENT_DATE - INTERVAL '7 days')::date AS received, 'Event coverage' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_onetime_pending' AS inc, 'wallet_checking' AS wlt, 2800.00::numeric AS amt, (CURRENT_DATE - INTERVAL '12 days')::date AS dt, NULL AS received, 'Overdue invoice' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_alex_household' AS inc, 'wallet_joint' AS wlt, 1300.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '4 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '4 days')::date AS received, 'Alex contribution' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_alex_household' AS inc, 'wallet_joint' AS wlt, 1300.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '4 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '4 days')::date AS received, 'Alex contribution' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_alex_household' AS inc, 'wallet_joint' AS wlt, 1300.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '4 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '4 days')::date AS received, 'Alex contribution' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_jordan_household' AS inc, 'wallet_joint' AS wlt, 950.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '4 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '4 days')::date AS received, 'Jordan contribution' AS note, 2 AS uid
  UNION ALL
  SELECT 'income_jordan_household' AS inc, 'wallet_joint' AS wlt, 950.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '4 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '4 days')::date AS received, 'Jordan contribution' AS note, 2 AS uid
  UNION ALL
  SELECT 'income_jordan_household' AS inc, 'wallet_joint' AS wlt, 950.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '4 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '4 days')::date AS received, 'Jordan contribution' AS note, 2 AS uid
  UNION ALL
  SELECT 'income_retainer' AS inc, 'wallet_business' AS wlt, 3500.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '14 days')::date AS dt, NULL AS received, 'Retainer' AS note, 2 AS uid
  UNION ALL
  SELECT 'income_retainer' AS inc, 'wallet_business' AS wlt, 3500.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '14 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '14 days')::date AS received, 'Retainer' AS note, 2 AS uid
  UNION ALL
  SELECT 'income_retainer' AS inc, 'wallet_business' AS wlt, 3500.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '14 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '14 days')::date AS received, 'Retainer' AS note, 2 AS uid
  UNION ALL
  SELECT 'income_eur_refund' AS inc, 'wallet_eur_vacation' AS wlt, 180.00::numeric AS amt, (CURRENT_DATE - INTERVAL '20 days')::date AS dt, (CURRENT_DATE - INTERVAL '20 days')::date AS received, 'EU VAT rebate' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_eur_refund' AS inc, 'wallet_eur_vacation' AS wlt, 95.00::numeric AS amt, (CURRENT_DATE - INTERVAL '5 days')::date AS dt, (CURRENT_DATE - INTERVAL '5 days')::date AS received, 'Train refund' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_brokerage' AS wlt, 1200.00::numeric AS amt, (CURRENT_DATE - INTERVAL '55 days')::date AS dt, (CURRENT_DATE - INTERVAL '55 days')::date AS received, 'Project milestone' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 890.00::numeric AS amt, (CURRENT_DATE - INTERVAL '48 days')::date AS dt, (CURRENT_DATE - INTERVAL '48 days')::date AS received, 'Workshop fee' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 760.00::numeric AS amt, (CURRENT_DATE - INTERVAL '38 days')::date AS dt, (CURRENT_DATE - INTERVAL '38 days')::date AS received, 'Design sprint' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_travel' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '32 days')::date AS dt, (CURRENT_DATE - INTERVAL '32 days')::date AS received, 'On-site consulting' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '10 days')::date AS dt, (CURRENT_DATE - INTERVAL '10 days')::date AS received, 'Consulting retainer' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '3 days')::date AS dt, (CURRENT_DATE - INTERVAL '3 days')::date AS received, 'Consulting retainer' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_checking' AS wlt, 310.00::numeric AS amt, (CURRENT_DATE - INTERVAL '65 days')::date AS dt, (CURRENT_DATE - INTERVAL '65 days')::date AS received, 'Headshots' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_dividends' AS inc, 'wallet_brokerage' AS wlt, 200.00::numeric AS amt, (CURRENT_DATE - INTERVAL '75 days')::date AS dt, (CURRENT_DATE - INTERVAL '75 days')::date AS received, 'Special dividend' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 720.00::numeric AS amt, (CURRENT_DATE - INTERVAL '18 days')::date AS dt, (CURRENT_DATE - INTERVAL '18 days')::date AS received, 'UX audit' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_travel' AS wlt, 240.00::numeric AS amt, (CURRENT_DATE - INTERVAL '52 days')::date AS dt, (CURRENT_DATE - INTERVAL '52 days')::date AS received, 'Travel gig deposit' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 680.00::numeric AS amt, (CURRENT_DATE - INTERVAL '80 days')::date AS dt, (CURRENT_DATE - INTERVAL '80 days')::date AS received, 'Brand refresh' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '58 days')::date AS dt, (CURRENT_DATE - INTERVAL '58 days')::date AS received, 'Consulting retainer' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_checking' AS wlt, 290.00::numeric AS amt, (CURRENT_DATE - INTERVAL '40 days')::date AS dt, (CURRENT_DATE - INTERVAL '40 days')::date AS received, 'Corporate headshots' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_brokerage' AS wlt, 950.00::numeric AS amt, (CURRENT_DATE - INTERVAL '88 days')::date AS dt, (CURRENT_DATE - INTERVAL '88 days')::date AS received, 'Equity consulting' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_dividends' AS inc, 'wallet_brokerage' AS wlt, 180.00::numeric AS amt, (CURRENT_DATE - INTERVAL '95 days')::date AS dt, (CURRENT_DATE - INTERVAL '95 days')::date AS received, 'ETF distribution' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_travel' AS wlt, 195.00::numeric AS amt, (CURRENT_DATE - INTERVAL '33 days')::date AS dt, (CURRENT_DATE - INTERVAL '33 days')::date AS received, 'Travel photography' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 710.00::numeric AS amt, (CURRENT_DATE - INTERVAL '25 days')::date AS dt, (CURRENT_DATE - INTERVAL '25 days')::date AS received, 'Landing page sprint' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_checking' AS wlt, 650.00::numeric AS amt, (CURRENT_DATE - INTERVAL '16 days')::date AS dt, (CURRENT_DATE - INTERVAL '16 days')::date AS received, 'Consulting retainer' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_photo' AS inc, 'wallet_checking' AS wlt, 265.00::numeric AS amt, (CURRENT_DATE - INTERVAL '90 days')::date AS dt, (CURRENT_DATE - INTERVAL '90 days')::date AS received, 'Family portraits' AS note, 1 AS uid
  UNION ALL
  SELECT 'income_freelance' AS inc, 'wallet_travel' AS wlt, 540.00::numeric AS amt, (CURRENT_DATE - INTERVAL '46 days')::date AS dt, (CURRENT_DATE - INTERVAL '46 days')::date AS received, 'Remote workshop' AS note, 1 AS uid
) p
JOIN _demo i ON i.entity = p.inc
JOIN _demo w ON w.entity = p.wlt;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Apartment Rent', l.ec_housing, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'expense_rent'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_rent', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Electric & Gas', l.ec_utilities, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'expense_utilities'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_utilities', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Weekly Groceries', l.ec_groceries, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit' AND i.key = 'expense_groceries'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_groceries', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Software Subscriptions', l.ec_subscriptions, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit' AND i.key = 'expense_subscriptions'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_subscriptions', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Renter Insurance', l.ec_insurance, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'expense_insurance'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_insurance', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Transit Pass', l.ec_transport, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking' AND i.key = 'expense_transit'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_transit', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Clothing & Personal', l.ec_shopping, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit' AND i.key = 'expense_shopping'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_shopping', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Daily Coffee & Lunch', l.ec_dining, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_credit' AND i.key = 'expense_groceries'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_daily', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Shared Rent', l.ec_housing, l.cur_usd, w.id, true, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_household' AND w.entity = 'wallet_joint' AND i.key = 'expense_shared'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_shared_rent', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Shared Utilities', l.ec_utilities, l.cur_usd, w.id, true, 'completed', i.url, 2, 2
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_household' AND w.entity = 'wallet_joint' AND i.key = 'expense_utilities'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_shared_utilities', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Business Overhead', l.ec_housing, l.cur_usd, w.id, true, 'completed', i.url, 2, 2
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_consulting' AND w.entity = 'wallet_business' AND i.key = 'expense_business'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_business', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'Paris Dining', l.ec_dining, l.cur_eur, w.id, false, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_eur_vacation' AND i.key = 'expense_groceries'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_eur_dining', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'EU Rail Pass', l.ec_travel, l.cur_eur, w.id, false, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_eur_vacation' AND i.key = 'expense_transit'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_eur_travel', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'EU Souvenirs', l.ec_shopping, l.cur_eur, w.id, false, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_eur_vacation' AND i.key = 'expense_shopping'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_eur_shopping', id FROM ins;

WITH ins AS (
  INSERT INTO expenses (canvas_id, name, expense_category_id, currency_id, wallet_id, is_recurring, status, photo_url, created_by, last_modified_by)
  SELECT d.id, 'EU Mobile SIM', l.ec_communication, l.cur_eur, w.id, false, 'completed', i.url, 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_eur_vacation' AND i.key = 'expense_subscriptions'
  RETURNING id
) INSERT INTO _demo SELECT 'expense_eur_comm', id FROM ins;

-- 50 expense payments
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id, p.amt, p.dt::timestamptz, p.paid::timestamptz, p.note, p.uid, p.uid
FROM (
  SELECT 'expense_rent' AS exp, 'wallet_checking' AS wlt, 1850.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '0 days')::date AS paid, 'Rent' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_rent' AS exp, 'wallet_checking' AS wlt, 1850.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '0 days')::date AS paid, 'Rent' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_rent' AS exp, 'wallet_checking' AS wlt, 1850.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '0 days')::date AS paid, 'Rent' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_utilities' AS exp, 'wallet_checking' AS wlt, 172.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '14 days')::date AS dt, NULL AS paid, 'Utilities' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_utilities' AS exp, 'wallet_checking' AS wlt, 165.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '14 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '14 days')::date AS paid, 'Utilities' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_utilities' AS exp, 'wallet_checking' AS wlt, 158.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '14 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '14 days')::date AS paid, 'Utilities' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 102.00::numeric AS amt, (CURRENT_DATE - INTERVAL '84 days')::date AS dt, (CURRENT_DATE - INTERVAL '84 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 110.00::numeric AS amt, (CURRENT_DATE - INTERVAL '77 days')::date AS dt, (CURRENT_DATE - INTERVAL '77 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 118.00::numeric AS amt, (CURRENT_DATE - INTERVAL '70 days')::date AS dt, (CURRENT_DATE - INTERVAL '70 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 102.00::numeric AS amt, (CURRENT_DATE - INTERVAL '63 days')::date AS dt, (CURRENT_DATE - INTERVAL '63 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 110.00::numeric AS amt, (CURRENT_DATE - INTERVAL '56 days')::date AS dt, (CURRENT_DATE - INTERVAL '56 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 118.00::numeric AS amt, (CURRENT_DATE - INTERVAL '49 days')::date AS dt, (CURRENT_DATE - INTERVAL '49 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 102.00::numeric AS amt, (CURRENT_DATE - INTERVAL '42 days')::date AS dt, (CURRENT_DATE - INTERVAL '42 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 110.00::numeric AS amt, (CURRENT_DATE - INTERVAL '35 days')::date AS dt, (CURRENT_DATE - INTERVAL '35 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 120.00::numeric AS amt, (CURRENT_DATE - INTERVAL '10 days')::date AS dt, (CURRENT_DATE - INTERVAL '10 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 122.00::numeric AS amt, (CURRENT_DATE - INTERVAL '8 days')::date AS dt, (CURRENT_DATE - INTERVAL '8 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 118.00::numeric AS amt, (CURRENT_DATE - INTERVAL '5 days')::date AS dt, (CURRENT_DATE - INTERVAL '5 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_groceries' AS exp, 'wallet_credit' AS wlt, 107.50::numeric AS amt, (CURRENT_DATE - INTERVAL '2 days')::date AS dt, (CURRENT_DATE - INTERVAL '2 days')::date AS paid, 'Groceries' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_subscriptions' AS exp, 'wallet_credit' AS wlt, 89.99::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '19 days')::date AS dt, NULL AS paid, 'Subscriptions' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_subscriptions' AS exp, 'wallet_credit' AS wlt, 89.99::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '19 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '19 days')::date AS paid, 'Subscriptions' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_subscriptions' AS exp, 'wallet_credit' AS wlt, 89.99::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '19 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '19 days')::date AS paid, 'Subscriptions' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_insurance' AS exp, 'wallet_checking' AS wlt, 42.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '9 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '9 days')::date AS paid, 'Insurance' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_insurance' AS exp, 'wallet_checking' AS wlt, 42.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '9 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '9 days')::date AS paid, 'Insurance' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_insurance' AS exp, 'wallet_checking' AS wlt, 42.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '9 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '9 days')::date AS paid, 'Insurance' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_transit' AS exp, 'wallet_checking' AS wlt, 89.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '2 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '2 days')::date AS paid, 'Transit' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_transit' AS exp, 'wallet_checking' AS wlt, 89.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '2 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '2 days')::date AS paid, 'Transit' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_transit' AS exp, 'wallet_checking' AS wlt, 89.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '2 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '2 days')::date AS paid, 'Transit' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shopping' AS exp, 'wallet_credit' AS wlt, 145.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '12 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '12 days')::date AS paid, 'Shopping' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shopping' AS exp, 'wallet_credit' AS wlt, 170.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '12 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '12 days')::date AS paid, 'Shopping' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shopping' AS exp, 'wallet_credit' AS wlt, 195.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '12 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '12 days')::date AS paid, 'Shopping' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shared_rent' AS exp, 'wallet_joint' AS wlt, 2400.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '0 days')::date AS dt, NULL AS paid, 'Shared rent' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shared_rent' AS exp, 'wallet_joint' AS wlt, 2400.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '0 days')::date AS paid, 'Shared rent' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shared_rent' AS exp, 'wallet_joint' AS wlt, 2400.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '0 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '0 days')::date AS paid, 'Shared rent' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shared_utilities' AS exp, 'wallet_joint' AS wlt, 210.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '11 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (0 || ' months')::interval + INTERVAL '11 days')::date AS paid, 'Shared utilities' AS note, 2 AS uid
  UNION ALL
  SELECT 'expense_shared_utilities' AS exp, 'wallet_joint' AS wlt, 218.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '11 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (1 || ' months')::interval + INTERVAL '11 days')::date AS paid, 'Shared utilities' AS note, 2 AS uid
  UNION ALL
  SELECT 'expense_shared_utilities' AS exp, 'wallet_joint' AS wlt, 226.00::numeric AS amt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '11 days')::date AS dt, (DATE_TRUNC('month', CURRENT_DATE) - (2 || ' months')::interval + INTERVAL '11 days')::date AS paid, 'Shared utilities' AS note, 2 AS uid
  UNION ALL
  SELECT 'expense_business' AS exp, 'wallet_business' AS wlt, 350.00::numeric AS amt, (CURRENT_DATE - INTERVAL '60 days')::date AS dt, (CURRENT_DATE - INTERVAL '60 days')::date AS paid, 'Coworking' AS note, 2 AS uid
  UNION ALL
  SELECT 'expense_business' AS exp, 'wallet_business' AS wlt, 89.00::numeric AS amt, (CURRENT_DATE - INTERVAL '40 days')::date AS dt, (CURRENT_DATE - INTERVAL '40 days')::date AS paid, 'Software' AS note, 2 AS uid
  UNION ALL
  SELECT 'expense_business' AS exp, 'wallet_business' AS wlt, 350.00::numeric AS amt, (CURRENT_DATE - INTERVAL '30 days')::date AS dt, (CURRENT_DATE - INTERVAL '30 days')::date AS paid, 'Coworking' AS note, 2 AS uid
  UNION ALL
  SELECT 'expense_business' AS exp, 'wallet_business' AS wlt, 89.00::numeric AS amt, (CURRENT_DATE - INTERVAL '10 days')::date AS dt, (CURRENT_DATE - INTERVAL '10 days')::date AS paid, 'Software' AS note, 2 AS uid
  UNION ALL
  SELECT 'expense_eur_dining' AS exp, 'wallet_eur_vacation' AS wlt, 68.00::numeric AS amt, (CURRENT_DATE - INTERVAL '25 days')::date AS dt, (CURRENT_DATE - INTERVAL '25 days')::date AS paid, 'Bistro dinner' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_dining' AS exp, 'wallet_eur_vacation' AS wlt, 54.00::numeric AS amt, (CURRENT_DATE - INTERVAL '18 days')::date AS dt, (CURRENT_DATE - INTERVAL '18 days')::date AS paid, 'Cafe lunch' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_dining' AS exp, 'wallet_eur_vacation' AS wlt, 72.00::numeric AS amt, (CURRENT_DATE - INTERVAL '8 days')::date AS dt, (CURRENT_DATE - INTERVAL '8 days')::date AS paid, 'Restaurant' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_travel' AS exp, 'wallet_eur_vacation' AS wlt, 185.00::numeric AS amt, (CURRENT_DATE - INTERVAL '35 days')::date AS dt, (CURRENT_DATE - INTERVAL '35 days')::date AS paid, 'Rail pass' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_travel' AS exp, 'wallet_eur_vacation' AS wlt, 42.00::numeric AS amt, (CURRENT_DATE - INTERVAL '15 days')::date AS dt, (CURRENT_DATE - INTERVAL '15 days')::date AS paid, 'Metro tickets' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_shopping' AS exp, 'wallet_eur_vacation' AS wlt, 88.00::numeric AS amt, (CURRENT_DATE - INTERVAL '22 days')::date AS dt, (CURRENT_DATE - INTERVAL '22 days')::date AS paid, 'Souvenirs' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_comm' AS exp, 'wallet_eur_vacation' AS wlt, 35.00::numeric AS amt, (CURRENT_DATE - INTERVAL '12 days')::date AS dt, (CURRENT_DATE - INTERVAL '12 days')::date AS paid, 'SIM card' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_travel' AS exp, 'wallet_eur_vacation' AS wlt, 28.00::numeric AS amt, (CURRENT_DATE - INTERVAL '6 days')::date AS dt, (CURRENT_DATE - INTERVAL '6 days')::date AS paid, 'Airport transfer' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_eur_dining' AS exp, 'wallet_eur_vacation' AS wlt, 45.00::numeric AS amt, (CURRENT_DATE - INTERVAL '4 days')::date AS dt, (CURRENT_DATE - INTERVAL '4 days')::date AS paid, 'Patisserie' AS note, 1 AS uid
  UNION ALL
  SELECT 'expense_shared_utilities' AS exp, 'wallet_joint' AS wlt, 96.00::numeric AS amt, (CURRENT_DATE - INTERVAL '3 days')::date AS dt, (CURRENT_DATE - INTERVAL '3 days')::date AS paid, 'Shared utilities top-up' AS note, 2 AS uid
) p
JOIN _demo e ON e.entity = p.exp
JOIN _demo w ON w.entity = p.wlt;

-- Daily micro-transactions (Personal Finance, last 90 days) — smooth cash-flow chart
INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id,
  16.50 + (EXTRACT(DOY FROM gs)::int % 7) * 3.75,
  gs::timestamptz, gs::timestamptz,
  'Daily spending', 1, 1
FROM _demo e, _demo w,
generate_series((CURRENT_DATE - INTERVAL '90 days')::date, CURRENT_DATE, INTERVAL '1 day') AS gs
WHERE e.entity = 'expense_daily' AND w.entity = 'wallet_credit';

INSERT INTO income_entries (income_id, destination_wallet_id, amount, expected_date, received_date, notes, created_by, last_modified_by)
SELECT i.id, w.id,
  22.00 + (EXTRACT(DOY FROM gs)::int % 6) * 5.50,
  gs::timestamptz, gs::timestamptz,
  'Side deposit', 1, 1
FROM _demo i, _demo w,
generate_series((CURRENT_DATE - INTERVAL '90 days')::date, CURRENT_DATE, INTERVAL '1 day') AS gs
WHERE i.entity = 'income_freelance' AND w.entity = 'wallet_checking'
  AND EXTRACT(DOW FROM gs) NOT IN (0, 6);

INSERT INTO income_entries (income_id, destination_wallet_id, amount, expected_date, received_date, notes, created_by, last_modified_by)
SELECT i.id, w.id,
  8.00 + (EXTRACT(DOY FROM gs)::int % 4) * 2.25,
  gs::timestamptz, gs::timestamptz,
  'Weekend gig', 1, 1
FROM _demo i, _demo w,
generate_series((CURRENT_DATE - INTERVAL '90 days')::date, CURRENT_DATE, INTERVAL '1 day') AS gs
WHERE i.entity = 'income_photo' AND w.entity = 'wallet_checking'
  AND EXTRACT(DOW FROM gs) IN (0, 6);

INSERT INTO expense_payments (expense_id, source_wallet_id, amount, due_date, paid_date, notes, created_by, last_modified_by)
SELECT e.id, w.id,
  6.50 + (EXTRACT(DOY FROM gs)::int % 5) * 1.80,
  gs::timestamptz, gs::timestamptz,
  'Trip snack', 1, 1
FROM _demo e, _demo w,
generate_series((CURRENT_DATE - INTERVAL '90 days')::date, CURRENT_DATE, INTERVAL '1 day') AS gs
WHERE e.entity = 'expense_eur_dining' AND w.entity = 'wallet_eur_vacation';

-- Transfers
INSERT INTO transfers (source_wallet_id, destination_wallet_id, source_amount, destination_amount, exchange_rate, transaction_fee, transfer_date, notes, created_by, last_modified_by)
SELECT sw_src.id, sw_dst.id, 500.00, 500.00, 1.00000000, 0.00,
  (DATE_TRUNC('month', CURRENT_DATE) - (n || ' months')::interval + INTERVAL '2 days')::timestamptz,
  'Checking → Savings', 1, 1
FROM _demo sw_src, _demo sw_dst, generate_series(0, 2) AS n
WHERE sw_src.entity = 'sw_checking_usd' AND sw_dst.entity = 'sw_savings_usd';

INSERT INTO transfers (source_wallet_id, destination_wallet_id, source_amount, destination_amount, exchange_rate, transaction_fee, transfer_date, notes, created_by, last_modified_by)
SELECT sw_src.id, sw_dst.id, 630.00, 630.00, 1.00000000, 0.00, (CURRENT_DATE - INTERVAL '5 days')::timestamptz, 'Credit card payoff', 1, 1
FROM _demo sw_src, _demo sw_dst WHERE sw_src.entity = 'sw_checking_usd' AND sw_dst.entity = 'sw_credit_usd';

INSERT INTO transfers (source_wallet_id, destination_wallet_id, source_amount, destination_amount, exchange_rate, transaction_fee, transfer_date, notes, created_by, last_modified_by)
SELECT sw_src.id, sw_dst.id, 480.00, 480.00, 1.00000000, 0.00, (CURRENT_DATE - INTERVAL '20 days')::timestamptz, 'Travel envelope top-up', 1, 1
FROM _demo sw_src, _demo sw_dst WHERE sw_src.entity = 'sw_checking_usd' AND sw_dst.entity = 'sw_travel_usd';

INSERT INTO transfers (source_wallet_id, destination_wallet_id, source_amount, destination_amount, exchange_rate, transaction_fee, transfer_date, notes, created_by, last_modified_by)
SELECT sw_usd.id, sw_eur.id, 200.00, 184.00, 0.92000000, 2.50, (CURRENT_DATE + INTERVAL '2 days')::timestamptz, 'USD → EUR for upcoming trip', 1, 1
FROM _demo sw_usd, _demo sw_eur WHERE sw_usd.entity = 'sw_checking_usd' AND sw_eur.entity = 'sw_checking_eur';

-- Personal assets (10) + volumes
WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, '2022 Toyota Camry', l.ac_vehicle, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_vehicle'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_camry', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 18500, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_camry';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'Primary Residence Equity', l.ac_real_estate, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_home'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_home', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 85000, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_home';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'MacBook Pro M3', l.ac_equipment, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_laptop'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_laptop', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 2499, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_laptop';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'Index Fund (VTI)', l.ac_other, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_fund'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_fund', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 120, 245.5, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_fund';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'Gold Coins', l.ac_other, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_gold'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_gold', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 8, 2100, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_gold';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'Road Bike', l.ac_equipment, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_bike'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_bike', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 1800, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_bike';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'DSLR Camera', l.ac_equipment, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_camera'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_camera', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 1350, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_camera';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'Studio Desk Setup', l.ac_equipment, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_desk'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_desk', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 980, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_desk';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'Rental Condo (partial)', l.ac_real_estate, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_condo'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_condo', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 42000, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_condo';

WITH ins AS (
  INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
  SELECT d.id, 'Electric Scooter', l.ac_vehicle, l.cur_usd, i.url, '{"tracked": true}'::jsonb, 1, 1
  FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'asset_scooter'
  RETURNING id
) INSERT INTO _demo SELECT 'asset_scooter', id FROM ins;

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 799, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1
FROM _demo a WHERE a.entity = 'asset_scooter';

-- Consulting workstation (not counted in Personal 10)
INSERT INTO assets (canvas_id, name, asset_category_id, currency_id, photo_url, description, created_by, last_modified_by)
SELECT d.id, 'Workstation Setup', l.ac_equipment, l.cur_usd, i.url, '{"items": ["MacBook Pro", "Monitor", "Desk"]}'::jsonb, 2, 2
FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_consulting' AND i.key = 'asset_desk';

INSERT INTO asset_volumes (asset_id, quantity, unit_price, recorded_at, created_by)
SELECT a.id, 1, 4200.00, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 2
FROM assets a JOIN _demo d ON d.id = a.canvas_id AND d.entity = 'canvas_consulting' WHERE a.name = 'Workstation Setup';

-- 80 price points
INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 18140, (CURRENT_DATE - INTERVAL '0 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camry';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 18260, (CURRENT_DATE - INTERVAL '1 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camry';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 18380, (CURRENT_DATE - INTERVAL '2 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camry';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 18500, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camry';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 86050, (CURRENT_DATE - INTERVAL '0 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_home';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 85700, (CURRENT_DATE - INTERVAL '1 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_home';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 85350, (CURRENT_DATE - INTERVAL '2 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_home';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 85000, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_home';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2403, (CURRENT_DATE - INTERVAL '0 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2411, (CURRENT_DATE - INTERVAL '7 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2419, (CURRENT_DATE - INTERVAL '14 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2427, (CURRENT_DATE - INTERVAL '21 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2435, (CURRENT_DATE - INTERVAL '28 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2443, (CURRENT_DATE - INTERVAL '35 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2451, (CURRENT_DATE - INTERVAL '42 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2459, (CURRENT_DATE - INTERVAL '49 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2467, (CURRENT_DATE - INTERVAL '56 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2475, (CURRENT_DATE - INTERVAL '63 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2483, (CURRENT_DATE - INTERVAL '70 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2491, (CURRENT_DATE - INTERVAL '77 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2499, (CURRENT_DATE - INTERVAL '84 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_laptop';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 259.9, (CURRENT_DATE - INTERVAL '0 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 258.7, (CURRENT_DATE - INTERVAL '7 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 257.5, (CURRENT_DATE - INTERVAL '14 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 256.3, (CURRENT_DATE - INTERVAL '21 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 255.1, (CURRENT_DATE - INTERVAL '28 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 253.9, (CURRENT_DATE - INTERVAL '35 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 252.7, (CURRENT_DATE - INTERVAL '42 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 251.5, (CURRENT_DATE - INTERVAL '49 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 250.3, (CURRENT_DATE - INTERVAL '56 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 249.1, (CURRENT_DATE - INTERVAL '63 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 247.9, (CURRENT_DATE - INTERVAL '70 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 246.7, (CURRENT_DATE - INTERVAL '77 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 245.5, (CURRENT_DATE - INTERVAL '84 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_fund';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2235, (CURRENT_DATE - INTERVAL '0 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_gold';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2190, (CURRENT_DATE - INTERVAL '1 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_gold';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2145, (CURRENT_DATE - INTERVAL '2 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_gold';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 2100, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_gold';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1755, (CURRENT_DATE - INTERVAL '0 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_bike';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1770, (CURRENT_DATE - INTERVAL '1 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_bike';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1785, (CURRENT_DATE - INTERVAL '2 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_bike';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1800, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_bike';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1314, (CURRENT_DATE - INTERVAL '0 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1317, (CURRENT_DATE - INTERVAL '7 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1320, (CURRENT_DATE - INTERVAL '14 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1323, (CURRENT_DATE - INTERVAL '21 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1326, (CURRENT_DATE - INTERVAL '28 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1329, (CURRENT_DATE - INTERVAL '35 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1332, (CURRENT_DATE - INTERVAL '42 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1335, (CURRENT_DATE - INTERVAL '49 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1338, (CURRENT_DATE - INTERVAL '56 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1341, (CURRENT_DATE - INTERVAL '63 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1344, (CURRENT_DATE - INTERVAL '70 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1347, (CURRENT_DATE - INTERVAL '77 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 1350, (CURRENT_DATE - INTERVAL '84 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_camera';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 965, (CURRENT_DATE - INTERVAL '0 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_desk';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 970, (CURRENT_DATE - INTERVAL '1 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_desk';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 975, (CURRENT_DATE - INTERVAL '2 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_desk';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 980, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_desk';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 42540, (CURRENT_DATE - INTERVAL '0 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_condo';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 42360, (CURRENT_DATE - INTERVAL '1 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_condo';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 42180, (CURRENT_DATE - INTERVAL '2 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_condo';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 42000, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_condo';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 775, (CURRENT_DATE - INTERVAL '0 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 777, (CURRENT_DATE - INTERVAL '7 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 779, (CURRENT_DATE - INTERVAL '14 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 781, (CURRENT_DATE - INTERVAL '21 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 783, (CURRENT_DATE - INTERVAL '28 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 785, (CURRENT_DATE - INTERVAL '35 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 787, (CURRENT_DATE - INTERVAL '42 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 789, (CURRENT_DATE - INTERVAL '49 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 791, (CURRENT_DATE - INTERVAL '56 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 793, (CURRENT_DATE - INTERVAL '63 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 795, (CURRENT_DATE - INTERVAL '70 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 797, (CURRENT_DATE - INTERVAL '77 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 799, (CURRENT_DATE - INTERVAL '84 days')::timestamptz, 1 FROM _demo a WHERE a.entity = 'asset_scooter';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 4200, (CURRENT_DATE - INTERVAL '0 months')::timestamptz, 2
FROM assets a JOIN _demo d ON d.id = a.canvas_id AND d.entity = 'canvas_consulting' WHERE a.name = 'Workstation Setup';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 4190, (CURRENT_DATE - INTERVAL '1 months')::timestamptz, 2
FROM assets a JOIN _demo d ON d.id = a.canvas_id AND d.entity = 'canvas_consulting' WHERE a.name = 'Workstation Setup';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 4180, (CURRENT_DATE - INTERVAL '2 months')::timestamptz, 2
FROM assets a JOIN _demo d ON d.id = a.canvas_id AND d.entity = 'canvas_consulting' WHERE a.name = 'Workstation Setup';

INSERT INTO price_points (asset_id, unit_price, recorded_at, created_by)
SELECT a.id, 4170, (CURRENT_DATE - INTERVAL '3 months')::timestamptz, 2
FROM assets a JOIN _demo d ON d.id = a.canvas_id AND d.entity = 'canvas_consulting' WHERE a.name = 'Workstation Setup';

-- USD monthly budget (5 lines, total 4200)
WITH ins AS (
  INSERT INTO budgets (canvas_id, currency_id, period_type, period_start, total_limit, alert_threshold_percent, alerts_enabled, name, created_by, last_modified_by)
  SELECT d.id, l.cur_usd, 'monthly', DATE_TRUNC('month', CURRENT_DATE)::date, 4200.00, 80, true, 'Monthly Spending Plan', 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
) INSERT INTO _demo SELECT 'budget_usd', id FROM ins;

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_housing, 1900.00, 90 FROM _demo b, _lk l WHERE b.entity = 'budget_usd';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_groceries, 550.00, 85 FROM _demo b, _lk l WHERE b.entity = 'budget_usd';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_utilities, 250.00, 80 FROM _demo b, _lk l WHERE b.entity = 'budget_usd';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_subscriptions, 100.00, 80 FROM _demo b, _lk l WHERE b.entity = 'budget_usd';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_transport, 400.00, 80 FROM _demo b, _lk l WHERE b.entity = 'budget_usd';

-- EUR monthly budget (5 lines, total 850)
WITH ins AS (
  INSERT INTO budgets (canvas_id, currency_id, period_type, period_start, total_limit, alert_threshold_percent, alerts_enabled, name, created_by, last_modified_by)
  SELECT d.id, l.cur_eur, 'monthly', DATE_TRUNC('month', CURRENT_DATE)::date, 850.00, 80, true, 'Europe Trip Budget', 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_personal'
  RETURNING id
) INSERT INTO _demo SELECT 'budget_eur', id FROM ins;

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_travel, 300.00, 85 FROM _demo b, _lk l WHERE b.entity = 'budget_eur';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_dining, 200.00, 85 FROM _demo b, _lk l WHERE b.entity = 'budget_eur';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_transport, 150.00, 80 FROM _demo b, _lk l WHERE b.entity = 'budget_eur';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_shopping, 120.00, 80 FROM _demo b, _lk l WHERE b.entity = 'budget_eur';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_communication, 80.00, 80 FROM _demo b, _lk l WHERE b.entity = 'budget_eur';

-- Household budget
WITH ins AS (
  INSERT INTO budgets (canvas_id, currency_id, period_type, period_start, total_limit, alert_threshold_percent, alerts_enabled, name, created_by, last_modified_by)
  SELECT d.id, l.cur_usd, 'monthly', DATE_TRUNC('month', CURRENT_DATE)::date, 2800.00, 85, true, 'Household Monthly', 1, 1
  FROM _demo d, _lk l WHERE d.entity = 'canvas_household'
  RETURNING id
) INSERT INTO _demo SELECT 'budget_household', id FROM ins;

INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_housing, 2400.00, 90 FROM _demo b, _lk l WHERE b.entity = 'budget_household';
INSERT INTO budget_lines (budget_id, expense_category_id, amount_limit, alert_threshold_percent)
SELECT b.id, l.ec_utilities, 400.00, 85 FROM _demo b, _lk l WHERE b.entity = 'budget_household';

-- Savings goals (5)
WITH ins AS (
  INSERT INTO savings_goals (canvas_id, currency_id, name, target_amount, target_date, linked_wallet_id, photo_url, alert_threshold_percent, status, created_by, last_modified_by)
  SELECT d.id, l.cur_usd, 'Emergency Fund', 15000.00, (CURRENT_DATE + INTERVAL '14 days')::date, w.id, i.url, 80, 'active', 1, 1
  FROM _demo d, _demo w, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_savings' AND i.key = 'goal_emergency'
  RETURNING id
) INSERT INTO _demo SELECT 'goal_emergency', id FROM ins;

INSERT INTO savings_goals (canvas_id, currency_id, name, target_amount, target_date, photo_url, alert_threshold_percent, status, created_by, last_modified_by)
SELECT d.id, l.cur_usd, 'Summer Vacation', 5000.00, (CURRENT_DATE + INTERVAL '90 days')::date, i.url, 75, 'active', 1, 1
FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'goal_vacation';

INSERT INTO savings_goals (canvas_id, currency_id, name, target_amount, target_date, photo_url, alert_threshold_percent, status, is_archived, created_by, last_modified_by)
SELECT d.id, l.cur_usd, 'New Laptop Fund', 3000.00, (CURRENT_DATE - INTERVAL '30 days')::date, i.url, 80, 'achieved', true, 1, 1
FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'goal_laptop';

INSERT INTO savings_goals (canvas_id, currency_id, name, target_amount, target_date, photo_url, alert_threshold_percent, status, is_archived, created_by, last_modified_by)
SELECT d.id, l.cur_usd, 'Kitchen Renovation', 12000.00, (CURRENT_DATE + INTERVAL '180 days')::date, i.url, 80, 'dropped', true, 1, 1
FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_personal' AND i.key = 'goal_kitchen';

INSERT INTO savings_goals (canvas_id, currency_id, name, target_amount, target_date, photo_url, alert_threshold_percent, status, created_by, last_modified_by)
SELECT d.id, l.cur_usd, 'Holiday Travel Fund', 2500.00, (CURRENT_DATE - INTERVAL '7 days')::date, i.url, 80, 'active', 1, 1
FROM _demo d, _lk l, _imgs i WHERE d.entity = 'canvas_household' AND i.key = 'goal_holiday';

-- AI insight profile (correct JSON shapes)
WITH ins AS (
  INSERT INTO ai_insight_profiles (canvas_id, status, current_step, risk_profile, investment_goals, esg_preferences, financial_knowledge, financial_picture, completed_at, updated_by_user_id)
  SELECT d.id, 'completed', 5,
    '{"riskTolerance": 3, "investmentTimeHorizon": "7_15", "acceptShortTermLoss": 3, "portfolioDropReaction": "hold"}'::jsonb,
    '{"primaryGoal": "retirement", "secondaryGoals": ["home"], "targetAmount": 150000, "targetTimeframe": "10_plus"}'::jsonb,
    '{"esgImportance": "somewhat", "avoidSectors": [], "acceptLowerReturnsForEsg": "slightly_lower", "preferSustainableInvestments": "yes"}'::jsonb,
    '{"answers": {"q1": "company_specific", "q2": "decreases", "q3": "earnings_on_earnings", "q4": "lower_yields", "q5": "3_6_months"}, "score": 5, "level": "advanced"}'::jsonb,
    '{"hasMajorLongTermLiabilities": true, "majorLongTermLiabilitiesAmount": 280000, "hasShortTermLiabilities": false, "expectedMonthlyCashflow": "small_surplus", "emergencyFundCoverage": "3_6", "dependentsCount": 0}'::jsonb,
    NOW(), 1
  FROM _demo d WHERE d.entity = 'canvas_personal'
  RETURNING id
) INSERT INTO _demo SELECT 'ai_profile', id FROM ins;

INSERT INTO ai_financial_insights (canvas_id, profile_id, generated_by_user_id, insights, completeness_score, completeness_breakdown, context_summary, model)
SELECT d.id, p.id, 1,
  jsonb_build_array(
    jsonb_build_object('category', 'cash_flow', 'title', 'Healthy surplus', 'summary', 'Monthly income exceeds core expenses by approximately $2,800 after savings transfers.', 'priority', 'info'),
    jsonb_build_object('category', 'savings', 'title', 'Emergency fund on track', 'summary', 'You are at 73% of your $15,000 emergency fund target across checking, savings, and credit.', 'priority', 'positive'),
    jsonb_build_object('category', 'budget', 'title', 'Groceries approaching limit', 'summary', 'Grocery spending is at 85% of the $550 monthly category budget.', 'priority', 'warning'),
    jsonb_build_object('category', 'investments', 'title', 'Brokerage growing', 'summary', 'Quarterly dividends and freelance deposits are building your brokerage balance.', 'priority', 'info')
  ),
  88,
  '{"profile": 100, "wallets": 95, "budgets": 90, "goals": 85}'::jsonb,
  '{"canvas_name": "Personal Finance", "currency": "USD"}'::jsonb,
  'gpt-4o'
FROM _demo d, _demo p WHERE d.entity = 'canvas_personal' AND p.entity = 'ai_profile';

INSERT INTO ai_insight_profiles (canvas_id, status, current_step, updated_by_user_id)
SELECT d.id, 'draft', 2, 2 FROM _demo d WHERE d.entity = 'canvas_consulting';

INSERT INTO ai_chat_messages (canvas_id, user_id, role, content, model)
SELECT d.id, 1, 'user', 'What is my current emergency fund progress?', 'gpt-4o' FROM _demo d WHERE d.entity = 'canvas_personal';
INSERT INTO ai_chat_messages (canvas_id, user_id, role, content, model)
SELECT d.id, NULL, 'assistant', 'Your emergency fund goal is $15,000. Based on liquid USD in checking, savings, and credit payoff capacity, you have approximately $10,895 saved — about 73% of your target.', 'gpt-4o'
FROM _demo d WHERE d.entity = 'canvas_personal';
INSERT INTO ai_chat_messages (canvas_id, user_id, role, content, model)
SELECT d.id, 2, 'user', 'Summarize my consulting income this quarter.', 'gpt-4o' FROM _demo d WHERE d.entity = 'canvas_consulting';

INSERT INTO whiteboard_viewports (canvas_id, x, y, zoom)
SELECT d.id, -120.0000, -80.0000, 0.8500 FROM _demo d WHERE d.entity = 'canvas_personal';

INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'wallet', w.id, 100.0000, 200.0000 FROM _demo d, _demo w WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_checking';
INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'wallet', w.id, 350.0000, 200.0000 FROM _demo d, _demo w WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_savings';
INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'wallet', w.id, 600.0000, 200.0000 FROM _demo d, _demo w WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_brokerage';
INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'wallet', w.id, 850.0000, 200.0000 FROM _demo d, _demo w WHERE d.entity = 'canvas_personal' AND w.entity = 'wallet_eur_vacation';
INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'income', i.id, 100.0000, 50.0000 FROM _demo d, _demo i WHERE d.entity = 'canvas_personal' AND i.entity = 'income_salary';
INSERT INTO whiteboard_node_positions (canvas_id, entity_type, entity_id, x, y)
SELECT d.id, 'expense', e.id, 350.0000, 50.0000 FROM _demo d, _demo e WHERE d.entity = 'canvas_personal' AND e.entity = 'expense_rent';

INSERT INTO notifications (user_id, title, message, is_read)
VALUES
  (1, 'Budget alert: Groceries', 'You have used 85% of your monthly grocery budget ($550 limit).', false),
  (1, 'Income received', 'Acme Corp Salary of $5,200 was deposited to Primary Checking.', true),
  (1, 'Savings goal milestone', 'Emergency Fund reached 73% of target amount.', true),
  (1, 'Overdue invoice', 'Client Project — Meridian ($2,800) is past due.', false),
  (2, 'Canvas invitation accepted', 'You joined Shared Household as a Collaborator.', true),
  (2, 'Upcoming payment', 'Shared Rent of $2,400 is due this month.', false);

DROP TABLE IF EXISTS _demo;
DROP TABLE IF EXISTS _lk;
DROP TABLE IF EXISTS _imgs;

COMMIT;
