"use client";

import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface RefreshInsightsButtonProps {
  onRefresh: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function RefreshInsightsButton({
  onRefresh,
  isGenerating,
  disabled,
}: RefreshInsightsButtonProps) {
  const { t } = useTranslation("ai-insights");

  return (
    <Button
      type="button"
      variant="outline"
      className="gap-2"
      onClick={onRefresh}
      disabled={disabled || isGenerating}
    >
      {isGenerating ? (
        <Spinner className="size-4" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      {isGenerating ? t("insights.generating") : t("insights.refresh")}
    </Button>
  );
}
