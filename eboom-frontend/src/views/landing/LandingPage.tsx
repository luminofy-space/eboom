"use client";

import { useCallback, useState } from "react";
import { LandingBackdrop } from "@/src/views/landing/components/LandingBackdrop";
import { LandingFeatures } from "@/src/views/landing/components/LandingFeatures";
import { LandingFooter } from "@/src/views/landing/components/LandingFooter";
import { LandingHeader } from "@/src/views/landing/components/LandingHeader";
import { LandingHero } from "@/src/views/landing/components/LandingHero";
import { LandingPagination } from "@/src/views/landing/components/LandingPagination";
import { LandingRedirect } from "@/src/views/landing/components/LandingRedirect";
import { LandingTechStack } from "@/src/views/landing/components/LandingTechStack";
import { LandingWorkflow } from "@/src/views/landing/components/LandingWorkflow";
import {
  scrollToLandingPanel,
  useLandingSnapScroll,
} from "@/src/views/landing/hooks/useLandingSnapScroll";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export default function LandingPage() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activePanel, setActivePanel] = useState(0);

  const handlePanelSelect = useCallback((index: number) => {
    scrollToLandingPanel(index);
    setActivePanel(index);
  }, []);

  useLandingSnapScroll(!prefersReducedMotion, setActivePanel);

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
        {!prefersReducedMotion && (
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
