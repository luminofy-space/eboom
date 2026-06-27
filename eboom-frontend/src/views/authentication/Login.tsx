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
import { Stack } from "@/components/ui/stack";
import { useAuthContext } from "@/src/components/AuthProvider";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const { login, loading } = useAuthContext();

  const onSubmit = async (data: LoginFormData) => {
    await login(data)
      .then((res) => {
        if (res) {
          router.push("/");
        }
      })
      .catch((error) => {
        console.error("error", error);
        setError(error.message);
      });
  };

  return (
    <Stack gap={6} className={className} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
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
                <FieldLabel htmlFor="email">{t("login.email.label")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("login.email.placeholder")}
                  {...register("email", {
                    required: t("login.email.required"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("login.email.invalid"),
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">{t("login.password.label")}</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t("login.password.forgot")}
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: t("login.password.required"),
                    minLength: {
                      value: 6,
                      message: t("login.password.minLength"),
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
                <Button type="submit" disabled={loading}>
                  {loading ? t("login.submitting") : t("login.submit")}
                </Button>
                <FieldDescription className="text-center">
                  {t("login.signupPrompt")}{" "}
                  <a href="/signup">{t("login.signupLink")}</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
}
