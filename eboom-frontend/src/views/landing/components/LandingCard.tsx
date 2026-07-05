"use client";

import type { ReactNode } from "react";
import BorderGlow from "@/components/BorderGlow/BorderGlow";
import { cn } from "@/lib/utils";
import { LANDING_CARD_GLOW_PROPS } from "@/src/views/landing/landingConfig";

type LandingCardProps = {
  children: ReactNode;
  className?: string;
};

export function LandingCard({ children, className }: LandingCardProps) {
  return (
    <BorderGlow
      {...LANDING_CARD_GLOW_PROPS}
      className={cn(
        "h-full min-h-[180px] overflow-hidden border-0",
        className
      )}
    >
      <div className="relative z-[1] p-6">{children}</div>
    </BorderGlow>
  );
}
