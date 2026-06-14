"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import useQueryApi from "@/src/api/useQuery";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import { User } from "@backend/db/schema";
import { env } from "@/utils/env";

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
}

export interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
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

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredToken("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    getStoredToken("refreshToken")
  );
  const [loading, setLoading] = useState(false);

  const { mutateAsync: refreshMutation } = useMutationApi<AuthResponse>(
    API_ROUTES.AUTH_REFRESH,
    { method: "post", hasToken: false }
  );

  const { mutateAsync: loginMutation } = useMutationApi<AuthResponse>(
    API_ROUTES.AUTH_LOGIN,
    { method: "post", hasToken: false }
  );

  const { mutateAsync: signupMutation } = useMutationApi<AuthResponse>(
    API_ROUTES.AUTH_SIGNUP,
    { method: "post", hasToken: false }
  );

  const applyTokens = useCallback((access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    persistTokens(access, refresh);
  }, []);

  const signOut = useCallback(() => {
    setLoading(true);
    setAccessToken(null);
    setRefreshToken(null);
    clearStoredTokens();
    setLoading(false);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) return null;
    try {
      const res = (await refreshMutation({ refreshToken })) as AuthResponse;
      if (res?.accessToken && res?.refreshToken) {
        applyTokens(res.accessToken, res.refreshToken);
        return res.accessToken;
      }
      return null;
    } catch {
      signOut();
      return null;
    }
  }, [refreshToken, refreshMutation, applyTokens, signOut]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading(true);
      try {
        const res = (await loginMutation({ email, password })) as AuthResponse;
        if (res?.accessToken && res?.refreshToken) {
          applyTokens(res.accessToken, res.refreshToken);
          return res;
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loginMutation, applyTokens]
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
      setLoading(true);
      try {
        const res = (await signupMutation({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        })) as AuthResponse;
        if (res?.accessToken && res?.refreshToken) {
          applyTokens(res.accessToken, res.refreshToken);
        }
        return res;
      } finally {
        setLoading(false);
      }
    },
    [signupMutation, applyTokens]
  );

  const isAuthenticated = !!accessToken;

  const { data: userData, isLoading: userLoading } = useQueryApi<{
    user: Partial<User>;
  }>(API_ROUTES.USERS_GET_ME, {
    queryKey: ["user"],
    hasToken: true,
    enabled: isAuthenticated,
    auth: {
      accessToken,
      refreshToken,
      refresh: refreshAccessToken,
    },
  });

  const user = userData?.user ?? null;

  useEffect(() => {
    if (loading) return;

    const publicRoutes = [
      "/login",
      "/signup",
      "/forgot-password",
      "/verify-email",
      "/confirm-email",
    ];
    const isPublic = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublic) {
      if (hasWindow) {
        localStorage.setItem("redirectAfterLogin", pathname);
      }
      router.push("/login");
    }
  }, [loading, pathname, router, isAuthenticated]);

  const contextValue: AuthContextType = {
    accessToken,
    refreshToken,
    loading,
    login,
    signup,
    signOut,
    refreshAccessToken,
    user,
    userLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <div>Loading...</div> : children}
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
