"use client";

import dynamic from "next/dynamic";
import { authStaticBackgroundStyle } from "@/src/views/authentication/authBackgroundStyle";
import { Center } from "@/components/ui/center";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const Grainient = dynamic(() => import("@/components/Grainient/Grainient"), {
  ssr: false,
});

function StaticAuthBackground() {
  return (
    <div
      className="h-full w-full"
      style={authStaticBackgroundStyle}
      aria-hidden
    />
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="dark relative min-h-svh overflow-hidden bg-[#1C1917]">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <StaticAuthBackground />
        {!prefersReducedMotion && (
          <div className="absolute inset-0">
            <Grainient className="h-full w-full" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <Center className="relative z-10">{children}</Center>
    </div>
  );
}
