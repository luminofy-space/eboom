import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from "./languages";
import { resources } from "./resources";

const isBrowser = typeof window !== "undefined";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: ["en", "de", "fa"],
      ns: [
        "common",
        "validation",
        "auth",
        "navigation",
        "expenses",
        "incomes",
        "wallets",
        "assets",
        "profile",
        "canvas",
        "canvas-members",
        "whiteboard",
        "dashboard",
        "transactions",
        "calendar",
        "budget-planning",
        "ai-insights",
        "landing",
      ],
      defaultNS: "common",
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
