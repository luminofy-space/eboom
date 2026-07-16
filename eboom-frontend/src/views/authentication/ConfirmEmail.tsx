"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthCard } from "@/src/views/authentication/AuthCard";
import { Stack } from "@/components/ui/stack";
import { useAuthContext } from "@/src/components/AuthProvider";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import { useTranslation } from "react-i18next";

type ResendVerificationResponse = {
  message: string;
};

export function ConfirmEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation("auth");
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const email = searchParams.get("email") ?? user?.email ?? "";

  const { mutateAsync, isPending, isSuccess } = useMutationApi<
    { email: string },
    ResendVerificationResponse
  >(API_ROUTES.AUTH_RESEND_VERIFICATION, {
    method: "post",
    hasToken: false,
  });

  const handleResend = async () => {
    if (!email) return;
    try {
      await mutateAsync({ email });
    } catch {
      // API failures are shown via the global notistack snackbar.
    }
  };

  return (
    <Stack gap={6} className={className} {...props}>
      <AuthCard>
        <CardHeader>
          <CardTitle>{t("confirmEmail.title")}</CardTitle>
          <CardDescription>{t("confirmEmail.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Stack gap={3}>
            {email ? (
              <CardDescription className="text-center">
                {t("confirmEmail.sentTo", { email })}
              </CardDescription>
            ) : null}
            <Button
              className="w-full"
              variant="outline"
              onClick={handleResend}
              disabled={!email || isPending}
            >
              {isPending ? t("confirmEmail.resending") : t("confirmEmail.resend")}
            </Button>
            {isSuccess ? (
              <CardDescription className="text-center text-primary">
                {t("confirmEmail.resendSuccess")}
              </CardDescription>
            ) : null}
          </Stack>
        </CardContent>
      </AuthCard>
    </Stack>
  );
}
