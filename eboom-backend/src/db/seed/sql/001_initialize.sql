BEGIN;

-- roles
INSERT INTO roles (id, name, is_system_role, permissions, created_at)
VALUES
  (1, 'Collaborator', true, '{"view": true, "edit": true, "manage_members": true}'::jsonb, NOW()),
  (2, 'Modifier', true, '{"view": true, "edit": true}'::jsonb, NOW()),
  (3, 'Visitor', true, '{"view": true}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

-- wallet categories
INSERT INTO wallet_categories (id, name, created_at)
VALUES
  (1, 'Bank Account', NOW()),
  (2, 'Checking Account', NOW()),
  (3, 'Savings Account', NOW()),
  (4, 'Cash on Hand', NOW()),
  (5, 'Credit Card', NOW()),
  (6, 'Digital Wallet', NOW()),
  (7, 'Mobile Payment', NOW()),
  (8, 'Investment Account', NOW()),
  (9, 'Crypto Wallet', NOW()),
  (10, 'Prepaid Card', NOW()),
  (11, 'Loan Account', NOW())
ON CONFLICT (id) DO NOTHING;

-- income categories
INSERT INTO income_categories (id, name, created_at)
VALUES
  (1, 'Salary', NOW()),
  (2, 'Freelance', NOW()),
  (3, 'Business Income', NOW()),
  (4, 'Side Hustle', NOW()),
  (5, 'Bonuses', NOW()),
  (6, 'Interest & Dividends', NOW()),
  (7, 'Investment Returns', NOW()),
  (8, 'Rental Income', NOW()),
  (9, 'Sales & Royalties', NOW()),
  (10, 'Pension', NOW()),
  (11, 'Government Benefits', NOW()),
  (12, 'Gifts', NOW()),
  (13, 'Refunds & Reimbursements', NOW()),
  (14, 'Other Income', NOW())
ON CONFLICT (id) DO NOTHING;

-- expense categories
INSERT INTO expense_categories (id, name, created_at)
VALUES
  (1, 'Housing', NOW()),
  (2, 'Food & Dining', NOW()),
  (3, 'Groceries', NOW()),
  (4, 'Transportation', NOW()),
  (5, 'Utilities', NOW()),
  (6, 'Healthcare & Medical', NOW()),
  (7, 'Insurance', NOW()),
  (8, 'Education', NOW()),
  (9, 'Entertainment', NOW()),
  (10, 'Shopping & Clothing', NOW()),
  (11, 'Personal Care', NOW()),
  (12, 'Travel', NOW()),
  (13, 'Subscriptions', NOW()),
  (14, 'Communication', NOW()),
  (15, 'Home Maintenance', NOW()),
  (16, 'Childcare', NOW()),
  (17, 'Pets', NOW()),
  (18, 'Taxes', NOW()),
  (19, 'Debt & Loan Payments', NOW()),
  (20, 'Savings & Investments', NOW()),
  (21, 'Gifts & Donations', NOW()),
  (22, 'Other Expenses', NOW())
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

-- keep sequences in sync with the explicit ids inserted above
SELECT setval(pg_get_serial_sequence('roles', 'id'), (SELECT MAX(id) FROM roles));
SELECT setval(pg_get_serial_sequence('currencies', 'id'), (SELECT MAX(id) FROM currencies));
SELECT setval(pg_get_serial_sequence('wallet_categories', 'id'), (SELECT MAX(id) FROM wallet_categories));
SELECT setval(pg_get_serial_sequence('income_categories', 'id'), (SELECT MAX(id) FROM income_categories));
SELECT setval(pg_get_serial_sequence('expense_categories', 'id'), (SELECT MAX(id) FROM expense_categories));
SELECT setval(pg_get_serial_sequence('asset_categories', 'id'), (SELECT MAX(id) FROM asset_categories));

COMMIT;
