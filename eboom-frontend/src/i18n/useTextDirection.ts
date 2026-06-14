"use client";

import { useTranslation } from "react-i18next";
import { isRtlLanguage } from "./languages";

export function useTextDirection() {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  const isRtl = isRtlLanguage(lang);

  return {
    isRtl,
    dir: isRtl ? ("rtl" as const) : ("ltr" as const),
    sidebarSide: isRtl ? ("right" as const) : ("left" as const),
    dropdownSide: isRtl ? ("left" as const) : ("right" as const),
  };
}
