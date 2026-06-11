BEGIN;

-- roles
INSERT INTO roles (name, is_system_role, permissions, created_at)
VALUES
  ('Creator', true, '{"all": true}'::jsonb, NOW()),
  ('Editor', true, '{"edit": true, "view": true}'::jsonb, NOW()),
  ('Viewer', true, '{"view": true}'::jsonb, NOW())
ON CONFLICT (name) DO NOTHING;

-- currencies
INSERT INTO currencies (code, name, symbol, decimals, is_active, created_at)
VALUES
  ('USD', 'US Dollar', '$', 2, true, NOW()),
  ('EUR', 'Euro', 'EUR', 2, true, NOW()),
  ('IRR', 'Iranian Rial', 'IRR', 0, true, NOW()),
  ('BTC', 'Bitcoin', 'BTC', 8, true, NOW())
ON CONFLICT (code) DO NOTHING;

-- wallet categories
INSERT INTO wallet_categories (name, created_at)
VALUES
  ('Bank Account', NOW()),
  ('Cash on Hand', NOW()),
  ('Crypto Wallet', NOW())
ON CONFLICT DO NOTHING;

-- income categories
INSERT INTO income_categories (name, created_at)
VALUES
  ('Salary', NOW()),
  ('Freelance', NOW()),
  ('Business Income', NOW()),
  ('Other Income', NOW())
ON CONFLICT DO NOTHING;

-- expense categories
INSERT INTO expense_categories (name, created_at)
VALUES
  ('Housing', NOW()),
  ('Food & Dining', NOW()),
  ('Transportation', NOW()),
  ('Utilities', NOW()),
  ('Other Expenses', NOW())
ON CONFLICT DO NOTHING;

COMMIT;
