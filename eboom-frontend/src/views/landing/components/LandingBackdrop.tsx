"use client";

import dynamic from "next/dynamic";
import { useLandingLightEffects } from "@/hooks/use-landing-light-effects";
import { DARK_VEIL_PROPS } from "@/src/views/landing/landingConfig";

const DarkVeil = dynamic(() => import("@/components/DarkVeil/DarkVeil"), {
  ssr: false,
});

const LIGHT_BACKDROP_STYLE = {
  background:
    "radial-gradient(ellipse at 30% 20%, #6D28D944 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #6D28D966 0%, transparent 50%), #000",
} as const;

export function LandingBackdrop() {
  const useLightEffects = useLandingLightEffects();

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {!useLightEffects ? (
        <div className="absolute inset-0 opacity-[0.55] mix-blend-screen">
          <DarkVeil {...DARK_VEIL_PROPS} />
        </div>
      ) : (
        <div className="absolute inset-0" style={LIGHT_BACKDROP_STYLE} />
      )}
      <div className="absolute inset-0 bg-[#6D28D9]/10" />
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
}
