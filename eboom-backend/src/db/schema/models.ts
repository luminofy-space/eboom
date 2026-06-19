import {
  users,
  userSettings,
  canvases,
  roles,
  canvasMembers,
  canvasInvitations,
  currencies,
  walletCategories,
  wallets,
  subWallets,
  incomeCategories,
  incomes,
  incomeEntries,
  expenseCategories,
  expenses,
  expensePayments,
  transfers,
  wishlists,
  toBuyItems,
  attachments,
  notifications,
  recurrencePatterns,
  whiteboardViewports,
  whiteboardNodePositions,
} from "./schema";

// SELECT types
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Canvas = typeof canvases.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type CanvasMember = typeof canvasMembers.$inferSelect;
export type CanvasInvitation = typeof canvasInvitations.$inferSelect;
export type CanvasInvitationStatus =
  (typeof canvasInvitations.$inferSelect)["status"];
export type Currency = typeof currencies.$inferSelect;
export type WalletCategory = typeof walletCategories.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type SubWallet = typeof subWallets.$inferSelect;
export type IncomeCategory = typeof incomeCategories.$inferSelect;
export type Income = typeof incomes.$inferSelect;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ExpensePayment = typeof expensePayments.$inferSelect;
export type Transfer = typeof transfers.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type ToBuyItem = typeof toBuyItems.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type RecurrencePattern = typeof recurrencePatterns.$inferSelect;
export type WhiteboardViewport = typeof whiteboardViewports.$inferSelect;
export type WhiteboardNodePosition = typeof whiteboardNodePositions.$inferSelect;
export type WhiteboardEntityType =
  (typeof whiteboardNodePositions.$inferSelect)["entityType"];

// INSERT types
export type NewUser = typeof users.$inferInsert;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type NewCanvas = typeof canvases.$inferInsert;
export type NewRole = typeof roles.$inferInsert;
export type NewCanvasMember = typeof canvasMembers.$inferInsert;
export type NewCanvasInvitation = typeof canvasInvitations.$inferInsert;
export type NewCurrency = typeof currencies.$inferInsert;
export type NewWalletCategory = typeof walletCategories.$inferInsert;
export type NewWallet = typeof wallets.$inferInsert;
export type NewSubWallet = typeof subWallets.$inferInsert;
export type NewIncomeCategory = typeof incomeCategories.$inferInsert;
export type NewIncome = typeof incomes.$inferInsert;
export type NewIncomeEntry = typeof incomeEntries.$inferInsert;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;
export type NewExpense = typeof expenses.$inferInsert;
export type NewExpensePayment = typeof expensePayments.$inferInsert;
export type NewTransfer = typeof transfers.$inferInsert;
export type NewWishlist = typeof wishlists.$inferInsert;
export type NewToBuyItem = typeof toBuyItems.$inferInsert;
export type NewAttachment = typeof attachments.$inferInsert;
export type NewNotification = typeof notifications.$inferInsert;
export type NewRecurrencePattern = typeof recurrencePatterns.$inferInsert;
export type NewWhiteboardViewport = typeof whiteboardViewports.$inferInsert;
export type NewWhiteboardNodePosition = typeof whiteboardNodePositions.$inferInsert;
