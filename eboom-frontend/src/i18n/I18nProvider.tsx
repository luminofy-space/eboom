"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/de";
import "dayjs/locale/fa";
import i18n from "./index";
import { isRtlLanguage } from "./languages";

const DAYJS_LOCALE_MAP: Record<string, string> = {
  en: "en",
  de: "de",
  fa: "fa",
};

function syncDocumentLanguage(lng: string) {
  if (typeof document === "undefined") return;

  const base = lng.split("-")[0];
  document.documentElement.lang = base;
  document.documentElement.dir = isRtlLanguage(base) ? "rtl" : "ltr";
  dayjs.locale(DAYJS_LOCALE_MAP[base] ?? "en");
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    syncDocumentLanguage(i18n.language);

    const handleLanguageChanged = (lng: string) => {
      syncDocumentLanguage(lng);
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
