import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useApiRespond } from "./useApiRespond";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { snakeToCamel } from "./utils";
import { IHasId } from "../types/hasId";

const hasWindow = typeof window !== "undefined";

const getStoredToken = (key: string) => {
  if (!hasWindow) return null;
  return window.localStorage.getItem(key);
};

export const useMutationApi = <T extends IHasId>(
  url: string,
  options?: {
    urlParams?: Array<string>;
    staticParams?: string;
    method?: "post" | "patch" | "put" | "delete" | "get";
    headers?: Record<string, string>;
    body?: string | FormData;
    rerouteOnNotFound?: boolean;
    hasToken?: boolean;
    returnWholeData?: boolean;
    initialValue?: T;
    timeout?: number;
    retry?: number;
    needBaseUrl?: boolean;
    useAuthContext?: boolean;
    auth?: {
      accessToken?: string | null;
      refreshToken?: string | null;
      refresh?: () => Promise<string | null>;
    };
  },
  axiosProp?: AxiosRequestConfig
) => {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useApiRespond();
  const optionHeaders = options?.headers;
  const hasToken = options?.hasToken ?? true;
  const optionBody = options?.body;
  const method = options?.method ?? "post";
  const urlParams = options?.urlParams;
  const staticParams = options?.staticParams;
  const timeout = options?.timeout ?? 15000;
  const retry = options?.retry ?? 0;
  const needBaseUrl = options?.needBaseUrl ?? true;
  const authAccessToken =
    options?.auth?.accessToken ?? (hasToken ? getStoredToken("accessToken") : null);
  const authRefreshToken =
    options?.auth?.refreshToken ?? getStoredToken("refreshToken");
  const authRefreshFn = options?.auth?.refresh ?? (async () => null);

  const [fieldError, setFieldError] = useState<Record<string, string>>();
  const [generalError, setGeneralError] = useState<Record<string, string>>();

  // ----------------------- URL builder -----------------------
  const buildUrl = () => {
    let finalUrl = needBaseUrl ? `${process.env.NEXT_PUBLIC_BASE_URL}${url}` : url;

    if (urlParams?.length) finalUrl += "/" + urlParams.join("/");
    if (staticParams) finalUrl += `/${staticParams}`;

    return finalUrl;
  };

  // ----------------------- API Caller -----------------------
  const callApi = async (payload?: unknown) => {
    const finalUrl = buildUrl();

    const headers: Record<string, string> = { ...optionHeaders };

    if (hasToken && authAccessToken) {
      headers["Authorization"] = `Bearer ${authAccessToken}`;
    }

    const config: AxiosRequestConfig = {
      url: finalUrl,
      method,
      data: optionBody || payload,
      timeout,
      headers,
      ...axiosProp,
    };

    try {
      const res = await axios(config);

      const parsed = snakeToCamel(res.data);
      handleSuccess(parsed);
      return options?.returnWholeData ? parsed : parsed;

    } catch (err: unknown) {
      const axiosErr = err as AxiosError;

      // ----------------------- Refresh Token Flow -----------------------
      if (axiosErr.response?.status === 401 && authRefreshToken && authRefreshFn) {
        const newToken = await authRefreshFn();

        if (newToken) {
          config.headers = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };
          const retryRes = await axios(config);
          return snakeToCamel(retryRes.data);
        }
      }

      // ----------------------- Error Parsing -----------------------
      const data = axiosErr.response?.data as Record<string, unknown>;

      if (data?.errors) setFieldError(data.errors as Record<string, string>);
      if (data?.message) setGeneralError({ message: data.message as string });

      handleError(axiosErr);
      throw axiosErr;
    }
  };

  // ----------------------- Mutation Hook -----------------------
  const mutation = useMutation({
    mutationFn: callApi,
    retry,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return {
    ...mutation,
    fieldError,
    generalError,
  };
};
