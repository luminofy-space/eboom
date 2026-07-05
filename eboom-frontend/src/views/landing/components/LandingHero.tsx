"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { LANDING_PANEL_CLASS } from "@/src/views/landing/landingPanel";
import { scrollToLandingPanel } from "@/src/views/landing/hooks/useLandingSnapScroll";

export function LandingHero() {
  const { t } = useTranslation("landing");

  return (
    <section
      data-landing-panel
      className={`${LANDING_PANEL_CLASS} items-center`}
    >
      <Container className="relative mx-auto max-w-6xl py-20">
        <Stack gap={8} className="max-w-3xl">
          <Stack gap={4}>
            <Typography
              variant="display"
              className="text-4xl leading-tight text-foreground md:text-6xl"
            >
              {t("hero.title")}
            </Typography>
            <Typography variant="muted" className="max-w-2xl text-lg md:text-xl">
              {t("hero.subtitle")}
            </Typography>
          </Stack>

          <Stack direction="row" gap={3} className="flex-wrap">
            <Button size="lg" asChild>
              <Link href="/signup">{t("hero.signup")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">{t("hero.login")}</Link>
            </Button>
          </Stack>
        </Stack>
      </Container>

      <button
        type="button"
        aria-label="Scroll to next section"
        onClick={() => scrollToLandingPanel(1)}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className="h-6 w-6 animate-bounce" aria-hidden />
      </button>
    </section>
  );
}
