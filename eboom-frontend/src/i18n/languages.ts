export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fa", label: "فارسی" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const RTL_LANGUAGES: SupportedLanguageCode[] = ["fa"];

export function isRtlLanguage(code: string): boolean {
  return RTL_LANGUAGES.includes(code as SupportedLanguageCode);
}

export const DEFAULT_LANGUAGE: SupportedLanguageCode = "en";

export const LANGUAGE_STORAGE_KEY = "eboom-language";
