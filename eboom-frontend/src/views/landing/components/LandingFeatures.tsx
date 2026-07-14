"use client";

import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { LandingCard } from "@/src/views/landing/components/LandingCard";
import { LandingReveal } from "@/src/views/landing/components/LandingReveal";
import { LANDING_FEATURES } from "@/src/views/landing/landingConfig";
import { LANDING_PANEL_CLASS } from "@/src/views/landing/landingPanel";

export function LandingFeatures() {
  const { t } = useTranslation("landing");

  return (
    <section data-landing-panel className={LANDING_PANEL_CLASS}>
      <Container className="relative mx-auto w-full max-w-6xl">
        <Stack gap={8}>
          <Stack gap={3} className="max-w-2xl">
            <Typography variant="title" asChild>
              <h2>
                <LandingReveal>{t("features.title")}</LandingReveal>
              </h2>
            </Typography>
            <Typography variant="muted" className="text-lg">
              {t("features.subtitle")}
            </Typography>
          </Stack>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LANDING_FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
              <LandingCard key={titleKey}>
                <Stack gap={4}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-primary/15 text-primary backdrop-blur-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Typography variant="heading">{t(titleKey)}</Typography>
                  <Typography variant="muted-sm">{t(descKey)}</Typography>
                </Stack>
              </LandingCard>
            ))}
          </div>
        </Stack>
      </Container>
    </section>
  );
}
