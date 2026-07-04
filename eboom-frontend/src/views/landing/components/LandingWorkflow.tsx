"use client";

import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { LandingCard } from "@/src/views/landing/components/LandingCard";
import { LandingReveal } from "@/src/views/landing/components/LandingReveal";
import { LANDING_WORKFLOW_STEPS } from "@/src/views/landing/landingConfig";
import { LANDING_PANEL_CLASS } from "@/src/views/landing/landingPanel";

export function LandingWorkflow() {
  const { t } = useTranslation("landing");

  return (
    <section data-landing-panel className={LANDING_PANEL_CLASS}>
      <Container className="relative mx-auto max-w-6xl">
        <Stack gap={8}>
          <Stack gap={3} className="max-w-2xl">
            <Typography variant="title" asChild>
              <h2>
                <LandingReveal>{t("workflow.title")}</LandingReveal>
              </h2>
            </Typography>
            <Typography variant="muted" className="text-lg">
              {t("workflow.subtitle")}
            </Typography>
          </Stack>

          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6">
            <WorkflowNode
              label={t("workflow.nodes.income")}
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 backdrop-blur-sm"
            />
            <ArrowRight className="hidden h-5 w-5 text-muted-foreground md:block" />
            <WorkflowNode
              label={t("workflow.nodes.wallet")}
              className="border-blue-500/30 bg-blue-500/10 text-blue-300 backdrop-blur-sm"
            />
            <ArrowRight className="hidden h-5 w-5 text-muted-foreground md:block" />
            <WorkflowNode
              label={t("workflow.nodes.expense")}
              className="border-red-500/30 bg-red-500/10 text-red-300 backdrop-blur-sm"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {LANDING_WORKFLOW_STEPS.map((item) => (
              <LandingCard key={item.step}>
                <Stack gap={3}>
                  <Typography
                    variant="caption"
                    className="font-mono text-primary"
                  >
                    0{item.step}
                  </Typography>
                  <Typography variant="heading">{t(item.titleKey)}</Typography>
                  <Typography variant="muted-sm">{t(item.descKey)}</Typography>
                </Stack>
              </LandingCard>
            ))}
          </div>
        </Stack>
      </Container>
    </section>
  );
}

function WorkflowNode({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-full border px-6 py-3 text-sm font-medium ${className}`}
    >
      {label}
    </div>
  );
}
