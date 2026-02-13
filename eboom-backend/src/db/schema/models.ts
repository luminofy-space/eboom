import {
  users,
  userSettings,
  canvases,
  roles,
  canvasMembers,
  canvasInvitations,
  currencies,
  currencyExchangeRates,
  valueCategories,
  entityTypes,
  entities,
  walletCategories,
  wallets,
  assets,
  incomeResourceCategories,
  incomeResources,
  incomeTransactions,
  incomeForecasts,
  expenseCategories,
  expenses,
  spentTransactions,
  convertedTransactions,
  debtTypes,
  debts,
  debtPayments,
  budgets,
  budgetTracking,
  financialPlans,
  financialGoals,
  toBuyItems,
  notifications,
  activityLogs,
  attachments,
  aiConversations,
  aiFinancialInsights,
} from './schema';

// SELECT types (for reading from database)
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Canvas = typeof canvases.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type CanvasMember = typeof canvasMembers.$inferSelect;
export type CanvasInvitation = typeof canvasInvitations.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type CurrencyExchangeRate = typeof currencyExchangeRates.$inferSelect;
export type ValueCategory = typeof valueCategories.$inferSelect;
export type EntityType = typeof entityTypes.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type WalletCategory = typeof walletCategories.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type IncomeResourceCategory = typeof incomeResourceCategories.$inferSelect;
export type IncomeResource = typeof incomeResources.$inferSelect;
export type IncomeTransaction = typeof incomeTransactions.$inferSelect;
export type IncomeForecast = typeof incomeForecasts.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type SpentTransaction = typeof spentTransactions.$inferSelect;
export type ConvertedTransaction = typeof convertedTransactions.$inferSelect;
export type DebtType = typeof debtTypes.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type DebtPayment = typeof debtPayments.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type BudgetTracking = typeof budgetTracking.$inferSelect;
export type FinancialPlan = typeof financialPlans.$inferSelect;
export type FinancialGoal = typeof financialGoals.$inferSelect;
export type ToBuyItem = typeof toBuyItems.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
export type AiFinancialInsight = typeof aiFinancialInsights.$inferSelect;

// INSERT types (for inserting into database)
export type NewUser = typeof users.$inferInsert;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type NewCanvas = typeof canvases.$inferInsert;
export type NewRole = typeof roles.$inferInsert;
export type NewCanvasMember = typeof canvasMembers.$inferInsert;
export type NewCanvasInvitation = typeof canvasInvitations.$inferInsert;
export type NewCurrency = typeof currencies.$inferInsert;
export type NewCurrencyExchangeRate = typeof currencyExchangeRates.$inferInsert;
export type NewValueCategory = typeof valueCategories.$inferInsert;
export type NewEntityType = typeof entityTypes.$inferInsert;
export type NewEntity = typeof entities.$inferInsert;
export type NewWalletCategory = typeof walletCategories.$inferInsert;
export type NewWallet = typeof wallets.$inferInsert;
export type NewAsset = typeof assets.$inferInsert;
export type NewIncomeResourceCategory = typeof incomeResourceCategories.$inferInsert;
export type NewIncomeResource = typeof incomeResources.$inferInsert;
export type NewIncomeTransaction = typeof incomeTransactions.$inferInsert;
export type NewIncomeForecast = typeof incomeForecasts.$inferInsert;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;
export type NewExpense = typeof expenses.$inferInsert;
export type NewSpentTransaction = typeof spentTransactions.$inferInsert;
export type NewConvertedTransaction = typeof convertedTransactions.$inferInsert;
export type NewDebtType = typeof debtTypes.$inferInsert;
export type NewDebt = typeof debts.$inferInsert;
export type NewDebtPayment = typeof debtPayments.$inferInsert;
export type NewBudget = typeof budgets.$inferInsert;
export type NewBudgetTracking = typeof budgetTracking.$inferInsert;
export type NewFinancialPlan = typeof financialPlans.$inferInsert;
export type NewFinancialGoal = typeof financialGoals.$inferInsert;
export type NewToBuyItem = typeof toBuyItems.$inferInsert;
export type NewNotification = typeof notifications.$inferInsert;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type NewAttachment = typeof attachments.$inferInsert;
export type NewAiConversation = typeof aiConversations.$inferInsert;
export type NewAiFinancialInsight = typeof aiFinancialInsights.$inferInsert;