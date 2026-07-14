"use client";

import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import { useLandingLightEffects } from "@/hooks/use-landing-light-effects";
import { cn } from "@/lib/utils";

type LandingRevealProps = {
  children: string;
  className?: string;
};

export function LandingReveal({ children, className }: LandingRevealProps) {
  const useLightEffects = useLandingLightEffects();

  if (useLightEffects) {
    return <span className={className}>{children}</span>;
  }

  return (
    <ScrollReveal
      baseRotation={2}
      baseOpacity={0.15}
      blurStrength={3}
      textClassName={cn(className)}
    >
      {children}
    </ScrollReveal>
  );
}
