BEGIN;

-- roles
INSERT INTO roles (name, is_system_role, permissions, created_at)
VALUES
  ('Collaborator', true, '{"view": true, "edit": true, "manage_members": true}'::jsonb, NOW()),
  ('Modifier', true, '{"view": true, "edit": true}'::jsonb, NOW()),
  ('Visitor', true, '{"view": true}'::jsonb, NOW())
ON CONFLICT (name) DO NOTHING;

-- currencies
INSERT INTO currencies (code, name, symbol, decimals, is_active, created_at)
VALUES
  ('USD', 'US Dollar', '$', 2, true, NOW()),
  ('EUR', 'Euro', '€', 2, true, NOW()),
  ('GBP', 'British Pound', '£', 2, true, NOW()),
  ('JPY', 'Japanese Yen', '¥', 0, true, NOW()),
  ('CAD', 'Canadian Dollar', 'CA$', 2, true, NOW()),
  ('AUD', 'Australian Dollar', 'A$', 2, true, NOW()),
  ('CHF', 'Swiss Franc', 'CHF', 2, true, NOW()),
  ('CNY', 'Chinese Yuan', '¥', 2, true, NOW()),
  ('AED', 'UAE Dirham', 'د.إ', 2, true, NOW()),
  ('SAR', 'Saudi Riyal', '﷼', 2, true, NOW()),
  ('TRY', 'Turkish Lira', '₺', 2, true, NOW()),
  ('IRR', 'Iranian Rial', '﷼', 0, true, NOW()),
  ('BTC', 'Bitcoin', '₿', 8, true, NOW()),
  ('ETH', 'Ethereum', 'Ξ', 8, true, NOW()),
  ('USDT', 'Tether', '₮', 2, true, NOW())
ON CONFLICT (code) DO NOTHING;

-- wallet categories
INSERT INTO wallet_categories (name, created_at)
VALUES
  ('Bank Account', NOW()),
  ('Checking Account', NOW()),
  ('Savings Account', NOW()),
  ('Cash on Hand', NOW()),
  ('Credit Card', NOW()),
  ('Digital Wallet', NOW()),
  ('Mobile Payment', NOW()),
  ('Investment Account', NOW()),
  ('Crypto Wallet', NOW()),
  ('Prepaid Card', NOW()),
  ('Loan Account', NOW())
ON CONFLICT DO NOTHING;

-- income categories
INSERT INTO income_categories (name, created_at)
VALUES
  ('Salary', NOW()),
  ('Freelance', NOW()),
  ('Business Income', NOW()),
  ('Side Hustle', NOW()),
  ('Bonuses', NOW()),
  ('Interest & Dividends', NOW()),
  ('Investment Returns', NOW()),
  ('Rental Income', NOW()),
  ('Sales & Royalties', NOW()),
  ('Pension', NOW()),
  ('Government Benefits', NOW()),
  ('Gifts', NOW()),
  ('Refunds & Reimbursements', NOW()),
  ('Other Income', NOW())
ON CONFLICT DO NOTHING;

-- expense categories
INSERT INTO expense_categories (name, created_at)
VALUES
  ('Housing', NOW()),
  ('Food & Dining', NOW()),
  ('Groceries', NOW()),
  ('Transportation', NOW()),
  ('Utilities', NOW()),
  ('Healthcare & Medical', NOW()),
  ('Insurance', NOW()),
  ('Education', NOW()),
  ('Entertainment', NOW()),
  ('Shopping & Clothing', NOW()),
  ('Personal Care', NOW()),
  ('Travel', NOW()),
  ('Subscriptions', NOW()),
  ('Communication', NOW()),
  ('Home Maintenance', NOW()),
  ('Childcare', NOW()),
  ('Pets', NOW()),
  ('Taxes', NOW()),
  ('Debt & Loan Payments', NOW()),
  ('Savings & Investments', NOW()),
  ('Gifts & Donations', NOW()),
  ('Other Expenses', NOW())
ON CONFLICT DO NOTHING;

-- asset categories
INSERT INTO asset_categories (name, is_systematic, created_at)
VALUES
  ('Vehicle', true, NOW()),
  ('Real Estate', true, NOW()),
  ('Land', true, NOW()),
  ('Equipment', true, NOW()),
  ('Other', true, NOW())
ON CONFLICT DO NOTHING;

COMMIT;
