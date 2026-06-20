import axios, { type AxiosRequestConfig } from "axios";
import { env } from "@/utils/env";

const hasWindow = typeof window !== "undefined";

export function whiteboardApiUrl(path: string): string {
  return `${env("NEXT_PUBLIC_BASE_URL")}${path}`;
}

export function getWhiteboardAuthHeaders(): Record<string, string> {
  const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function whiteboardApiDelete(path: string): Promise<void> {
  await axios.delete(whiteboardApiUrl(path), { headers: getWhiteboardAuthHeaders() });
}

export async function whiteboardApiPut<T>(path: string, data: T, config?: AxiosRequestConfig): Promise<void> {
  await axios.put(whiteboardApiUrl(path), data, {
    headers: getWhiteboardAuthHeaders(),
    ...config,
  });
}
