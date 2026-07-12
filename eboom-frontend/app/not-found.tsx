"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { IllustratedState } from "@/src/components/IllustratedState";

export default function NotFound() {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <IllustratedState
        illustration="404"
        title={t("status.notFound.title")}
        description={t("status.notFound.description")}
        size="xl"
        fill={false}
        priority
        action={
          <Button asChild>
            <Link href="/dashboard">{t("status.notFound.action")}</Link>
          </Button>
        }
      />
    </div>
  );
}
