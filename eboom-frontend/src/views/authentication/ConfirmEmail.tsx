"use client";

import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthCard } from "@/src/views/authentication/AuthCard";
import { Stack } from "@/components/ui/stack";
import { useTranslation } from "react-i18next";

export function ConfirmEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");

  return (
    <Stack gap={6} className={className} {...props}>
      <AuthCard>
        <CardHeader>
          <CardTitle>{t("confirmEmail.title")}</CardTitle>
          <CardDescription>{t("confirmEmail.description")}</CardDescription>
        </CardHeader>
      </AuthCard>
    </Stack>
  );
}
