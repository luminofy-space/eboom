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
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
} as const;

type GapValue = keyof typeof gapMap;

const stackVariants = cva("flex", {
  variants: {
    direction: {
      column: "flex-col",
      row: "flex-row",
    },
    gap: gapMap,
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: {
      true: "flex-wrap",
      false: "",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: 4,
    wrap: false,
  },
});

type StackProps = React.ComponentProps<"div"> &
  VariantProps<typeof stackVariants> & {
    asChild?: boolean;
    gap?: GapValue;
  };

function Stack({
  className,
  direction,
  gap,
  align,
  justify,
  wrap,
  asChild = false,
  ...props
}: StackProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="stack"
      className={cn(stackVariants({ direction, gap, align, justify, wrap }), className)}
      {...props}
    />
  );
}

export { Stack, stackVariants };
