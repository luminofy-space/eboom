"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { GITHUB_URL } from "@/src/views/landing/landingConfig";

export function LandingHeader() {
  const { t } = useTranslation("landing");

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-black/10">
      <Container className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link href="/">
          <Typography variant="heading" className="text-foreground">
            {t("header.brand")}
          </Typography>
        </Link>

        <Stack direction="row" gap={3} className="items-center">
          {GITHUB_URL && (
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("header.github")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </a>
          )}
          <Button variant="ghost" asChild>
            <Link href="/login">{t("header.login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{t("header.signup")}</Link>
          </Button>
        </Stack>
      </Container>
    </header>
  );
}
