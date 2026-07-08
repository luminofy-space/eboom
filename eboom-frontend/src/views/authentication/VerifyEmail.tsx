"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthCard } from "@/src/views/authentication/AuthCard";
import { Button } from "@/components/ui/button";
import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "@/src/utils/formUtils";

type VerifyEmailResponse = {
  message: string;
};

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { t } = useTranslation("auth");

  const { data, isLoading, isError, error } = useQueryApi<VerifyEmailResponse>(
    API_ROUTES.AUTH_VERIFY_EMAIL,
    {
      queryKey: ["verify-email", token],
      hasToken: false,
      enabled: !!token,
      retry: 0,
    },
    { params: token ? { token } : undefined }
  );

  if (!token) {
    return (
      <AuthCard>
        <CardHeader>
          <CardTitle>{t("verifyEmail.missingToken.title")}</CardTitle>
          <CardDescription>{t("verifyEmail.missingToken.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/signup")}>
            {t("verifyEmail.missingToken.backToSignup")}
          </Button>
        </CardContent>
      </AuthCard>
    );
  }

  if (isLoading) {
    return (
      <AuthCard>
        <CardHeader>
          <CardTitle>{t("verifyEmail.loading.title")}</CardTitle>
          <CardDescription>{t("verifyEmail.loading.description")}</CardDescription>
        </CardHeader>
      </AuthCard>
    );
  }

  if (isError) {
    return (
      <AuthCard>
        <CardHeader>
          <CardTitle>{t("verifyEmail.error.title")}</CardTitle>
          <CardDescription>
            {getApiErrorMessage(error, t("verifyEmail.error.default"))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/signup")}>
            {t("verifyEmail.error.backToSignup")}
          </Button>
        </CardContent>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>{t("verifyEmail.success.title")}</CardTitle>
        <CardDescription>
          {data?.message || t("verifyEmail.success.default")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={() => router.push("/login")}>
          {t("verifyEmail.success.goToLogin")}
        </Button>
      </CardContent>
    </AuthCard>
  );
}
