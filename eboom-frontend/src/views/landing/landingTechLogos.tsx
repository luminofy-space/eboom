"use client";

import StackIcon, { type IconName } from "tech-stack-icons";
import type { LogoItem } from "@/components/LogoLoop/LogoLoop";
import { TECH_STACK } from "@/src/views/landing/landingConfig";

function TechStackIcon({ name, label }: { name: IconName; label: string }) {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center"
      title={label}
    >
      <StackIcon name={name} variant="dark" className="h-full w-full" />
    </div>
  );
}

export const TECH_LOGOS: LogoItem[] = TECH_STACK.map((tech) => {
  if (tech.iconName) {
    return {
      node: <TechStackIcon name={tech.iconName} label={tech.name} />,
      ariaLabel: tech.name,
      title: tech.name,
    };
  }

  return {
    node: (
      <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground/90 backdrop-blur-sm">
        {tech.label ?? tech.name}
      </span>
    ),
    ariaLabel: tech.name,
  };
});
