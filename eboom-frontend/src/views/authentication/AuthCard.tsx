import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AuthCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border-white/10 bg-[#262626]/80 shadow-xl backdrop-blur-md",
        className
      )}
      {...props}
    />
  );
}
