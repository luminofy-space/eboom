import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const gapMap = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  7: "gap-7",
  8: "gap-8",
} as const;

type GapValue = keyof typeof gapMap;

const gridVariants = cva("grid", {
  variants: {
    variant: {
      cards: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      stats:
        "*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4",
      none: "",
    },
    gap: gapMap,
  },
  defaultVariants: {
    variant: "none",
    gap: 4,
  },
});

type GridProps = React.ComponentProps<"div"> &
  VariantProps<typeof gridVariants> & {
    asChild?: boolean;
    gap?: GapValue;
  };

function Grid({
  className,
  variant,
  gap,
  asChild = false,
  ...props
}: GridProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="grid"
      className={cn(gridVariants({ variant, gap }), className)}
      {...props}
    />
  );
}

export { Grid, gridVariants };
