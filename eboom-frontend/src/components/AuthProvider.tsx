"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import useQueryApi from "@/src/api/useQuery";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import type { User } from "@/src/types/common";
import { env } from "@/utils/env";
import { LANGUAGE_STORAGE_KEY } from "@/src/i18n/languages";

const USER_QUERY_KEY = ["user"];

const hasWindow = typeof window !== "undefined";
const isTestMode = env("NEXT_PUBLIC_TEST_MODE") === "true";
const MOCK_ACCESS_TOKEN = "test-mode-access-token";
const MOCK_REFRESH_TOKEN = "test-mode-refresh-token";

if (isTestMode && hasWindow) {
  console.log(
    "%cTESTING MODE ENABLED",
    "color: orange; font-weight: bold; font-size: 16px"
  );
}

export type AuthUser = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  emailVerified?: boolean;
  photoUrl?: string | null;
  phone?: string | null;
  age?: number | null;
};

export type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
  user?: AuthUser;
};

type LoginPayload = { email: string; password: string };
type SignupPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};
type RefreshPayload = { refreshToken: string };

function getStoredToken(key: string): string | null {
  if (!hasWindow) return null;

  if (isTestMode) {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return key === "accessToken" ? MOCK_ACCESS_TOKEN : MOCK_REFRESH_TOKEN;
    }
    return stored;
  }

  return window.localStorage.getItem(key);
}

function persistTokens(access: string, refresh: string) {
  if (!hasWindow) return;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

function clearStoredTokens() {
  if (!hasWindow) return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("canvasId");
  localStorage.removeItem(LANGUAGE_STORAGE_KEY);
}

export interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  isLoginPending: boolean;
  isSignupPending: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse | null>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<AuthResponse | null>;
  signOut: () => void;
  refreshAccessToken: () => Promise<string | null>;
  user: Partial<User> | null;
  userLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredToken("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    getStoredToken("refreshToken")
  );

  const { mutateAsync: refreshMutation } = useMutationApi<
    RefreshPayload,
    AuthResponse
  >(API_ROUTES.AUTH_REFRESH, { method: "post", hasToken: false, invalidateQueries: false });

  const {
    mutateAsync: loginMutation,
    isPending: isLoginPending,
  } = useMutationApi<LoginPayload, AuthResponse>(API_ROUTES.AUTH_LOGIN, {
    method: "post",
    hasToken: false,
    invalidateQueries: false,
  });

  const {
    mutateAsync: signupMutation,
    isPending: isSignupPending,
  } = useMutationApi<SignupPayload, AuthResponse>(API_ROUTES.AUTH_SIGNUP, {
    method: "post",
    hasToken: false,
    invalidateQueries: false,
  });

  const applyTokens = useCallback((access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    persistTokens(access, refresh);
  }, []);

  const seedUserCache = useCallback(
    (authUser: AuthUser | undefined) => {
      if (authUser) {
        queryClient.setQueryData(USER_QUERY_KEY, { user: authUser });
      }
    },
    [queryClient]
  );

  const signOut = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    clearStoredTokens();
    queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
  }, [queryClient]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) return null;
    try {
      const res = (await refreshMutation({ refreshToken })) as AuthResponse;
      if (res?.accessToken && res?.refreshToken) {
        applyTokens(res.accessToken, res.refreshToken);
        seedUserCache(res.user);
        return res.accessToken;
      }
      return null;
    } catch {
      signOut();
      return null;
    }
  }, [refreshToken, refreshMutation, applyTokens, seedUserCache, signOut]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const res = (await loginMutation({ email, password })) as AuthResponse;
      if (res?.accessToken && res?.refreshToken) {
        applyTokens(res.accessToken, res.refreshToken);
        seedUserCache(res.user);
        return res;
      }
      return null;
    },
    [loginMutation, applyTokens, seedUserCache]
  );

  const signup = useCallback(
    async ({
      firstName,
      lastName,
      email,
      password,
    }: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      const res = (await signupMutation({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      })) as AuthResponse;
      if (res?.accessToken && res?.refreshToken && res.user?.emailVerified) {
        applyTokens(res.accessToken, res.refreshToken);
        seedUserCache(res.user);
      }
      return res;
    },
    [signupMutation, applyTokens, seedUserCache]
  );

  const isAuthenticated = !!accessToken;

  const { data: userData, isLoading } = useQueryApi<{
    user: Partial<User>;
  }>(API_ROUTES.USERS_GET_ME, {
    queryKey: USER_QUERY_KEY,
    hasToken: true,
    enabled: isAuthenticated,
    auth: {
      accessToken,
      refreshToken,
      refresh: refreshAccessToken,
    },
  });

  const user = userData?.user ?? null;
  const userLoading = isAuthenticated && !user && isLoading;

  const guestOnlyRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const isGuestOnlyRoute = guestOnlyRoutes.includes(pathname);

  useEffect(() => {
    const publicRoutes = [
      "/",
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      "/confirm-email",
    ];
    const isPublic = publicRoutes.includes(pathname);

    if (isAuthenticated && isGuestOnlyRoute) {
      if (user?.emailVerified === false) {
        router.replace("/confirm-email");
      } else if (user?.emailVerified || !userLoading) {
        router.replace("/dashboard");
      }
      return;
    }

    if (
      isAuthenticated &&
      user?.emailVerified === false &&
      !isPublic
    ) {
      router.replace("/confirm-email");
      return;
    }

    if (!isAuthenticated && !isPublic) {
      if (hasWindow) {
        localStorage.setItem("redirectAfterLogin", pathname);
      }
      router.push("/login");
    }
  }, [pathname, router, isAuthenticated, isGuestOnlyRoute, user?.emailVerified, userLoading]);

  const contextValue: AuthContextType = {
    accessToken,
    refreshToken,
    isLoginPending,
    isSignupPending,
    login,
    signup,
    signOut,
    refreshAccessToken,
    user,
    userLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {isAuthenticated && isGuestOnlyRoute ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
