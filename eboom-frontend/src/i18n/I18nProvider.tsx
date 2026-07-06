"use client";

import { useEffect, useState } from "react";
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
  const [ready, setReady] = useState(i18n.isInitialized);

  if (typeof document !== "undefined" && i18n.isInitialized) {
    syncDocumentLanguage(i18n.language);
  }

  useEffect(() => {
    const handleInitialized = () => {
      setReady(true);
      syncDocumentLanguage(i18n.language);
    };

    const handleLanguageChanged = (lng: string) => {
      syncDocumentLanguage(lng);
    };

    if (i18n.isInitialized) {
      setReady(true);
      syncDocumentLanguage(i18n.language);
    } else {
      i18n.on("initialized", handleInitialized);
    }

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("initialized", handleInitialized);
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
