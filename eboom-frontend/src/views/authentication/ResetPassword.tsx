"use client";

import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AxiosError } from "axios";

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

type ResetPasswordResponse = {
  message: string;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error || fallback;
  }
  return fallback;
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>();

  const newPassword = watch("newPassword");

  const { mutateAsync, isPending } = useMutationApi<ResetPasswordResponse>(
    API_ROUTES.AUTH_RESET_PASSWORD,
    { method: "post", hasToken: false }
  );

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setError(null);
    try {
      await mutateAsync({ token, newPassword: data.newPassword });
      setSubmitted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, t("resetPassword.error.default")));
    }
  };

  if (!token) {
    return (
      <Stack gap={6} className={className} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>{t("resetPassword.missingToken.title")}</CardTitle>
            <CardDescription>
              {t("resetPassword.missingToken.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/login")}>
              {t("resetPassword.missingToken.backToLogin")}
            </Button>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  if (submitted) {
    return (
      <Stack gap={6} className={className} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>{t("resetPassword.success.title")}</CardTitle>
            <CardDescription>
              {t("resetPassword.success.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/login")}>
              {t("resetPassword.success.goToLogin")}
            </Button>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap={6} className={className} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t("resetPassword.title")}</CardTitle>
          <CardDescription>{t("resetPassword.description")}</CardDescription>
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
                <FieldLabel htmlFor="newPassword">
                  {t("resetPassword.password.label")}
                </FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  {...register("newPassword", {
                    required: t("resetPassword.password.required"),
                    minLength: {
                      value: 8,
                      message: t("resetPassword.password.minLength"),
                    },
                  })}
                />
                {errors.newPassword && (
                  <FieldDescription className="text-destructive">
                    {errors.newPassword.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  {t("resetPassword.confirmPassword.label")}
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword", {
                    required: t("resetPassword.confirmPassword.required"),
                    validate: (value) =>
                      value === newPassword ||
                      t("resetPassword.confirmPassword.mismatch"),
                  })}
                />
                {errors.confirmPassword && (
                  <FieldDescription className="text-destructive">
                    {errors.confirmPassword.message}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? t("resetPassword.submitting")
                    : t("resetPassword.submit")}
                </Button>
                <FieldDescription className="text-center">
                  <a href="/login">{t("resetPassword.backToLogin")}</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
}
