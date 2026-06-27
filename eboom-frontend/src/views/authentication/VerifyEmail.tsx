"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useQueryApi from "@/src/api/useQuery";
import API_ROUTES from "@/src/api/urls";
import { useTranslation } from "react-i18next";

type VerifyEmailResponse = {
  message: string;
};

function getVerifyErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: string } } }).response
      ?.data;
    return data?.error || fallback;
  }
  return fallback;
}

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
      <Card>
        <CardHeader>
          <CardTitle>{t("verifyEmail.missingToken.title")}</CardTitle>
          <CardDescription>{t("verifyEmail.missingToken.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/signup")}>
            {t("verifyEmail.missingToken.backToSignup")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("verifyEmail.loading.title")}</CardTitle>
          <CardDescription>{t("verifyEmail.loading.description")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("verifyEmail.error.title")}</CardTitle>
          <CardDescription>
            {getVerifyErrorMessage(error, t("verifyEmail.error.default"))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/signup")}>
            {t("verifyEmail.error.backToSignup")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
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
    </Card>
  );
}
