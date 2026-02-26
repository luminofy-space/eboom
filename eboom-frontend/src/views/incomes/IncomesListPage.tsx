"use client";

import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useInfiniteList } from "@/src/hooks/useInfiniteList";
import { useAppSelector } from "@/src/redux/store";
import { selectSearchQuery } from "@/src/redux/searchSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";
import { NewIncomeModal } from "./component/NewIncomeModal";
import AddIncomeButton from "./component/AddIncomeButton";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";
import { Loader2 } from "lucide-react";

interface IncomeResource {
  id: number;
  name: string;
  isRecurring: boolean;
  description?: string;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  category?: {
    id: number;
    name: string;
    photoUrl?: string | null;
  } | null;
}

export default function IncomesListPage() {
  const { canvas } = useCanvas();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [open, setOpen] = useState(false);

  const {
    items,
    isLoading,
    isFetchingNextPage,
    sentinelRef,
  } = useInfiniteList<IncomeResource>(
    canvas ? API_ROUTES.CANVASES_INCOME_RESOURCES_LIST(canvas) : "",
    {
      queryKey: ["income-resources", canvas],
      enabled: !!canvas,
      search: debouncedSearch,
    }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GridCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0 && !searchQuery) {
    return (
      <>
        <AddIncomeButton onClick={() => setOpen(true)} />
        <NewIncomeModal open={open} setOpen={setOpen} />
      </>
    );
  }

  if (items.length === 0 && searchQuery) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-muted-foreground">No results found for &ldquo;{searchQuery}&rdquo;</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((resource) => (
          <GridCard
            key={resource.id}
            href={`/income/${resource.id}`}
            imageUrl={resource.photoUrl || resource.category?.photoUrl}
            title={resource.name}
            updatedAt={resource.lastModifiedAt}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <FloatingAddButton onClick={() => setOpen(true)} />
      <NewIncomeModal open={open} setOpen={setOpen} />
    </>
  );
}
