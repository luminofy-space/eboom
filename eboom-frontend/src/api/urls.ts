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

  // Canvas-scoped Income Resources
  CANVASES_INCOME_RESOURCES_LIST: (canvasId: number) => `/api/canvases/${canvasId}/income-resources/`,
  CANVASES_INCOME_RESOURCES_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/income-resources/`,

  // Canvas-scoped Wallets
  CANVASES_WALLETS_LIST: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,
  CANVASES_WALLETS_CREATE: (canvasId: number) => `/api/canvases/${canvasId}/wallets/`,

  // ============================================================================
  // INCOME RESOURCES
  // ============================================================================
  INCOME_RESOURCES_GET: (id: number) => `/api/income/resources/${id}/`,
  INCOME_RESOURCES_UPDATE: (id: number) => `/api/income/resources/${id}/`,
  INCOME_RESOURCES_DELETE: (id: number) => `/api/income/resources/${id}/`,

  // Income Transactions
  INCOME_TRANSACTIONS_LIST: (resourceId: number) => `/api/income/resources/${resourceId}/transactions/`,
  INCOME_TRANSACTIONS_CREATE: (resourceId: number) => `/api/income/resources/${resourceId}/transactions/`,
  INCOME_TRANSACTIONS_GET: (id: number) => `/api/income/transactions/${id}/`,
  INCOME_TRANSACTIONS_UPDATE: (id: number) => `/api/income/transactions/${id}/`,
  INCOME_TRANSACTIONS_DELETE: (id: number) => `/api/income/transactions/${id}/`,

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

  // ============================================================================
  // DEPRECATED (kept for backwards compatibility)
  // ============================================================================
  INCOME_BASE: '/api/income/',
} as const;

export default API_ROUTES;
