-- ============================================================================
-- PFM Platform - Initial Seed Data Migration
-- ============================================================================
-- This file contains initial/default data for all system tables
-- Run this after creating the database schema
-- ============================================================================

BEGIN;

-- ============================================================================
-- ROLES - System roles for canvas collaboration
-- ============================================================================

INSERT INTO roles (name, is_system_role, permissions, created_at) VALUES
  ('Creator', true, '{"all": true, "delete": true, "edit": true, "view": true, "invite": true, "manage_members": true}', NOW()),
  ('Editor', true, '{"edit": true, "view": true, "create": true, "delete_own": true}', NOW()),
  ('Viewer', true, '{"view": true}', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CURRENCIES - Common fiat and crypto currencies
-- ============================================================================

INSERT INTO currencies (code, name, symbol, type, decimals, photo_url, is_active, created_at) VALUES
  -- Major Fiat Currencies
  ('USD', 'US Dollar', '$', 'fiat', 2, 'https://flagcdn.com/w80/us.png', true, NOW()),
  ('EUR', 'Euro', '€', 'fiat', 2, 'https://flagcdn.com/w80/eu.png', true, NOW()),
  ('GBP', 'British Pound Sterling', '£', 'fiat', 2, 'https://flagcdn.com/w80/gb.png', true, NOW()),
  ('JPY', 'Japanese Yen', '¥', 'fiat', 0, 'https://flagcdn.com/w80/jp.png', true, NOW()),
  ('CHF', 'Swiss Franc', 'CHF', 'fiat', 2, 'https://flagcdn.com/w80/ch.png', true, NOW()),
  ('CAD', 'Canadian Dollar', 'C$', 'fiat', 2, 'https://flagcdn.com/w80/ca.png', true, NOW()),
  ('AUD', 'Australian Dollar', 'A$', 'fiat', 2, 'https://flagcdn.com/w80/au.png', true, NOW()),
  ('CNY', 'Chinese Yuan', '¥', 'fiat', 2, 'https://flagcdn.com/w80/cn.png', true, NOW()),
  ('INR', 'Indian Rupee', '₹', 'fiat', 2, 'https://flagcdn.com/w80/in.png', true, NOW()),
  ('IRR', 'Iranian Rial', 'ریال', 'fiat', 0, 'https://flagcdn.com/w80/ir.png', true, NOW()),
  ('AED', 'UAE Dirham', 'د.إ', 'fiat', 2, 'https://flagcdn.com/w80/ae.png', true, NOW()),
  ('SAR', 'Saudi Riyal', 'ر.س', 'fiat', 2, 'https://flagcdn.com/w80/sa.png', true, NOW()),
  ('TRY', 'Turkish Lira', '₺', 'fiat', 2, 'https://flagcdn.com/w80/tr.png', true, NOW()),

  -- Major Cryptocurrencies
  ('BTC', 'Bitcoin', '₿', 'crypto', 8, null, true, NOW()),
  ('ETH', 'Ethereum', 'Ξ', 'crypto', 8, null, true, NOW()),
  ('USDT', 'Tether', 'USDT', 'crypto', 6, null, true, NOW()),
  ('USDC', 'USD Coin', 'USDC', 'crypto', 6, null, true, NOW()),
  ('BNB', 'Binance Coin', 'BNB', 'crypto', 8, null, true, NOW()),
  ('XRP', 'Ripple', 'XRP', 'crypto', 6, null, true, NOW()),
  ('ADA', 'Cardano', 'ADA', 'crypto', 6, null, true, NOW()),
  ('SOL', 'Solana', 'SOL', 'crypto', 8, null, true, NOW()),
  ('DOGE', 'Dogecoin', 'DOGE', 'crypto', 8, null, true, NOW()),
  ('DOT', 'Polkadot', 'DOT', 'crypto', 8, null, true, NOW()),
  ('MATIC', 'Polygon', 'MATIC', 'crypto', 8, null, true, NOW()),
  ('LTC', 'Litecoin', 'LTC', 'crypto', 8, null, true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VALUE CATEGORIES - System-level asset types
-- ============================================================================

INSERT INTO value_categories (canvas_id, name, category_type, currency_id, unit, is_fungible, is_wallet_compatible, created_at) VALUES
  -- Currency-based (wallet compatible)
  (NULL, 'Cash - USD', 'currency', (SELECT id FROM currencies WHERE code = 'USD'), NULL, true, true, NOW()),
  (NULL, 'Cash - EUR', 'currency', (SELECT id FROM currencies WHERE code = 'EUR'), NULL, true, true, NOW()),
  (NULL, 'Cash - GBP', 'currency', (SELECT id FROM currencies WHERE code = 'GBP'), NULL, true, true, NOW()),
  (NULL, 'Cash - IRR', 'currency', (SELECT id FROM currencies WHERE code = 'IRR'), NULL, true, true, NOW()),
  (NULL, 'Bitcoin', 'currency', (SELECT id FROM currencies WHERE code = 'BTC'), NULL, true, true, NOW()),
  (NULL, 'Ethereum', 'currency', (SELECT id FROM currencies WHERE code = 'ETH'), NULL, true, true, NOW()),
  (NULL, 'Tether (USDT)', 'currency', (SELECT id FROM currencies WHERE code = 'USDT'), NULL, true, true, NOW()),

  -- Precious Metals
  (NULL, 'Gold', 'precious_metal', NULL, 'gram', true, true, NOW()),
  (NULL, 'Silver', 'precious_metal', NULL, 'gram', true, true, NOW()),
  (NULL, 'Platinum', 'precious_metal', NULL, 'gram', true, true, NOW()),
  (NULL, 'Palladium', 'precious_metal', NULL, 'gram', true, true, NOW()),

  -- Real Estate
  (NULL, 'Residential Property', 'real_estate', NULL, 'sqm', false, false, NOW()),
  (NULL, 'Commercial Property', 'real_estate', NULL, 'sqm', false, false, NOW()),
  (NULL, 'Land', 'real_estate', NULL, 'sqm', false, false, NOW()),
  (NULL, 'Apartment', 'real_estate', NULL, 'sqm', false, false, NOW()),

  -- Vehicles
  (NULL, 'Car', 'vehicle', NULL, 'piece', false, false, NOW()),
  (NULL, 'Motorcycle', 'vehicle', NULL, 'piece', false, false, NOW()),
  (NULL, 'Boat', 'vehicle', NULL, 'piece', false, false, NOW()),
  (NULL, 'Aircraft', 'vehicle', NULL, 'piece', false, false, NOW()),

  -- Stocks & Securities
  (NULL, 'Common Stock', 'stock', NULL, 'share', true, false, NOW()),
  (NULL, 'ETF', 'stock', NULL, 'share', true, false, NOW()),
  (NULL, 'Bond', 'stock', NULL, 'piece', true, false, NOW()),
  (NULL, 'Mutual Fund', 'stock', NULL, 'unit', true, false, NOW()),

  -- Commodities
  (NULL, 'Oil Barrel', 'commodity', NULL, 'barrel', true, false, NOW()),
  (NULL, 'Natural Gas', 'commodity', NULL, 'MMBtu', true, false, NOW()),
  (NULL, 'Wheat', 'commodity', NULL, 'bushel', true, false, NOW()),

  -- Other
  (NULL, 'Jewelry', 'other', NULL, 'piece', false, false, NOW()),
  (NULL, 'Art', 'other', NULL, 'piece', false, false, NOW()),
  (NULL, 'Collectibles', 'other', NULL, 'piece', false, false, NOW()),
  (NULL, 'Equipment', 'other', NULL, 'piece', false, false, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ENTITY TYPES - Categories for external parties
-- ============================================================================

INSERT INTO entity_types (name, created_at) VALUES
  ('Person', NOW()),
  ('Family Member', NOW()),
  ('Friend', NOW()),
  ('Company', NOW()),
  ('Employer', NOW()),
  ('Client', NOW()),
  ('Vendor', NOW()),
  ('Shop', NOW()),
  ('Supermarket', NOW()),
  ('Restaurant', NOW()),
  ('Bank', NOW()),
  ('Credit Union', NOW()),
  ('Exchange', NOW()),
  ('Brokerage', NOW()),
  ('Government Agency', NOW()),
  ('Tax Authority', NOW()),
  ('Insurance Company', NOW()),
  ('Utility Provider', NOW()),
  ('Landlord', NOW()),
  ('Tenant', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- WALLET CATEGORIES - Types of wallets/accounts
-- ============================================================================

INSERT INTO wallet_categories (name, is_system_category, created_at) VALUES
  ('Bank Account', true, NOW()),
  ('Checking Account', true, NOW()),
  ('Savings Account', true, NOW()),
  ('Credit Card', true, NOW()),
  ('Debit Card', true, NOW()),
  ('Crypto Wallet', true, NOW()),
  ('Hardware Wallet', true, NOW()),
  ('Exchange Account', true, NOW()),
  ('Cash on Hand', true, NOW()),
  ('Safe', true, NOW()),
  ('Investment Account', true, NOW()),
  ('Brokerage Account', true, NOW()),
  ('Retirement Account (401k)', true, NOW()),
  ('IRA Account', true, NOW()),
  ('PayPal', true, NOW()),
  ('Venmo', true, NOW()),
  ('Mobile Payment', true, NOW()),
  ('Gift Card', true, NOW()),
  ('Prepaid Card', true, NOW()),
  ('Money Market Account', true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INCOME RESOURCE CATEGORIES - Types of income sources
-- ============================================================================

INSERT INTO income_resource_categories (name, is_system_category, created_at) VALUES
  ('Salary', true, NOW()),
  ('Wages', true, NOW()),
  ('Bonus', true, NOW()),
  ('Commission', true, NOW()),
  ('Freelance Work', true, NOW()),
  ('Contract Work', true, NOW()),
  ('Consulting', true, NOW()),
  ('Business Income', true, NOW()),
  ('Investment Returns', true, NOW()),
  ('Dividends', true, NOW()),
  ('Interest Income', true, NOW()),
  ('Capital Gains', true, NOW()),
  ('Rental Income', true, NOW()),
  ('Royalties', true, NOW()),
  ('Gift', true, NOW()),
  ('Inheritance', true, NOW()),
  ('Tax Refund', true, NOW()),
  ('Government Benefits', true, NOW()),
  ('Pension', true, NOW()),
  ('Social Security', true, NOW()),
  ('Cryptocurrency Trading', true, NOW()),
  ('Stock Trading', true, NOW()),
  ('Forex Trading', true, NOW()),
  ('Side Hustle', true, NOW()),
  ('Cashback/Rewards', true, NOW()),
  ('Reimbursement', true, NOW()),
  ('Scholarship', true, NOW()),
  ('Grant', true, NOW()),
  ('Loan Received', true, NOW()),
  ('Other Income', true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXPENSE CATEGORIES - Multi-level hierarchy
-- ============================================================================

-- Level 0: Main Categories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  -- Housing
  (NULL, NULL, 'Housing', 0, true, NOW()),
  -- Transportation
  (NULL, NULL, 'Transportation', 0, true, NOW()),
  -- Food
  (NULL, NULL, 'Food & Dining', 0, true, NOW()),
  -- Healthcare
  (NULL, NULL, 'Healthcare', 0, true, NOW()),
  -- Entertainment
  (NULL, NULL, 'Entertainment', 0, true, NOW()),
  -- Education
  (NULL, NULL, 'Education', 0, true, NOW()),
  -- Personal Care
  (NULL, NULL, 'Personal Care', 0, true, NOW()),
  -- Shopping
  (NULL, NULL, 'Shopping', 0, true, NOW()),
  -- Utilities
  (NULL, NULL, 'Utilities', 0, true, NOW()),
  -- Insurance
  (NULL, NULL, 'Insurance', 0, true, NOW()),
  -- Taxes
  (NULL, NULL, 'Taxes', 0, true, NOW()),
  -- Debt Payments
  (NULL, NULL, 'Debt Payments', 0, true, NOW()),
  -- Savings & Investments
  (NULL, NULL, 'Savings & Investments', 0, true, NOW()),
  -- Gifts & Donations
  (NULL, NULL, 'Gifts & Donations', 0, true, NOW()),
  -- Travel
  (NULL, NULL, 'Travel', 0, true, NOW()),
  -- Business Expenses
  (NULL, NULL, 'Business Expenses', 0, true, NOW()),
  -- Fees & Charges
  (NULL, NULL, 'Fees & Charges', 0, true, NOW()),
  -- Pet Care
  (NULL, NULL, 'Pet Care', 0, true, NOW()),
  -- Childcare
  (NULL, NULL, 'Childcare', 0, true, NOW()),
  -- Other
  (NULL, NULL, 'Other Expenses', 0, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Housing Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'Rent', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'Mortgage', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'Property Tax', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'HOA Fees', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'Home Maintenance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'Home Improvement', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'Furniture', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Housing' AND level = 0), 'Appliances', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Transportation Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Fuel/Gas', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Car Payment', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Car Insurance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Car Maintenance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Car Registration', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Parking', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Public Transit', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Ride Share (Uber/Lyft)', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Transportation' AND level = 0), 'Tolls', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Food & Dining Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Food & Dining' AND level = 0), 'Groceries', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Food & Dining' AND level = 0), 'Restaurants', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Food & Dining' AND level = 0), 'Fast Food', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Food & Dining' AND level = 0), 'Coffee Shops', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Food & Dining' AND level = 0), 'Food Delivery', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Food & Dining' AND level = 0), 'Alcohol & Bars', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Healthcare Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Health Insurance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Doctor Visits', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Dentist', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Vision Care', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Pharmacy/Medications', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Medical Equipment', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Lab Tests', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Healthcare' AND level = 0), 'Hospital', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Entertainment Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Streaming Services', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Movies & Theater', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Concerts & Events', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Sports & Recreation', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Hobbies', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Books & Magazines', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Games', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Entertainment' AND level = 0), 'Music', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Education Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Education' AND level = 0), 'Tuition', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Education' AND level = 0), 'Books & Supplies', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Education' AND level = 0), 'Online Courses', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Education' AND level = 0), 'Training & Certification', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Education' AND level = 0), 'Student Loan Payment', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Personal Care Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Personal Care' AND level = 0), 'Haircut & Salon', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Personal Care' AND level = 0), 'Spa & Massage', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Personal Care' AND level = 0), 'Gym Membership', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Personal Care' AND level = 0), 'Cosmetics & Beauty', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Personal Care' AND level = 0), 'Toiletries', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Shopping Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Shopping' AND level = 0), 'Clothing', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Shopping' AND level = 0), 'Shoes', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Shopping' AND level = 0), 'Accessories', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Shopping' AND level = 0), 'Electronics', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Shopping' AND level = 0), 'Home Goods', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Shopping' AND level = 0), 'Online Shopping', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Utilities Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Electricity', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Water', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Gas', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Internet', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Phone', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Cable/Satellite', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Trash/Recycling', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Utilities' AND level = 0), 'Security System', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Insurance Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Insurance' AND level = 0), 'Life Insurance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Insurance' AND level = 0), 'Home Insurance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Insurance' AND level = 0), 'Renters Insurance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Insurance' AND level = 0), 'Disability Insurance', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Insurance' AND level = 0), 'Umbrella Insurance', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Taxes Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Taxes' AND level = 0), 'Federal Tax', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Taxes' AND level = 0), 'State Tax', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Taxes' AND level = 0), 'Local Tax', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Taxes' AND level = 0), 'Sales Tax', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Taxes' AND level = 0), 'Capital Gains Tax', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Debt Payments Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Debt Payments' AND level = 0), 'Credit Card Payment', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Debt Payments' AND level = 0), 'Personal Loan', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Debt Payments' AND level = 0), 'Business Loan', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Debt Payments' AND level = 0), 'Payday Loan', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Savings & Investments Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Savings & Investments' AND level = 0), 'Emergency Fund', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Savings & Investments' AND level = 0), 'Retirement (401k/IRA)', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Savings & Investments' AND level = 0), 'Stock Purchase', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Savings & Investments' AND level = 0), 'Crypto Investment', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Savings & Investments' AND level = 0), 'Real Estate Investment', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Savings & Investments' AND level = 0), 'College Fund', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Gifts & Donations Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Gifts & Donations' AND level = 0), 'Birthday Gifts', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Gifts & Donations' AND level = 0), 'Holiday Gifts', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Gifts & Donations' AND level = 0), 'Wedding Gifts', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Gifts & Donations' AND level = 0), 'Charity', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Gifts & Donations' AND level = 0), 'Religious Donations', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Travel Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Travel' AND level = 0), 'Flights', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Travel' AND level = 0), 'Hotels', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Travel' AND level = 0), 'Car Rental', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Travel' AND level = 0), 'Vacation Expenses', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Travel' AND level = 0), 'Travel Insurance', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Business Expenses Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Business Expenses' AND level = 0), 'Office Supplies', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Business Expenses' AND level = 0), 'Software & Subscriptions', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Business Expenses' AND level = 0), 'Marketing & Advertising', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Business Expenses' AND level = 0), 'Professional Services', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Business Expenses' AND level = 0), 'Business Travel', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Business Expenses' AND level = 0), 'Client Entertainment', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Fees & Charges Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Fees & Charges' AND level = 0), 'Bank Fees', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Fees & Charges' AND level = 0), 'ATM Fees', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Fees & Charges' AND level = 0), 'Late Fees', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Fees & Charges' AND level = 0), 'Service Charges', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Fees & Charges' AND level = 0), 'Transaction Fees', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Fees & Charges' AND level = 0), 'Legal Fees', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Pet Care Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Pet Care' AND level = 0), 'Pet Food', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Pet Care' AND level = 0), 'Veterinary', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Pet Care' AND level = 0), 'Pet Grooming', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Pet Care' AND level = 0), 'Pet Supplies', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Pet Care' AND level = 0), 'Pet Insurance', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- Level 1: Childcare Subcategories
