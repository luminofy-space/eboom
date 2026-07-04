import axios, { type AxiosRequestConfig } from "axios";
import { resolveApiUrl } from "@/src/api/resolveApiUrl";

const hasWindow = typeof window !== "undefined";

export function getWhiteboardAuthHeaders(): Record<string, string> {
  const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function whiteboardApiDelete(path: string): Promise<void> {
  await axios.delete(resolveApiUrl(path), { headers: getWhiteboardAuthHeaders() });
}

export async function whiteboardApiPut<T>(path: string, data: T, config?: AxiosRequestConfig): Promise<void> {
  await axios.put(resolveApiUrl(path), data, {
    headers: getWhiteboardAuthHeaders(),
    ...config,
  });
}
