"use client";

import ScrollReveal from "@/components/ScrollReveal/ScrollReveal";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type LandingRevealProps = {
  children: string;
  className?: string;
};

export function LandingReveal({ children, className }: LandingRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
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
