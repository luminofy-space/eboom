"use client";

interface ListInfiniteScrollSentinelProps {
  sentinelRef: (node: HTMLDivElement | null) => void;
}

export function ListInfiniteScrollSentinel({ sentinelRef }: ListInfiniteScrollSentinelProps) {
  return <div ref={sentinelRef} className="h-px w-full" aria-hidden />;
}
