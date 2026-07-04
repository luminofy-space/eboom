import { env } from "@/utils/env";

export function resolveApiUrl(url: string): string {
  return url.startsWith("http") ? url : `${env("NEXT_PUBLIC_BASE_URL")}${url}`;
}
