const API_ROUTES = {
  AUTH_REFRESH: "/api/auth/refresh/",
  AUTH_LOGIN: "/api/auth/login/",
  AUTH_SIGNUP: "/api/auth/signup/",
  USERS_GET_ME: "/api/auth/user-info/",
  CURRENCIES_METADATA: '/api/currency/',
  USERS_UPDATE_PROFILE_IMAGE: "/api/auth/change-photo/",
  INCOME_BASE: '/api/income/'
} as const;

export default API_ROUTES;
