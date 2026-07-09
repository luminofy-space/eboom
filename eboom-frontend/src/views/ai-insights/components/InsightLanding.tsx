"use client";

import { AlertTriangle, BrainCircuit, Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import type {
  AiFinancialInsight,
  AiInsightProfile,
  CompletenessResult,
} from "@/src/types/ai-insights";
import { CompletenessMeter } from "./CompletenessMeter";
import { InsightCards } from "./InsightCards";
import { RefreshInsightsButton } from "./RefreshInsightsButton";

interface InsightLandingProps {
  profile: AiInsightProfile | null;
  insight: AiFinancialInsight | null;
  completeness: CompletenessResult;
  onStartWizard: (step?: number) => void;
  onRefreshInsights: () => void;
  isGenerating: boolean;
  canEdit: boolean;
}

const TIP_KEYS = ["emergencyFund", "debtFirst", "diversify", "reviewBudget"] as const;

function getProfileStatus(profile: AiInsightProfile | null) {
  if (!profile) {
    return { kind: "notStarted" as const, step: 1 };
  }
  if (profile.status === "completed") {
    return { kind: "completed" as const, step: profile.currentStep };
  }
  if (
    profile.currentStep > 1 ||
    profile.riskProfile ||
    profile.investmentGoals ||
    profile.esgPreferences ||
    profile.financialKnowledge ||
    profile.financialPicture
  ) {
    return { kind: "inProgress" as const, step: profile.currentStep };
  }
  return { kind: "notStarted" as const, step: 1 };
}

function formatGeneratedAt(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function InsightLanding({
  profile,
  insight,
  completeness,
  onStartWizard,
  onRefreshInsights,
  isGenerating,
  canEdit,
}: InsightLandingProps) {
  const { t, i18n } = useTranslation("ai-insights");
  const status = getProfileStatus(profile);

  const statusLabel =
    status.kind === "notStarted"
      ? t("landing.status.notStarted")
      : status.kind === "completed"
        ? t("landing.status.completed")
        : t("landing.status.inProgress", { step: status.step });

  const ctaLabel =
    status.kind === "notStarted"
      ? t("landing.startWizard")
      : status.kind === "completed"
        ? t("landing.reviewWizard")
        : t("landing.continueWizard");

  const showWarning =
    completeness.score < 70 || status.kind !== "completed";
  const hasCachedInsights = (insight?.insights?.length ?? 0) > 0;
  const lastUpdated = formatGeneratedAt(insight?.generatedAt, i18n.language);

  return (
    <Stack gap={6}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <BrainCircuit className="size-6 text-primary" />
        </div>
        <div className="flex-1">
          <Typography variant="title">{t("title")}</Typography>
          <Typography variant="muted" className="mt-1">
            {t("subtitle")}
          </Typography>
        </div>
        {canEdit && (
          <RefreshInsightsButton
            onRefresh={onRefreshInsights}
            isGenerating={isGenerating}
          />
        )}
      </div>

      <Typography variant="caption">{t("disclaimer")}</Typography>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={status.kind === "completed" ? "default" : "secondary"}>
          {statusLabel}
        </Badge>
        {profile?.financialKnowledge?.level && status.kind === "completed" && (
          <Badge variant="outline">
            {t("landing.knowledgeLevel", {
              level: t(`financialKnowledge.level.${profile.financialKnowledge.level}`),
            })}
          </Badge>
        )}
      </div>

      <CompletenessMeter completeness={completeness} />

      {showWarning && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex gap-3">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <Typography variant="label" className="text-sm">
                {t("landing.warningTitle")}
              </Typography>
              <Typography variant="muted" className="mt-1 text-sm">
                {t("landing.warningDescription")}
              </Typography>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="size-5 text-amber-500" />
            {hasCachedInsights ? t("insights.title") : t("landing.generalAdviceTitle")}
          </CardTitle>
          {lastUpdated && (
            <Typography variant="muted-sm">
              {t("insights.lastUpdated", { date: lastUpdated })}
            </Typography>
          )}
          {!hasCachedInsights && (
            <Typography variant="muted" className="text-sm">
              {t("landing.generalAdviceDescription")}
            </Typography>
          )}
        </CardHeader>
        <CardContent>
          {hasCachedInsights && insight ? (
            <InsightCards insights={insight.insights} />
          ) : (
            <ul className="space-y-3">
              {TIP_KEYS.map((key) => (
                <li key={key} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t(`landing.tips.${key}`)}
                </li>
              ))}
            </ul>
          )}
          {!hasCachedInsights && canEdit && (
            <Typography variant="muted-sm" className="mt-4">
              {t("insights.empty")}
            </Typography>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => onStartWizard(status.kind === "completed" ? 1 : status.step)}
        >
          {ctaLabel}
        </Button>
      )}
    </Stack>
  );
}
