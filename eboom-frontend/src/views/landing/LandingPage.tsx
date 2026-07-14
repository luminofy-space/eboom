"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { LandingBackdrop } from "@/src/views/landing/components/LandingBackdrop";
import { LandingFooter } from "@/src/views/landing/components/LandingFooter";
import { LandingHeader } from "@/src/views/landing/components/LandingHeader";
import { LandingHero } from "@/src/views/landing/components/LandingHero";
import { LandingPagination } from "@/src/views/landing/components/LandingPagination";
import { LandingRedirect } from "@/src/views/landing/components/LandingRedirect";
import { LandingWorkflow } from "@/src/views/landing/components/LandingWorkflow";
import {
  scrollToLandingPanel,
  useLandingSnapScroll,
} from "@/src/views/landing/hooks/useLandingSnapScroll";
import { useLandingLightEffects } from "@/hooks/use-landing-light-effects";

const LandingFeatures = dynamic(
  () =>
    import("@/src/views/landing/components/LandingFeatures").then((m) => ({
      default: m.LandingFeatures,
    })),
  { ssr: true }
);

const LandingTechStack = dynamic(
  () =>
    import("@/src/views/landing/components/LandingTechStack").then((m) => ({
      default: m.LandingTechStack,
    })),
  { ssr: true }
);

export default function LandingPage() {
  const useLightEffects = useLandingLightEffects();
  const [activePanel, setActivePanel] = useState(0);

  const handlePanelSelect = useCallback((index: number) => {
    scrollToLandingPanel(index);
    setActivePanel(index);
  }, []);

  useLandingSnapScroll(!useLightEffects, setActivePanel);

  return (
    <LandingRedirect>
      <LandingBackdrop />
      <div className="relative z-10">
        <LandingHeader />
        <main>
          <LandingHero />
          <LandingWorkflow />
          <LandingFeatures />
          <LandingTechStack />
        </main>
        {!useLightEffects && (
          <LandingPagination
            activeIndex={activePanel}
            onSelect={handlePanelSelect}
          />
        )}
        <LandingFooter />
      </div>
    </LandingRedirect>
  );
}
