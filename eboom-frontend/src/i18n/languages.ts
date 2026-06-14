export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = "en";

export const LANGUAGE_STORAGE_KEY = "eboom-language";
