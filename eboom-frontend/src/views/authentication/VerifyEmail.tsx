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

type VerifyEmailResponse = {
  message: string;
};

function getVerifyErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as { response?: { data?: { error?: string } } }).response
      ?.data;
    return data?.error || "Verification failed.";
  }
  return "Verification failed.";
}

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

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
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>Verification token is missing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/signup")}>
            Back to Signup
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifying Email</CardTitle>
          <CardDescription>Verifying your email...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>{getVerifyErrorMessage(error)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/signup")}>
            Back to Signup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verified</CardTitle>
        <CardDescription>
          {data?.message || "Email verified successfully."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </CardContent>
    </Card>
  );
}
