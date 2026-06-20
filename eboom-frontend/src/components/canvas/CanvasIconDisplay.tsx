"use client";

import { parseCanvasIcon } from "@/src/components/canvas/canvasUtils";

export function CanvasIcon({
  photoUrl,
  size = "md",
}: {
  photoUrl?: string;
  size?: "sm" | "md";
}) {
  const { emoji, color } = parseCanvasIcon(photoUrl);
  const sizeClass = size === "sm" ? "size-6 text-sm" : "size-10 text-xl";

  return (
    <div
      className={`flex shrink-0 aspect-square ${sizeClass} items-center justify-center rounded-lg select-none`}
      style={{ backgroundColor: color }}
    >
      {emoji}
    </div>
  );
}
