"use client";

import Image from "next/image";
import { Typography } from "@/components/ui/typography";

interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
}

export function ComingSoonPlaceholder({
  title,
  description,
}: ComingSoonPlaceholderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
      <Image
        src="/upcomming.svg"
        alt="Coming Soon"
        width={300}
        height={300}
        priority
      />
      <div className="text-center max-w-md">
        <Typography variant="title" as="h1" className="mb-2">{title}</Typography>
        <Typography variant="muted-sm">{description}</Typography>
      </div>
    </div>
  );
}
