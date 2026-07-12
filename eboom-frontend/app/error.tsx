"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { IllustratedState } from "@/src/components/IllustratedState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <IllustratedState
      illustration="serverDown"
      title={t("status.serverError.title")}
      description={t("status.serverError.description")}
      size="lg"
      action={
        <Button onClick={reset}>{t("status.serverError.action")}</Button>
      }
    />
  );
}
