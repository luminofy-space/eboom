import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const centerVariants = cva(
  "flex min-h-svh w-full items-center justify-center p-6 md:p-10",
  {
    variants: {
      maxWidth: {
        sm: "[&>[data-slot=center-content]]:max-w-sm",
        md: "[&>[data-slot=center-content]]:max-w-md",
      },
    },
    defaultVariants: {
      maxWidth: "sm",
    },
  }
);

type CenterProps = React.ComponentProps<"div"> &
  VariantProps<typeof centerVariants> & {
    asChild?: boolean;
  };

function Center({
  className,
  maxWidth,
  asChild = false,
  children,
  ...props
}: CenterProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="center"
      className={cn(centerVariants({ maxWidth }), className)}
      {...props}
    >
      <div data-slot="center-content" className="w-full">
        {children}
      </div>
    </Comp>
  );
}

export { Center, centerVariants };
