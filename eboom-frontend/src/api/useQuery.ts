import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuth } from "../hooks/useAuth";
import { snakeToCamel } from "./utils";

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
    needBaseUrl?: boolean;
  },
  axiosProp?: AxiosRequestConfig
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
    needBaseUrl = true,
  } = options || {};

  const { accessToken, logout } = useAuth();

  const buildUrl = () => {
    let finalUrl = needBaseUrl ? `${process.env.NEXT_PUBLIC_BASE_URL}${url}` : url;

    if (urlParams?.length) finalUrl += "/" + urlParams.join("/");

    return finalUrl;
  };

  const fetcher = async (): Promise<T> => {
    if (!hasAccess) throw new Error("Forbidden");

    const finalUrl = buildUrl();

    const requestHeaders: Record<string, string> = { ...headers };

    if (hasToken && accessToken) {
      requestHeaders["Authorization"] = `Bearer ${accessToken}`;
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
      if (status === 401 || status === 403) {
        logout();
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
  });
};

export default useQueryApi;
