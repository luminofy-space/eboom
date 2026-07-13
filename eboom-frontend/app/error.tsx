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
    <div className="flex min-h-svh w-full items-center justify-center">
      <IllustratedState
        illustration="serverDown"
        title={t("status.serverError.title")}
        description={t("status.serverError.description")}
        size="lg"
        fill={false}
        action={
          <Button onClick={reset}>{t("status.serverError.action")}</Button>
        }
      />
    </div>
  );
}
