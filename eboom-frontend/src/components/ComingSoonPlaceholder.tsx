"use client";

import { IllustratedState } from "@/src/components/IllustratedState";

interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
}

export function ComingSoonPlaceholder({
  title,
  description,
}: ComingSoonPlaceholderProps) {
  return (
    <IllustratedState
      illustration="upcoming"
      title={title}
      description={description}
      size="lg"
      priority
    />
  );
}
