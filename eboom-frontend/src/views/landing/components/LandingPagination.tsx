"use client";

import { cn } from "@/lib/utils";

type LandingPaginationProps = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

const PANEL_LABELS = ["Hero", "How it works", "Features", "Tech stack"];

export function LandingPagination({
  activeIndex,
  onSelect,
}: LandingPaginationProps) {
  return (
    <nav
      aria-label="Page sections"
      className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex"
    >
      {PANEL_LABELS.map((label, index) => (
        <button
          key={label}
          type="button"
          aria-label={`Go to ${label}`}
          aria-current={activeIndex === index ? "true" : undefined}
          onClick={() => onSelect(index)}
          className={cn(
            "h-2 w-2 cursor-pointer rounded-full transition-all",
            activeIndex === index
              ? "scale-125 bg-primary"
              : "bg-white/30 hover:bg-white/50"
          )}
        />
      ))}
    </nav>
  );
}
