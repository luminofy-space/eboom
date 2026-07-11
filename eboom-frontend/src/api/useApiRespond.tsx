import type { AxiosError, AxiosResponse } from "@/src/types/axios";
import {
  errorKeyFromStatus,
  notifyError,
  notifySuccess,
} from "@/src/lib/notify";

export interface ApiErrorPayload {
  errorKey?: string;
  params?: Record<string, string | number>;
  errors?: Record<string, string>;
  error?: string;
  message?: string;
}

export const useApiRespond = () => {
  const handleError = (error: AxiosError) => {
    const data = error.response?.data as ApiErrorPayload | undefined;
    const errorKey =
      data?.errorKey ?? errorKeyFromStatus(error.response?.status);
    notifyError(errorKey, data?.params);
  };

  const handleSuccess = (
    _data: AxiosResponse,
    options?: { successKey?: string; notify?: boolean }
  ) => {
    if (!options?.notify || !options.successKey) return;
    notifySuccess(options.successKey);
  };

  return {
    handleError,
    handleSuccess,
  };
};
