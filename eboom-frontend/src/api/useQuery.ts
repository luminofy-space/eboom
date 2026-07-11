import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import axios, { type AxiosError, type AxiosRequestConfig } from "@/src/types/axios";
import { useContext } from "react";
import { AuthContext } from "@/src/components/AuthProvider";
import { snakeToCamel } from "./utils";
import { resolveApiUrl } from "./resolveApiUrl";

type AuthOptions = {
  accessToken?: string | null;
  refreshToken?: string | null;
  refresh?: () => Promise<string | null>;
};

const useQueryApi = <T>(
  url: string,
  options?: {
    queryKey: Array<unknown>;
    urlParams?: Array<string>;
    headers?: Record<string, string>;
    body?: string | FormData;
    hasAccess?: boolean | undefined;
    hasToken?: boolean;
    staleTime?: number;
    refetchInterval?: number;
    enabled?: boolean;
    retry?: number;
    refetchOnWindowFocus?: boolean;
    placeholderData?: UseQueryOptions<T, Error, T, readonly unknown[]>["placeholderData"];
    auth?: AuthOptions;
  },
  axiosProp?: Partial<AxiosRequestConfig>
) => {
  const {
    queryKey,
    urlParams,
    headers,
    body,
    hasAccess = true,
    hasToken = true,
    staleTime = 0,
    refetchInterval,
    enabled = true,
    retry = 1,
    refetchOnWindowFocus = false,
    placeholderData,
    auth: optionsAuth,
  } = options || {};

  const authContext = useContext(AuthContext);

  const accessToken = hasToken
    ? optionsAuth?.accessToken ?? authContext?.accessToken ?? null
    : null;
  const refreshToken = hasToken
    ? optionsAuth?.refreshToken ?? authContext?.refreshToken ?? null
    : null;
  const refreshFn = hasToken
    ? optionsAuth?.refresh ?? authContext?.refreshAccessToken ?? null
    : null;

  const buildUrl = () => {
    let finalUrl = resolveApiUrl(url);

    if (urlParams?.length) finalUrl += "/" + urlParams.join("/");

    return finalUrl;
  };

  const fetcher = async (): Promise<T> => {
    if (!hasAccess) throw new Error("Forbidden");

    const finalUrl = buildUrl();
    const requestHeaders: Record<string, string> = { ...headers };

    const token = accessToken;
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config: AxiosRequestConfig = {
      method: body ? "post" : "get",
      url: finalUrl,
      data: body,
      headers: requestHeaders,
      ...axiosProp,
    };

    try {
      const res = await axios(config);
      return snakeToCamel(res.data) as T;
    } catch (err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;

      if (status === 401 && hasToken && refreshToken && refreshFn) {
        const newToken = await refreshFn();

        if (newToken) {
          const retryRes = await axios({
            ...config,
            headers: {
              ...requestHeaders,
              Authorization: `Bearer ${newToken}`,
            },
          });
          return snakeToCamel(retryRes.data) as T;
        }
      }

      if ((status === 401 || status === 403) && authContext) {
        authContext.signOut();
      }
      throw err;
    }
  };

  return useQuery<T>({
    queryKey: queryKey ?? [url],
    queryFn: fetcher,
    staleTime,
    refetchInterval,
    enabled: enabled && hasAccess,
    retry,
    refetchOnWindowFocus,
    ...(placeholderData !== undefined ? { placeholderData } : {}),
  });
};

export default useQueryApi;
