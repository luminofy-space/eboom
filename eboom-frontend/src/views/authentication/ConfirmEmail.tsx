"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { useTranslation } from "react-i18next";

export function ConfirmEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");

  return (
    <Stack gap={6} className={className} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t("confirmEmail.title")}</CardTitle>
          <CardDescription>{t("confirmEmail.description")}</CardDescription>
        </CardHeader>
      </Card>
    </Stack>
  );
}
