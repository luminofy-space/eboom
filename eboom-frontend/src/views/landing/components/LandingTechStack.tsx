"use client";

import { useTranslation } from "react-i18next";
import LogoLoop from "@/components/LogoLoop/LogoLoop";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useLandingLightEffects } from "@/hooks/use-landing-light-effects";
import { LandingReveal } from "@/src/views/landing/components/LandingReveal";
import { TECH_LOGOS } from "@/src/views/landing/landingTechLogos";
import { LANDING_PANEL_CLASS } from "@/src/views/landing/landingPanel";

export function LandingTechStack() {
  const { t } = useTranslation("landing");
  const useLightEffects = useLandingLightEffects();

  return (
    <section data-landing-panel className={LANDING_PANEL_CLASS}>
      <Container className="relative mx-auto max-w-6xl">
        <Stack gap={8}>
          <Stack gap={3} className="max-w-2xl">
            <Typography variant="title" asChild>
              <h2>
                <LandingReveal>{t("tech.title")}</LandingReveal>
              </h2>
            </Typography>
            <Typography variant="muted" className="text-lg">
              {t("tech.subtitle")}
            </Typography>
          </Stack>

          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/20 py-6 backdrop-blur-sm">
            {useLightEffects ? (
              <div className="flex flex-wrap items-center justify-center gap-8 px-6">
                {TECH_LOGOS.map((logo, index) =>
                  "node" in logo ? (
                    <div
                      key={logo.title ?? logo.ariaLabel ?? index}
                      className="flex h-8 items-center text-muted-foreground [&_svg]:h-8 [&_svg]:w-auto"
                      title={logo.title}
                    >
                      {logo.node}
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div className="[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                <LogoLoop
                  logos={TECH_LOGOS}
                  speed={80}
                  logoHeight={32}
                  gap={40}
                  pauseOnHover
                  scaleOnHover
                  ariaLabel={t("tech.title")}
                />
              </div>
            )}
          </div>
        </Stack>
      </Container>
    </section>
  );
}
