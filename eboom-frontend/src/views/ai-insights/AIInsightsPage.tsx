"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrainCircuit, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/container";
import { PageLoader } from "@/components/ui/page-loader";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useAIInsightProfile } from "./hooks/useAIInsightProfile";
import { useAIInsights } from "./hooks/useAIInsights";
import { InsightLanding } from "./components/InsightLanding";
import { WizardShell, stepPayload } from "./components/WizardShell";
import { AIChatPanel } from "./components/chat/AIChatPanel";
import type { WizardFormData } from "@/src/types/ai-insights";

type ViewMode = "landing" | "wizard";
type MainTab = "insights" | "chat";

const TAB_PARAM = "tab";
const DEFAULT_TAB: MainTab = "insights";

function parseMainTab(value: string | null): MainTab {
  return value === "chat" ? "chat" : DEFAULT_TAB;
}

export default function AIInsightsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation("ai-insights");
  const { canEdit } = useCanvasPermissions();
  const {
    profile: insightsProfile,
    insight,
    completeness,
    isLoading: insightsLoading,
    isError: insightsError,
    generateInsights,
    isGenerating,
    refetch: refetchInsights,
    canvasId,
  } = useAIInsights();
  const { saveProfile, isSaving, refetch: refetchProfile } = useAIInsightProfile();
  const [view, setView] = useState<ViewMode>("landing");
  const [wizardStartStep, setWizardStartStep] = useState<number | undefined>();
  const [generateError, setGenerateError] = useState<string | null>(null);

  const mainTab = useMemo(
    () => parseMainTab(searchParams.get(TAB_PARAM)),
    [searchParams]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = parseMainTab(value);
      const params = new URLSearchParams(searchParams.toString());

      if (tab === DEFAULT_TAB) {
        params.delete(TAB_PARAM);
      } else {
        params.set(TAB_PARAM, tab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const profile = insightsProfile;

  const handleStartWizard = (step?: number) => {
    setWizardStartStep(step);
    setView("wizard");
  };

  const handleSave = async (
    step: number,
    data: WizardFormData,
    options: { complete?: boolean; advance?: boolean }
  ) => {
    const stepData = stepPayload(step, data);
    const savedStep = options.complete ? 5 : options.advance ? step + 1 : step;

    await saveProfile({
      currentStep: savedStep,
      status: options.complete ? "completed" : "draft",
      ...stepData,
    });
    await refetchInsights();
  };

  const handleRefreshInsights = async () => {
    setGenerateError(null);
    try {
      await generateInsights();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setGenerateError(t("errors.noApiKey"));
      } else if (status === 429) {
        setGenerateError(t("errors.rateLimited"));
      } else {
        setGenerateError(t("errors.generationFailed"));
      }
    }
  };

  if (!canvasId) {
    return (
      <Container>
        <Typography variant="muted">{t("empty.noCanvas")}</Typography>
      </Container>
    );
  }

  if (insightsLoading) {
    return <PageLoader />;
  }

  if (insightsError) {
    return (
      <Container className="py-6">
        <Typography variant="title">{t("title")}</Typography>
        <Typography variant="muted" className="mt-2">
          {t("errors.loadFailed")}
        </Typography>
        <Button className="mt-4" variant="outline" onClick={() => refetchInsights()}>
          {t("errors.retry")}
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      {generateError && (
        <Typography variant="muted-sm" className="mb-4 text-destructive">
          {generateError}
        </Typography>
      )}
      {view === "landing" ? (
        <Tabs
          value={mainTab}
          onValueChange={handleTabChange}
          className={mainTab === "chat" ? "flex min-h-0 flex-col" : undefined}
        >
          <TabsList className="shrink-0">
            <TabsTrigger value="insights">
              <BrainCircuit className="size-4" />
              {t("tabs.insights")}
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="size-4" />
              {t("tabs.chat")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="insights" className="mt-6">
            <InsightLanding
              profile={profile}
              insight={insight}
              completeness={completeness}
              onStartWizard={handleStartWizard}
              onRefreshInsights={handleRefreshInsights}
              isGenerating={isGenerating}
              canEdit={canEdit}
            />
          </TabsContent>
          <TabsContent value="chat" className="mt-6">
            <AIChatPanel canEdit={canEdit} isActive={mainTab === "chat"} />
          </TabsContent>
        </Tabs>
      ) : (
        <WizardShell
          profile={profile}
          initialStep={wizardStartStep}
          onSave={async (...args) => {
            await handleSave(...args);
            await refetchProfile();
          }}
          onExit={() => {
            setView("landing");
            setWizardStartStep(undefined);
          }}
          isSaving={isSaving}
          canEdit={canEdit}
        />
      )}
    </Container>
  );
}
