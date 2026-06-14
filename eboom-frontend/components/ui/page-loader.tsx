import { Stack } from "@/components/ui/stack";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  className?: string;
};

function PageLoader({ className }: PageLoaderProps) {
  return (
    <Stack
      className={cn("min-h-[50vh] flex-1", className)}
      align="center"
      justify="center"
    >
      <Spinner className="size-8 text-muted-foreground" />
    </Stack>
  );
}

export { PageLoader };
