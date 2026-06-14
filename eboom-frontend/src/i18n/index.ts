import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from "./languages";

const isBrowser = typeof window !== "undefined";

if (!i18n.isInitialized) {
  i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: ["en"],
      ns: [
        "common",
        "auth",
        "navigation",
        "expenses",
        "incomes",
        "wallets",
        "profile",
        "canvas",
      ],
      defaultNS: "common",
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      ...(isBrowser ? {} : { lng: DEFAULT_LANGUAGE }),
    });
}

export default i18n;
