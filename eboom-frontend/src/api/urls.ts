const API_ROUTES = {
  // ============================================================================
  // AUTH
  // ============================================================================
  AUTH_REFRESH: "/api/auth/refresh/",
  AUTH_LOGIN: "/api/auth/login/",
  AUTH_SIGNUP: "/api/auth/signup/",
  AUTH_VERIFY_EMAIL: "/api/auth/verify-email",
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
  CANVASES_GET: (id: number) => `/api/canvases/${id}/`,
  CANVASES_UPDATE: (id: number) => `/api/canvases/${id}/`,
  CANVASES_DELETE: (id: number) => `/api/canvases/${id}/`,

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

  // Canvas-scoped Expenses
  CANVASES_EXPENSES_LIST: (canvasId: number) => `/api/canvases/${canvasId}/expenses/`,
  CANVASES_EXPENSES_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/expenses/`,

  // Canvas-scoped Incomes
  CANVASES_INCOMES_LIST: (canvasId: number) => `/api/canvases/${canvasId}/incomes/`,
  CANVASES_INCOMES_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/incomes/`,

  // Canvas-scoped Wallets
  CANVASES_WALLETS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,
  CANVASES_WALLETS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,

  CANVAS_SUMMARY: (canvasId: number) => `/api/canvases/${canvasId}/summary`,

  // Canvas whiteboard
  CANVAS_WHITEBOARD: (canvasId: number) => `/api/canvases/${canvasId}/whiteboard/`,
  CANVAS_WHITEBOARD_VIEWPORT: (canvasId: number) => `/api/canvases/${canvasId}/whiteboard/viewport`,
  CANVAS_WHITEBOARD_NODES: (canvasId: number) => `/api/canvases/${canvasId}/whiteboard/nodes`,
  CANVAS_WHITEBOARD_NODE: (canvasId: number, entityType: string, entityId: number) =>
    `/api/canvases/${canvasId}/whiteboard/nodes/${entityType}/${entityId}`,

  // ============================================================================
  // INCOMES
  // ============================================================================
  INCOMES_GET: (id: number) => `/api/income/${id}/`,
  INCOMES_UPDATE: (id: number) => `/api/income/${id}/`,
  INCOMES_DELETE: (id: number) => `/api/income/${id}/`,

  // Income Entries
  INCOME_ENTRIES_LIST: (incomeId: number) => `/api/income/${incomeId}/entries/`,
  INCOME_ENTRIES_CREATE: (incomeId: number) => `/api/income/${incomeId}/entries/`,
  INCOME_ENTRIES_DELETE: (id: number) => `/api/income/entries/${id}/`,

  // Income Categories
  INCOME_CATEGORIES: '/api/income/categories',
  INCOME_CATEGORIES_CREATE: '/api/income/categories',
  INCOME_CATEGORIES_UPDATE: (id: number) => `/api/income/categories/${id}`,
  INCOME_CATEGORIES_DELETE: (id: number) => `/api/income/categories/${id}`,

  // ============================================================================
  // WALLETS
  // ============================================================================
  WALLETS_GET: (id: number) => `/api/wallets/${id}/`,
  WALLETS_UPDATE: (id: number) => `/api/wallets/${id}/`,
  WALLETS_DELETE: (id: number) => `/api/wallets/${id}/`,
  SUB_WALLETS_LIST: (walletId: number) => `/api/wallets/${walletId}/sub-wallets/`,
  WALLET_ENTRIES: (id: number) => `/api/wallets/${id}/income-entries/`,
  WALLET_PAYMENTS: (id: number) => `/api/wallets/${id}/expense-payments/`,
  WALLET_TRANSACTIONS: (id: number) => `/api/wallets/${id}/transactions/`,

  // ============================================================================
  // EXPENSES
  // ============================================================================
  EXPENSES_GET: (id: number) => `/api/expenses/${id}/`,
  EXPENSES_UPDATE: (id: number) => `/api/expenses/${id}/`,
  EXPENSES_DELETE: (id: number) => `/api/expenses/${id}/`,

  // Expense Payments
  EXPENSE_PAYMENTS_LIST: (expenseId: number) => `/api/expenses/${expenseId}/payments/`,
  EXPENSE_PAYMENTS_CREATE: (expenseId: number) => `/api/expenses/${expenseId}/payments/`,
  EXPENSE_PAYMENTS_DELETE: (id: number) => `/api/expenses/payments/${id}/`,

  WALLET_CATEGORIES: '/api/wallet/categories',

  // Expense Categories
  EXPENSE_CATEGORIES: '/api/expense/categories',
} as const;

export default API_ROUTES;
