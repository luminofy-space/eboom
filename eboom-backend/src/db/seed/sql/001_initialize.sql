BEGIN;

-- roles
INSERT INTO roles (name, is_system_role, permissions, created_at)
VALUES
  ('Collaborator', true, '{"view": true, "edit": true, "manage_members": true}'::jsonb, NOW()),
  ('Modifier', true, '{"view": true, "edit": true}'::jsonb, NOW()),
  ('Visitor', true, '{"view": true}'::jsonb, NOW())
ON CONFLICT (name) DO NOTHING;

-- currencies
INSERT INTO currencies (id, code, name, symbol, decimals, is_active, created_at)
VALUES
  (1, 'USD', 'US Dollar', '$', 2, true, NOW()),
  (2, 'EUR', 'Euro', '€', 2, true, NOW()),
  (3, 'GBP', 'British Pound', '£', 2, true, NOW()),
  (4, 'JPY', 'Japanese Yen', '¥', 0, true, NOW()),
  (5, 'CAD', 'Canadian Dollar', 'CA$', 2, true, NOW()),
  (6, 'AUD', 'Australian Dollar', 'A$', 2, true, NOW()),
  (7, 'CHF', 'Swiss Franc', 'CHF', 2, true, NOW()),
  (8, 'CNY', 'Chinese Yuan', '¥', 2, true, NOW()),
  (9, 'AED', 'UAE Dirham', 'د.إ', 2, true, NOW()),
  (10, 'SAR', 'Saudi Riyal', '﷼', 2, true, NOW()),
  (11, 'TRY', 'Turkish Lira', '₺', 2, true, NOW()),
  (12, 'IRR', 'Iranian Rial', '﷼', 0, true, NOW()),
  (13, 'BTC', 'Bitcoin', '₿', 8, true, NOW()),
  (14, 'ETH', 'Ethereum', 'Ξ', 8, true, NOW()),
  (15, 'USDT', 'Tether', '₮', 2, true, NOW()),
  (16, 'BNB', 'Binance Coin', 'BNB', 8, true, NOW()),
  (17, 'XRP', 'Ripple', 'XRP', 6, true, NOW()),
  (18, 'LTC', 'Litecoin', 'Ł', 8, true, NOW()),
  (19, 'ADA', 'Cardano', '₳', 8, true, NOW()),
  (20, 'SOL', 'Solana', 'SOL', 8, true, NOW()),
  (21, 'DOT', 'Polkadot', 'DOT', 8, true, NOW()),
  (22, 'DOGE', 'Dogecoin', 'Ð', 8, true, NOW()),
  (23, 'FTM', 'Fantom', 'FTM', 8, true, NOW()),
  (24, 'XTZ', 'Tezos', 'XTZ', 8, true, NOW()),
  (25, 'RUNE', 'THORChain', 'RUNE', 8, true, NOW()),
  (26, 'VET', 'VeChain', 'VET', 8, true, NOW()),
  (27, 'MANA', 'Decentraland', 'MANA', 8, true, NOW()),
  (28, 'NFT', 'APENFT', 'NFT', 8, true, NOW()),
  (29, 'CAKE', 'PancakeSwap', 'CAKE', 8, true, NOW()),
  (30, 'XAU', 'Gold Ounce', 'XAU', 8, true, NOW()),
  (31, 'XAG', 'Silver Ounce', 'XAG', 8, true, NOW()),
  (32, 'AZADI', 'Azadi Gold Coin', 'AZADI', 2, true, NOW()),
  (33, 'EMAMI', 'Emami Gold Coin', 'EMAMI', 2, true, NOW()),
  (34, '1/2 AZADI', '1/2 Azadi Gold Coin', '1/2 AZADI', 2, true, NOW()),
  (35, '1/4 AZADI', '1/4 Azadi Gold Coin', '1/4 AZADI', 2, true, NOW()),
  (36, 'Gerami', 'Gerami Gold Coin', 'Gerami', 4, true, NOW()),
  (37, 'Gold', 'Gram Gold', 'Gold', 4, true, NOW()),
  (38, 'TRX', 'Tron', 'TRX', 8, true, NOW()),
  (39, 'FIL', 'Filecoin', 'FIL', 8, true, NOW()),
  (40, 'SXP', 'Solar', 'SXP', 8, true, NOW())
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
INSERT INTO asset_categories (id, name, is_systematic, created_at)
VALUES
  (1, 'Vehicle', true, NOW()),
  (2, 'Real Estate', true, NOW()),
  (3, 'Land', true, NOW()),
  (4, 'Equipment', true, NOW()),
  (5, 'Other', true, NOW()),
  (6, 'Cryptocurrency', true, NOW()),
  (7, 'Gold Coin', true, NOW()),
  (8, 'Gold', true, NOW()),
  (9, 'Silver', true, NOW()),
  (10, 'Stocks', true, NOW()),
  (11, 'Bonds', true, NOW()),
  (12, 'Mutual Funds', true, NOW()),
  (13, 'ETFs', true, NOW()),
  (14, 'Collectibles', true, NOW()),
  (15, 'Intellectual Property', true, NOW()),
  (16, 'Cash', true, NOW())
ON CONFLICT DO NOTHING;

COMMIT;
