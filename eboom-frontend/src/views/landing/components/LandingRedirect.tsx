"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/components/AuthProvider";

export function LandingRedirect({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, router]);

  if (accessToken) {
    return null;
  }

  return children;
}
