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
import { useAuthContext } from "@/src/components/AuthProvider";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignupForm({ ...props }: React.ComponentProps<typeof AuthCard>) {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>();

  const password = watch("password");

  const { signup, isSignupPending } = useAuthContext();

  const onSubmit = async (data: SignupFormData) => {
    try {
      const res = await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      router.replace(
        res?.user?.emailVerified ? "/dashboard" : "/confirm-email"
      );
    } catch {
      // API failures are shown via the global notistack snackbar.
    }
  };

  return (
    <AuthCard {...props}>
      <CardHeader>
        <CardTitle>{t("signup.title")}</CardTitle>
        <CardDescription>{t("signup.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="firstName">{t("signup.firstName.label")}</FieldLabel>
              <Input
                id="firstName"
                type="text"
                placeholder={t("signup.firstName.placeholder")}
                {...register("firstName", {
                  required: t("signup.firstName.required"),
                  minLength: {
                    value: 2,
                    message: t("signup.firstName.minLength"),
                  },
                })}
              />
              {errors.firstName && (
                <FieldDescription className="text-destructive">
                  {errors.firstName.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">{t("signup.lastName.label")}</FieldLabel>
              <Input
                id="lastName"
                type="text"
                placeholder={t("signup.lastName.placeholder")}
                {...register("lastName", {
                  required: t("signup.lastName.required"),
                  minLength: {
                    value: 2,
                    message: t("signup.lastName.minLength"),
                  },
                })}
              />
              {errors.lastName && (
                <FieldDescription className="text-destructive">
                  {errors.lastName.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">{t("signup.email.label")}</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder={t("signup.email.placeholder")}
                {...register("email", {
                  required: t("signup.email.required"),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t("signup.email.invalid"),
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
              <FieldLabel htmlFor="password">{t("signup.password.label")}</FieldLabel>
              <Input
                id="password"
                type="password"
                {...register("password", {
                  required: t("signup.password.required"),
                  minLength: {
                    value: 8,
                    message: t("signup.password.minLength"),
                  },
                })}
              />
              {errors.password && (
                <FieldDescription className="text-destructive">
                  {errors.password.message}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                {t("signup.confirmPassword.label")}
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword", {
                  required: t("signup.confirmPassword.required"),
                  validate: (value) =>
                    value === password || t("signup.confirmPassword.mismatch"),
                })}
              />
              {errors.confirmPassword && (
                <FieldDescription className="text-destructive">
                  {errors.confirmPassword.message}
                </FieldDescription>
              )}
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isSignupPending}>
                  {isSignupPending && <Loader2 className="size-4 animate-spin" />}
                  {isSignupPending ? t("signup.submitting") : t("signup.submit")}
                </Button>
                <FieldDescription className="px-6 text-center">
                  {t("signup.loginPrompt")}{" "}
                  <AuthLink href="/login">{t("signup.loginLink")}</AuthLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </AuthCard>
  );
}
