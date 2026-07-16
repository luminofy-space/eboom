"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthCard } from "@/src/views/authentication/AuthCard";
import { AuthLink } from "@/src/views/authentication/AuthLink";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ForgotPasswordFormData {
  email: string;
}

type ForgotPasswordResponse = {
  message: string;
};

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const { mutateAsync, isPending } = useMutationApi<
    ForgotPasswordFormData,
    ForgotPasswordResponse
  >(
    API_ROUTES.AUTH_FORGOT_PASSWORD,
    { method: "post", hasToken: false }
  );

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await mutateAsync({ email: data.email });
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch {
      // API failures are shown via the global notistack snackbar.
    }
  };

  const handleResend = async () => {
    if (!submittedEmail) return;
    try {
      await mutateAsync({ email: submittedEmail });
    } catch {
      // API failures are shown via the global notistack snackbar.
    }
  };

  if (submitted) {
    return (
      <Stack gap={6} className={className} {...props}>
        <AuthCard>
          <CardHeader>
            <CardTitle>{t("forgotPassword.success.title")}</CardTitle>
            <CardDescription>
              {t("forgotPassword.success.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack gap={3}>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleResend}
                disabled={isPending}
              >
                {isPending
                  ? t("forgotPassword.success.resending")
                  : t("forgotPassword.success.resend")}
              </Button>
              <Button className="w-full" onClick={() => router.push("/login")}>
                {t("forgotPassword.success.backToLogin")}
              </Button>
            </Stack>
          </CardContent>
        </AuthCard>
      </Stack>
    );
  }

  return (
    <Stack gap={6} className={className} {...props}>
      <AuthCard>
        <CardHeader>
          <CardTitle>{t("forgotPassword.title")}</CardTitle>
          <CardDescription>{t("forgotPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">
                  {t("forgotPassword.email.label")}
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("forgotPassword.email.placeholder")}
                  {...register("email", {
                    required: t("forgotPassword.email.required"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("forgotPassword.email.invalid"),
                    },
                  })}
                />
                {errors.email && (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? t("forgotPassword.submitting")
                    : t("forgotPassword.submit")}
                </Button>
                <FieldDescription className="text-center">
                  {t("forgotPassword.loginPrompt")}{" "}
                  <AuthLink href="/login">{t("forgotPassword.loginLink")}</AuthLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </AuthCard>
    </Stack>
  );
}
