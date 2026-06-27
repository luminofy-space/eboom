"use client";

import { useTranslation } from "react-i18next";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { CanvasIcon } from "@/src/components/canvas/CanvasIconDisplay";
import type { Canvas } from "@/src/types/common";

interface CanvasDetailsHeaderProps {
  canvas: Canvas | null;
}

export function CanvasDetailsHeader({ canvas }: CanvasDetailsHeaderProps) {
  const { t } = useTranslation("canvas-members");
  const { t: tc } = useTranslation("canvas");

  if (!canvas) return null;

  const typeLabel =
    canvas.canvasType &&
    tc(`modal.fields.type.options.${canvas.canvasType}`, {
      defaultValue: canvas.canvasType,
    });

  return (
    <Stack direction="row" gap={4} align="start">
      <CanvasIcon photoUrl={canvas.photoUrl ?? undefined} size="md" />
      <Stack className="flex-1 min-w-0" gap={1}>
        <Typography variant="title">{canvas.name}</Typography>
        {canvas.description && (
          <Typography variant="muted-sm">{canvas.description}</Typography>
        )}
        {typeLabel && (
          <Typography variant="muted-sm">
            {t("members.canvasType", { type: typeLabel })}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