INSERT INTO expense_categories (canvas_id, parent_category_id, name, level, is_system_category, created_at) VALUES
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Childcare' AND level = 0), 'Daycare', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Childcare' AND level = 0), 'Babysitter', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Childcare' AND level = 0), 'Child Activities', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Childcare' AND level = 0), 'Child Supplies', 1, true, NOW()),
  (NULL, (SELECT id FROM expense_categories WHERE name = 'Childcare' AND level = 0), 'Child Healthcare', 1, true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEBT TYPES - Types of debts/loans
-- ============================================================================

INSERT INTO debt_types (name, is_receivable) VALUES
  ('Loan Given to Others', true),
  ('Money Lent', true),
  ('Debt Receivable', true),
  ('Loan Taken from Others', false),
  ('Money Borrowed', false),
  ('Debt Owed', false),
  ('Credit Card Debt', false),
  ('Personal Loan', false),
  ('Student Loan', false),
  ('Auto Loan', false),
  ('Mortgage', false),
  ('Business Loan', false),
  ('Line of Credit', false),
  ('Payday Loan', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE CURRENCY EXCHANGE RATES (For demonstration)
-- ============================================================================

INSERT INTO currency_exchange_rates (from_currency_id, to_currency_id, rate, rate_date, source, created_at) VALUES
  -- USD to major currencies
  ((SELECT id FROM currencies WHERE code = 'USD'), (SELECT id FROM currencies WHERE code = 'EUR'), 0.92, NOW(), 'manual', NOW()),
  ((SELECT id FROM currencies WHERE code = 'USD'), (SELECT id FROM currencies WHERE code = 'GBP'), 0.79, NOW(), 'manual', NOW()),
  ((SELECT id FROM currencies WHERE code = 'USD'), (SELECT id FROM currencies WHERE code = 'JPY'), 149.50, NOW(), 'manual', NOW()),
  ((SELECT id FROM currencies WHERE code = 'USD'), (SELECT id FROM currencies WHERE code = 'IRR'), 42000.00, NOW(), 'manual', NOW()),

  -- EUR to major currencies
  ((SELECT id FROM currencies WHERE code = 'EUR'), (SELECT id FROM currencies WHERE code = 'USD'), 1.09, NOW(), 'manual', NOW()),
  ((SELECT id FROM currencies WHERE code = 'EUR'), (SELECT id FROM currencies WHERE code = 'GBP'), 0.86, NOW(), 'manual', NOW()),

  -- Crypto to USD
  ((SELECT id FROM currencies WHERE code = 'BTC'), (SELECT id FROM currencies WHERE code = 'USD'), 43500.00, NOW(), 'manual', NOW()),
  ((SELECT id FROM currencies WHERE code = 'ETH'), (SELECT id FROM currencies WHERE code = 'USD'), 2350.00, NOW(), 'manual', NOW()),
  ((SELECT id FROM currencies WHERE code = 'USDT'), (SELECT id FROM currencies WHERE code = 'USD'), 1.00, NOW(), 'manual', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INFO: User-specific tables (no seed data needed)
-- ============================================================================
-- The following tables are user/canvas-specific and should NOT have seed data:
-- - users (created during registration)
-- - user_settings (created when user sets preferences)
-- - canvases (created by users)
-- - canvas_members (users join canvases)
-- - canvas_invitations (sent by users)
-- - entities (user-created contacts)
-- - wallets (user-created wallets)
-- - assets (user-owned assets)
-- - income_resources (user income sources)
-- - income_transactions (user income records)
-- - income_forecasts (user projections)
-- - expenses (user expenses)
-- - spent_transactions (user spending)
-- - converted_transactions (user conversions)
-- - debts (user debts/loans)
-- - debt_payments (user payments)
-- - budgets (user budgets)
-- - budget_tracking (auto-generated)
-- - financial_plans (user plans)
-- - financial_goals (user goals)
-- - to_buy_items (user wishlists)
-- - notifications (system-generated)
-- - activity_logs (system-generated)
-- - attachments (user uploads)
-- - ai_conversations (user AI chats)
-- - ai_financial_insights (AI-generated)

COMMIT;

-- ============================================================================
-- Verification Queries (Optional - Run to verify seed data)
-- ============================================================================

-- SELECT COUNT(*) as roles_count FROM roles;
-- SELECT COUNT(*) as currencies_count FROM currencies;
-- SELECT COUNT(*) as value_categories_count FROM value_categories;
-- SELECT COUNT(*) as entity_types_count FROM entity_types;
-- SELECT COUNT(*) as wallet_categories_count FROM wallet_categories;
-- SELECT COUNT(*) as income_categories_count FROM income_resource_categories;
-- SELECT COUNT(*) as expense_categories_count FROM expense_categories;
-- SELECT COUNT(*) as debt_types_count FROM debt_types;
-- SELECT COUNT(*) as exchange_rates_count FROM currency_exchange_rates;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
