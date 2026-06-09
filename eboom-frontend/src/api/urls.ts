const API_ROUTES = {
  // ============================================================================
  // AUTH
  // ============================================================================
  AUTH_REFRESH: "/api/auth/refresh/",
  AUTH_LOGIN: "/api/auth/login/",
  AUTH_SIGNUP: "/api/auth/signup/",
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

  // Canvas-scoped Expenses
  CANVASES_EXPENSES_LIST: (canvasId: number) => `/api/canvases/${canvasId}/expenses/`,
  CANVASES_EXPENSES_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/expenses/`,

  // Canvas-scoped Incomes
  CANVASES_INCOMES_LIST: (canvasId: number) => `/api/canvases/${canvasId}/incomes/`,
  CANVASES_INCOMES_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/incomes/`,

  // Canvas-scoped Wallets
  CANVASES_WALLETS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,
  CANVASES_WALLETS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,

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

  // ============================================================================
  // EXPENSES
  // ============================================================================
  EXPENSES_GET: (id: number) => `/api/expenses/${id}/`,
  EXPENSES_UPDATE: (id: number) => `/api/expenses/${id}/`,
  EXPENSES_DELETE: (id: number) => `/api/expenses/${id}/`,

  WALLET_CATEGORIES: '/api/wallet/categories',

  // Expense Categories
  EXPENSE_CATEGORIES: '/api/expense/categories',
} as const;

export default API_ROUTES;
