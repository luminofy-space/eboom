"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/components/AuthProvider";

export function LandingRedirect({ children }: { children: React.ReactNode }) {
  const { accessToken, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, loading, router]);

  if (loading || accessToken) {
    return null;
  }

  return children;
}
