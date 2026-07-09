"use client";

import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
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

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

type ResetPasswordResponse = {
  message: string;
};

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>();

  const newPassword = watch("newPassword");

  const { mutateAsync, isPending } = useMutationApi<
    ResetPasswordPayload,
    ResetPasswordResponse
  >(
    API_ROUTES.AUTH_RESET_PASSWORD,
    { method: "post", hasToken: false }
  );

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      await mutateAsync({ token, newPassword: data.newPassword });
      setSubmitted(true);
    } catch {
      // API failures are shown via the global notistack snackbar.
    }
  };

  if (!token) {
    return (
      <Stack gap={6} className={className} {...props}>
        <AuthCard>
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
        </AuthCard>
      </Stack>
    );
  }

  if (submitted) {
    return (
      <Stack gap={6} className={className} {...props}>
        <AuthCard>
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
        </AuthCard>
      </Stack>
    );
  }

  return (
    <Stack gap={6} className={className} {...props}>
      <AuthCard>
        <CardHeader>
          <CardTitle>{t("resetPassword.title")}</CardTitle>
          <CardDescription>{t("resetPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
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
                  <AuthLink href="/login">{t("resetPassword.backToLogin")}</AuthLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </AuthCard>
    </Stack>
  );
}
