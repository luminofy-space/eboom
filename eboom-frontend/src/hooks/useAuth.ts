"use client";

import { useState, useCallback } from "react";
import API_ROUTES from "../api/urls";
import { useMutationApi } from "../api/useMutation";
import { IHasId } from "../types/hasId";

const hasWindow = typeof window !== "undefined";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
} & IHasId;

const getStoredToken = (key: string) => {
  if (!hasWindow) {
    return null;
  }

  return window.localStorage.getItem(key);
};

export const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredToken("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    getStoredToken("refreshToken")
  );
  const [loading, setLoading] = useState(false);

  const { mutateAsync: refreshMutation } = useMutationApi<AuthResponse>(
    API_ROUTES.AUTH_REFRESH,
    {
      method: "post",
      hasToken: false,
      useAuthContext: false,
    }
  );

  const { mutateAsync: loginMutation } = useMutationApi<AuthResponse>(
    API_ROUTES.AUTH_LOGIN,
    {
      method: "post",
      hasToken: false,
      useAuthContext: false,
    }
  );

  const { mutateAsync: signupMutation } = useMutationApi<AuthResponse>(
    API_ROUTES.AUTH_SIGNUP,
    {
      method: "post",
      hasToken: false,
      useAuthContext: false,
    }
  );

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading(true);
      try {
        const res = await loginMutation({ email, password });
        if (res?.accessToken && res?.refreshToken) {
          setAccessToken(res?.accessToken);
          setRefreshToken(res?.refreshToken);
          if (hasWindow) {
            localStorage.setItem("accessToken", res?.accessToken);
            localStorage.setItem("refreshToken", res?.refreshToken);
          }
          return res;
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loginMutation]
  );

  const logout = useCallback(() => {
    setLoading(true);
    setAccessToken(null);
    setRefreshToken(null);
    if (hasWindow) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!refreshToken) return null;
    setLoading(true);
    try {
      const res = await refreshMutation({ refreshToken });
      if (res?.accessToken && res?.refreshToken) {
        setAccessToken(res?.accessToken);
        setRefreshToken(res?.refreshToken);
        if (hasWindow) {
          localStorage.setItem("accessToken", res?.accessToken);
          localStorage.setItem("refreshToken", res?.refreshToken);
        }
        return res;
      }
      return null;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshToken, refreshMutation, logout]);

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
        const res = await signupMutation({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
        });
        return res;
      } finally {
        setLoading(false);
      }
    },
    [signupMutation]
  );

  return {
    accessToken,
    refreshToken,
    loading,
    login,
    logout,
    signup,
    refresh,
  };
};
