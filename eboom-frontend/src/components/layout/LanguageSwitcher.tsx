"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES } from "@/src/i18n/languages";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("navigation");

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages />
        {t("account.language")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={i18n.language}
          onValueChange={(value) => i18n.changeLanguage(value)}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuRadioItem key={language.code} value={language.code}>
              {language.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
