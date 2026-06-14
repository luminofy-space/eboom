import * as React from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const containerVariants = cva("px-4 lg:px-6");

type ContainerProps = React.ComponentProps<"div"> & {
  asChild?: boolean;
};

function Container({ className, asChild = false, ...props }: ContainerProps) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="container"
      className={cn(containerVariants(), className)}
      {...props}
    />
  );
}

export { Container, containerVariants };
