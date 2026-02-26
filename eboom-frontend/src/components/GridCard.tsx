"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatRelativeEdit } from "@/src/utils/date";

interface GridCardProps {
  href: string;
  imageUrl?: string | null;
  title: string;
  updatedAt?: string | Date | null;
  className?: string;
}

export function GridCard({ href, imageUrl, title, updatedAt, className }: GridCardProps) {
  return (
    <Link href={href} className={cn("block group", className)}>
      <Card
        className={cn(
          "relative aspect-[4/3] overflow-hidden p-0 gap-0",
          "transition-transform group-hover:scale-[1.02]",
          !imageUrl && "bg-gradient-to-br from-muted to-accent"
        )}
      >
        {imageUrl && (
          <CardContent className="absolute inset-0 p-0">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          </CardContent>
        )}

        {/* Dark gradient overlay at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

        <CardFooter className="absolute inset-x-0 bottom-0 p-3 flex-col items-start gap-0">
          <h3 className="text-white font-semibold text-sm truncate w-full">{title}</h3>
          {updatedAt && (
            <p className="text-white/70 text-xs mt-0.5">
              {formatRelativeEdit(updatedAt)}
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
