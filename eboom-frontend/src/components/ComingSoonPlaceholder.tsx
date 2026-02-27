"use client";

import Image from "next/image";

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
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
