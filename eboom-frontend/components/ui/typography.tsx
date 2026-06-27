import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const typographyVariants = cva("", {
  variants: {
    variant: {
      display: "text-3xl font-bold tracking-tight",
      heading: "text-lg font-semibold",
      title: "text-2xl font-semibold",
      body: "text-base",
      "body-sm": "text-sm",
      muted: "text-muted-foreground",
      "muted-sm": "text-muted-foreground text-sm",
      caption: "text-muted-foreground text-xs",
      label: "font-medium",
      stat: "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl",
      count: "text-muted-foreground text-sm tabular-nums",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

const defaultElements = {
  display: "h1",
  heading: "h2",
  title: "p",
  body: "p",
  "body-sm": "p",
  muted: "p",
  "muted-sm": "p",
  caption: "span",
  label: "span",
  stat: "span",
  count: "p",
} as const;

type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;

type TypographyProps = React.ComponentProps<"p"> &
  VariantProps<typeof typographyVariants> & {
    as?: React.ElementType;
    asChild?: boolean;
  };

function Typography({
  className,
  variant = "body",
  as,
  asChild = false,
  ...props
}: TypographyProps) {
  const Comp = asChild
    ? Slot.Root
    : (as ?? defaultElements[variant as TypographyVariant] ?? "p");

  return (
    <Comp
      data-slot="typography"
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Typography, typographyVariants };
