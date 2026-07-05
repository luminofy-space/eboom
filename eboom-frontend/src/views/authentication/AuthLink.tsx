import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
    </Link>
  );
}
