"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./index";

function syncDocumentLanguage(lng: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
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
