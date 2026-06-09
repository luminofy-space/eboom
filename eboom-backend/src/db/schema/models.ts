import {
  users,
  userSettings,
  canvases,
  roles,
  canvasMembers,
  currencies,
  walletCategories,
  wallets,
  walletBalances,
  incomeResourceCategories,
  incomeResources,
  incomeEntries,
  expenseCategories,
  expenses,
  expensePayments,
  transfers,
  wishlists,
  toBuyItems,
  attachments,
} from "./schema";

// SELECT types
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Canvas = typeof canvases.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type CanvasMember = typeof canvasMembers.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type WalletCategory = typeof walletCategories.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type WalletBalance = typeof walletBalances.$inferSelect;
export type IncomeResourceCategory = typeof incomeResourceCategories.$inferSelect;
export type IncomeResource = typeof incomeResources.$inferSelect;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ExpensePayment = typeof expensePayments.$inferSelect;
export type Transfer = typeof transfers.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type ToBuyItem = typeof toBuyItems.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;

// INSERT types
export type NewUser = typeof users.$inferInsert;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type NewCanvas = typeof canvases.$inferInsert;
export type NewRole = typeof roles.$inferInsert;
export type NewCanvasMember = typeof canvasMembers.$inferInsert;
export type NewCurrency = typeof currencies.$inferInsert;
export type NewWalletCategory = typeof walletCategories.$inferInsert;
export type NewWallet = typeof wallets.$inferInsert;
export type NewWalletBalance = typeof walletBalances.$inferInsert;
export type NewIncomeResourceCategory = typeof incomeResourceCategories.$inferInsert;
export type NewIncomeResource = typeof incomeResources.$inferInsert;
export type NewIncomeEntry = typeof incomeEntries.$inferInsert;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;
export type NewExpense = typeof expenses.$inferInsert;
export type NewExpensePayment = typeof expensePayments.$inferInsert;
export type NewTransfer = typeof transfers.$inferInsert;
export type NewWishlist = typeof wishlists.$inferInsert;
export type NewToBuyItem = typeof toBuyItems.$inferInsert;
export type NewAttachment = typeof attachments.$inferInsert;