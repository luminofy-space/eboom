const API_ROUTES = {
  // ============================================================================
  // AUTH
  // ============================================================================
  AUTH_REFRESH: "/api/auth/refresh/",
  AUTH_LOGIN: "/api/auth/login/",
  AUTH_SIGNUP: "/api/auth/signup/",
  AUTH_VERIFY_EMAIL: "/api/auth/verify-email",
  AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password/",
  AUTH_RESET_PASSWORD: "/api/auth/reset-password/",
  USERS_GET_ME: "/api/auth/user-info/",
  USERS_UPDATE_PROFILE_IMAGE: "/api/auth/change-photo/",

  // ============================================================================
  // CURRENCIES
  // ============================================================================
  CURRENCIES_METADATA: '/api/currency/',

  // ============================================================================
  // CANVASES
  // ============================================================================
  CANVASES_LIST: '/api/canvases/',
  CANVASES_CREATE: '/api/canvases/',
  CANVASES_GET: (canvasId: number) => `/api/canvases/${canvasId}/`,
  CANVASES_UPDATE: (canvasId: number) => `/api/canvases/${canvasId}/`,
  CANVASES_DELETE: (canvasId: number) => `/api/canvases/${canvasId}/`,

  // Canvas members
  CANVAS_MEMBERS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/members/`,
  CANVAS_MEMBERS_LOOKUP: (canvasId: number) => `/api/canvases/${canvasId}/members/lookup/`,
  CANVAS_MEMBERS_INVITE: (canvasId: number) => `/api/canvases/${canvasId}/members/invitations/`,
  CANVAS_MEMBERS_PENDING_INVITATIONS: (canvasId: number) =>
    `/api/canvases/${canvasId}/members/invitations/`,
  CANVAS_MEMBERS_SUGGESTIONS: (canvasId: number) =>
    `/api/canvases/${canvasId}/members/suggestions/`,
  CANVAS_MEMBERS_UPDATE: (canvasId: number, memberId: number) =>
    `/api/canvases/${canvasId}/members/${memberId}/`,
  CANVAS_MEMBERS_REMOVE: (canvasId: number, memberId: number) =>
    `/api/canvases/${canvasId}/members/${memberId}/`,
  CANVAS_MEMBERS_LEAVE: (canvasId: number) => `/api/canvases/${canvasId}/members/leave/`,

  // Canvas invitations
  CANVAS_INVITATIONS_SENT: '/api/canvas-invitations/sent/',
  CANVAS_INVITATIONS_RECEIVED: '/api/canvas-invitations/received/',
  CANVAS_INVITATIONS_ACCEPT: (id: number) => `/api/canvas-invitations/${id}/accept/`,
  CANVAS_INVITATIONS_DECLINE: (id: number) => `/api/canvas-invitations/${id}/decline/`,
  CANVAS_INVITATIONS_CANCEL: (id: number) => `/api/canvas-invitations/${id}/`,
  CANVAS_ROLES: '/api/roles/canvas/',

  // Canvas-scoped expenses
  CANVASES_EXPENSES_LIST: (canvasId: number) => `/api/canvases/${canvasId}/expenses/`,
  CANVASES_EXPENSES_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/expenses/`,
  EXPENSES_GET: (canvasId: number, expenseId: number) =>
    `/api/canvases/${canvasId}/expenses/${expenseId}/`,
  EXPENSES_UPDATE: (canvasId: number, expenseId: number) =>
    `/api/canvases/${canvasId}/expenses/${expenseId}/`,
  EXPENSES_DELETE: (canvasId: number, expenseId: number) =>
    `/api/canvases/${canvasId}/expenses/${expenseId}/`,
  EXPENSE_PAYMENTS_LIST: (canvasId: number, expenseId: number) =>
    `/api/canvases/${canvasId}/expenses/${expenseId}/payments/`,
  EXPENSE_PAYMENTS_CREATE: (canvasId: number, expenseId: number) =>
    `/api/canvases/${canvasId}/expenses/${expenseId}/payments/`,
  EXPENSE_PAYMENTS_UPDATE: (canvasId: number, paymentId: number) =>
    `/api/canvases/${canvasId}/expenses/payments/${paymentId}/`,
  EXPENSE_PAYMENTS_DELETE: (canvasId: number, paymentId: number) =>
    `/api/canvases/${canvasId}/expenses/payments/${paymentId}/`,

  // Canvas-scoped incomes
  CANVASES_INCOMES_LIST: (canvasId: number) => `/api/canvases/${canvasId}/incomes/`,
  CANVASES_INCOMES_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/incomes/`,
  INCOMES_GET: (canvasId: number, incomeId: number) =>
    `/api/canvases/${canvasId}/incomes/${incomeId}/`,
  INCOMES_UPDATE: (canvasId: number, incomeId: number) =>
    `/api/canvases/${canvasId}/incomes/${incomeId}/`,
  INCOMES_DELETE: (canvasId: number, incomeId: number) =>
    `/api/canvases/${canvasId}/incomes/${incomeId}/`,
  INCOME_ENTRIES_LIST: (canvasId: number, incomeId: number) =>
    `/api/canvases/${canvasId}/incomes/${incomeId}/entries/`,
  INCOME_ENTRIES_CREATE: (canvasId: number, incomeId: number) =>
    `/api/canvases/${canvasId}/incomes/${incomeId}/entries/`,
  INCOME_ENTRIES_UPDATE: (canvasId: number, entryId: number) =>
    `/api/canvases/${canvasId}/incomes/entries/${entryId}/`,
  INCOME_ENTRIES_DELETE: (canvasId: number, entryId: number) =>
    `/api/canvases/${canvasId}/incomes/entries/${entryId}/`,

  // Canvas-scoped wallets
  CANVASES_WALLETS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,
  CANVASES_WALLETS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,
  WALLETS_GET: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/`,
  WALLETS_UPDATE: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/`,
  WALLETS_DELETE: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/`,
  SUB_WALLETS_LIST: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/sub-wallets/`,
  WALLET_ENTRIES: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/income-entries/`,
  WALLET_PAYMENTS: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/expense-payments/`,
  WALLET_TRANSFERS: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/transfers/`,
  WALLET_TRANSACTIONS: (canvasId: number, walletId: number) =>
    `/api/canvases/${canvasId}/wallets/${walletId}/transactions/`,

  // Canvas-scoped assets
  CANVASES_ASSETS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/assets/`,
  CANVASES_ASSETS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/assets/`,
  ASSETS_GET: (canvasId: number, assetId: number) =>
    `/api/canvases/${canvasId}/assets/${assetId}/`,
  ASSETS_UPDATE: (canvasId: number, assetId: number) =>
    `/api/canvases/${canvasId}/assets/${assetId}/`,
  ASSETS_DELETE: (canvasId: number, assetId: number) =>
    `/api/canvases/${canvasId}/assets/${assetId}/`,

  // Canvas-scoped transfers
  CANVAS_TRANSFERS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/transfers/`,
  TRANSFERS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/transfers/`,
  TRANSFERS_GET: (canvasId: number, transferId: number) =>
    `/api/canvases/${canvasId}/transfers/${transferId}/`,
  TRANSFERS_UPDATE: (canvasId: number, transferId: number) =>
    `/api/canvases/${canvasId}/transfers/${transferId}/`,
  TRANSFERS_DELETE: (canvasId: number, transferId: number) =>
    `/api/canvases/${canvasId}/transfers/${transferId}/`,

  CANVAS_SUMMARY: (canvasId: number) => `/api/canvases/${canvasId}/summary`,
  CANVAS_TRANSACTIONS: (canvasId: number) => `/api/canvases/${canvasId}/transactions`,

  CALENDAR_EVENTS: (canvasId: number) => `/api/calendar/${canvasId}`,

  NOTIFICATIONS_OVERDUE: '/api/notifications/overdue',

  // Canvas whiteboard
  CANVAS_WHITEBOARD: (canvasId: number) => `/api/canvases/${canvasId}/whiteboard/`,
  CANVAS_WHITEBOARD_VIEWPORT: (canvasId: number) => `/api/canvases/${canvasId}/whiteboard/viewport`,
  CANVAS_WHITEBOARD_NODES: (canvasId: number) => `/api/canvases/${canvasId}/whiteboard/nodes`,
  CANVAS_WHITEBOARD_NODE: (canvasId: number, entityType: string, entityId: number) =>
    `/api/canvases/${canvasId}/whiteboard/nodes/${entityType}/${entityId}`,

  // Income categories
  INCOME_CATEGORIES: '/api/income/categories',
  INCOME_CATEGORIES_CREATE: '/api/income/categories',
  INCOME_CATEGORIES_UPDATE: (id: number) => `/api/income/categories/${id}`,
  INCOME_CATEGORIES_DELETE: (id: number) => `/api/income/categories/${id}`,

  WALLET_CATEGORIES: '/api/wallet/categories',
  EXPENSE_CATEGORIES: '/api/expense/categories',
  ASSET_CATEGORIES: '/api/asset/categories',

  // ============================================================================
  // BUDGET & PLANNING
  // ============================================================================
  CANVAS_BUDGETS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/budgets`,
  CANVAS_BUDGETS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/budgets`,
  CANVAS_BUDGETS_GET: (canvasId: number, budgetId: number) =>
    `/api/canvases/${canvasId}/budgets/${budgetId}`,
  CANVAS_BUDGETS_UPDATE: (canvasId: number, budgetId: number) =>
    `/api/canvases/${canvasId}/budgets/${budgetId}`,
  CANVAS_BUDGETS_DELETE: (canvasId: number, budgetId: number) =>
    `/api/canvases/${canvasId}/budgets/${budgetId}`,
  CANVAS_BUDGETS_PROGRESS: (canvasId: number, budgetId: number) =>
    `/api/canvases/${canvasId}/budgets/${budgetId}/progress`,
  CANVAS_BUDGETS_SUGGESTIONS: (canvasId: number) =>
    `/api/canvases/${canvasId}/budgets/suggestions`,
  CANVAS_BUDGETS_SUMMARY: (canvasId: number) => `/api/canvases/${canvasId}/budgets/summary`,
  CANVAS_BUDGETS_CURRENCY_USAGE: (canvasId: number) =>
    `/api/canvases/${canvasId}/budgets/currency-usage`,
  CANVAS_BUDGETS_FORECAST: (canvasId: number) => `/api/canvases/${canvasId}/budgets/forecast`,
  CANVAS_SAVINGS_GOALS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/savings-goals`,
  CANVAS_SAVINGS_GOALS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/savings-goals`,
  CANVAS_SAVINGS_GOALS_UPDATE: (canvasId: number, goalId: number) =>
    `/api/canvases/${canvasId}/savings-goals/${goalId}`,
  CANVAS_SAVINGS_GOALS_DELETE: (canvasId: number, goalId: number) =>
    `/api/canvases/${canvasId}/savings-goals/${goalId}`,

  // ============================================================================
  // AI INSIGHTS
  // ============================================================================
  CANVAS_AI_INSIGHT_PROFILE: (canvasId: number) =>
    `/api/canvases/${canvasId}/ai-insight-profile`,
  CANVAS_AI_INSIGHTS: (canvasId: number) => `/api/canvases/${canvasId}/ai-insights`,
  CANVAS_AI_INSIGHTS_GENERATE: (canvasId: number) =>
    `/api/canvases/${canvasId}/ai-insights/generate`,

  // ============================================================================
  // AI CHAT
  // ============================================================================
  CANVAS_AI_CHAT: (canvasId: number) => `/api/canvases/${canvasId}/ai-chat`,
  CANVAS_AI_CHAT_MESSAGES: (canvasId: number) =>
    `/api/canvases/${canvasId}/ai-chat/messages`,
} as const;

export default API_ROUTES;
