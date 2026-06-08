BEGIN;

-- roles
INSERT INTO roles (name, is_system_role, permissions, created_at)
VALUES
  ('Creator', true, '{"all": true}'::jsonb, NOW()),
  ('Editor', true, '{"edit": true, "view": true}'::jsonb, NOW()),
  ('Viewer', true, '{"view": true}'::jsonb, NOW())
ON CONFLICT (name) DO NOTHING;

-- currencies
INSERT INTO currencies (code, name, symbol, type, decimals, is_active, created_at)
VALUES
  ('USD', 'US Dollar', '$', 'fiat', 2, true, NOW()),
  ('EUR', 'Euro', 'EUR', 'fiat', 2, true, NOW()),
  ('IRR', 'Iranian Rial', 'IRR', 'fiat', 0, true, NOW()),
  ('BTC', 'Bitcoin', 'BTC', 'crypto', 8, true, NOW())
ON CONFLICT (code) DO NOTHING;

-- wallet categories
INSERT INTO wallet_categories (name, is_system_category, created_at)
VALUES
  ('Bank Account', true, NOW()),
  ('Cash on Hand', true, NOW()),
  ('Crypto Wallet', true, NOW())
ON CONFLICT DO NOTHING;

-- income categories
INSERT INTO income_resource_categories (name, is_system_category, created_at)
VALUES
  ('Salary', true, NOW()),
  ('Freelance', true, NOW()),
  ('Business Income', true, NOW()),
  ('Other Income', true, NOW())
ON CONFLICT DO NOTHING;

-- expense categories (2-level)
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at)
VALUES
  (NULL, NULL, 'Housing', 0, true, NOW()),
  (NULL, NULL, 'Food & Dining', 0, true, NOW()),
  (NULL, NULL, 'Transportation', 0, true, NOW()),
  (NULL, NULL, 'Utilities', 0, true, NOW()),
  (NULL, NULL, 'Other Expenses', 0, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at)
VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0 LIMIT 1), 'Rent', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Food & Dining' AND level = 0 LIMIT 1), 'Groceries', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0 LIMIT 1), 'Fuel', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0 LIMIT 1), 'Internet', 1, true, NOW())
ON CONFLICT DO NOTHING;

COMMIT;
