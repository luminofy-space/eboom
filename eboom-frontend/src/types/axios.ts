import axios from "axios";

export default axios;

export type AxiosRequestConfig<T = unknown> = Parameters<
  typeof axios.request<T>
>[0];

export type AxiosResponse<T = unknown> = Awaited<
  ReturnType<typeof axios.request<T>>
>;

export type AxiosError<T = unknown, D = unknown> = Error & {
  isAxiosError: boolean;
  code?: string;
  config?: AxiosRequestConfig<D>;
  request?: unknown;
  response?: AxiosResponse<T>;
  status?: number;
};

export function isAxiosError<T = unknown>(
  payload: unknown
): payload is AxiosError<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "isAxiosError" in payload &&
    (payload as AxiosError).isAxiosError === true
  );
}
