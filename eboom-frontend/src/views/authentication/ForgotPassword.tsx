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
import { isAxiosError } from "@/src/api/axiosTypes";

interface ForgotPasswordFormData {
  email: string;
}

type ForgotPasswordResponse = {
  message: string;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error || fallback;
  }
  return fallback;
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
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
    setError(null);
    try {
      await mutateAsync({ email: data.email });
      setSubmitted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, t("forgotPassword.error.default")));
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
            <Button className="w-full" onClick={() => router.push("/login")}>
              {t("forgotPassword.success.backToLogin")}
            </Button>
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
              {error && (
                <Field>
                  <div className="text-sm text-destructive">{error}</div>
                </Field>
              )}
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
