export function buildUrlWithParams(
  baseUrl: string,
  params: Record<string, string | number | undefined>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}
