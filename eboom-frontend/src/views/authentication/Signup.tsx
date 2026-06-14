"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { useAuthContext } from "@/src/components/AuthProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>();

  const password = watch("password");

  const { signup, loading } = useAuthContext();

  const onSubmit = (data: SignupFormData) => {
    signup({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    })
      .then((res) => {
        router.push(res?.user?.emailVerified ? "/" : "/confirm-email");
      })
      .catch((error) => {
        console.error("error", error);
        setError(error.message);
      });
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("signup.title")}</CardTitle>
        <CardDescription>{t("signup.description")}</CardDescription>
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
                <Button type="submit" disabled={loading}>
                  {loading ? t("signup.submitting") : t("signup.submit")}
                </Button>
                <FieldDescription className="px-6 text-center">
                  {t("signup.loginPrompt")}{" "}
                  <a href="/login">{t("signup.loginLink")}</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
