"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { COLLABORATORS, GITHUB_URL } from "@/src/views/landing/landingConfig";

export function LandingFooter() {
  const { t } = useTranslation("landing");

  return (
    <footer data-landing-footer className="relative border-t border-white/5 py-16">
      <Container className="relative mx-auto max-w-6xl">
        <Stack gap={8}>
          <Stack
            direction="row"
            gap={6}
            className="flex-col items-start justify-between md:flex-row md:items-center"
          >
            <Stack gap={2} className="max-w-md">
              <Typography variant="heading">{t("header.brand")}</Typography>
              <Typography variant="muted-sm">{t("footer.tagline")}</Typography>
            </Stack>

            <Stack direction="row" gap={3} className="items-center">
              {GITHUB_URL && (
                <Button variant="outline" asChild>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    {t("footer.github")}
                  </a>
                </Button>
              )}
              <Button asChild>
                <Link href="/signup">{t("footer.signup")}</Link>
              </Button>
            </Stack>
          </Stack>

          <Stack gap={3}>
            <Typography variant="label" className="text-muted-foreground">
              {t("footer.collaborators")}
            </Typography>
            <Stack direction="row" gap={4} className="flex-wrap">
              {COLLABORATORS.map(({ name, github }) => (
                <a
                  key={name}
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-foreground/90 backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                >
                  <Github className="h-4 w-4 text-muted-foreground" />
                  {name}
                </a>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </footer>
  );
}
