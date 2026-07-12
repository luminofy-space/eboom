"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export const ILLUSTRATIONS = {
  empty: "/assets/empty.svg",
  "404": "/assets/404.svg",
  serverDown: "/assets/server_down.svg",
  noWallets: "/assets/no_wallets.svg",
  noCanvas: "/assets/no_canvas.svg",
  noNotifications: "/assets/no_notifications.svg",
  upcoming: "/assets/upcomming.svg",
} as const;

export type IllustrationKey = keyof typeof ILLUSTRATIONS;

const ILLUSTRATION_ALT_KEYS: Record<IllustrationKey, string> = {
  empty: "illustrations.emptyAlt",
  "404": "illustrations.notFoundAlt",
  serverDown: "illustrations.serverDownAlt",
  noWallets: "illustrations.noWalletsAlt",
  noCanvas: "illustrations.noCanvasAlt",
  noNotifications: "illustrations.noNotificationsAlt",
  upcoming: "illustrations.upcomingAlt",
};

const SIZE_WIDTH = {
  xs: 120,
  sm: 180,
  md: 220,
  lg: 260,
  xl: 320,
} as const;

const SIZE_MAX_HEIGHT = {
  xs: 72,
  sm: 112,
  md: 144,
  lg: 176,
  xl: 220,
} as const;

const COMPACT_SIZE_WIDTH = {
  xs: 100,
  sm: 120,
  md: 160,
  lg: 200,
  xl: 240,
} as const;

const COMPACT_SIZE_MAX_HEIGHT = {
  xs: 56,
  sm: 72,
  md: 96,
  lg: 120,
  xl: 144,
} as const;

export interface IllustratedStateProps {
  illustration: IllustrationKey;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  size?: keyof typeof SIZE_WIDTH;
  density?: "default" | "compact";
  layout?: "centered" | "card";
  priority?: boolean;
  fill?: boolean;
  className?: string;
}

export function IllustratedState({
  illustration,
  title,
  description,
  action,
  size = "md",
  density = "default",
  layout = "centered",
  priority = false,
  fill = true,
  className,
}: IllustratedStateProps) {
  const { t } = useTranslation("common");
  const isCompact = density === "compact";
  const sizeMap = isCompact ? COMPACT_SIZE_WIDTH : SIZE_WIDTH;
  const maxHeightMap = isCompact ? COMPACT_SIZE_MAX_HEIGHT : SIZE_MAX_HEIGHT;
  const imageWidth = sizeMap[size];
  const imageMaxHeight = maxHeightMap[size];
  const titleVariant = isCompact ? "body-sm" : "heading";
  const descriptionVariant = "caption" as const;
  const stackGap = isCompact ? 2 : 3;
  const textGap = description ? (isCompact ? 1 : 2) : 1;

  const content = (
    <Stack align="center" gap={stackGap} className={cn("text-center", className)}>
      <Image
        src={ILLUSTRATIONS[illustration]}
        alt={t(ILLUSTRATION_ALT_KEYS[illustration])}
        width={imageWidth}
        height={imageWidth}
        priority={priority}
        className="h-auto w-auto object-contain"
        style={{ maxHeight: imageMaxHeight, maxWidth: imageWidth }}
      />
      <Stack align="center" gap={textGap}>
        <Typography
          variant={titleVariant}
          as="h2"
          className={cn("text-center", isCompact && "text-muted-foreground font-normal")}
        >
          {title}
        </Typography>
        {description ? (
          <Typography variant={descriptionVariant} className="max-w-md text-center">
            {description}
          </Typography>
        ) : null}
      </Stack>
      {action}
    </Stack>
  );

  if (layout === "card") {
    return (
      <Card className="w-[375px] py-6">
        {content}
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4",
        isCompact ? "gap-3" : "gap-6",
        fill && "flex-1"
      )}
    >
      {content}
    </div>
  );
}
