"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useInfiniteList } from "@/src/hooks/useInfiniteList";
import { useAppSelector } from "@/src/redux/store";
import { selectSearchQuery } from "@/src/redux/searchSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { NewExpenseModal } from "./components/NewExpenseModal";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";

interface Expense {
  id: number;
  name: string;
  description?: string;
  expenseType?: string;
  photoUrl?: string | null;
  lastModifiedAt?: string | null;
  category?: {
    id: number;
    name: string;
    photoUrl?: string | null;
  } | null;
}

export default function ExpensesListPage() {
  const { canvas } = useCanvas();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [open, setOpen] = useState(false);

  const {
    items,
    isLoading,
    isFetchingNextPage,
    sentinelRef,
  } = useInfiniteList<Expense>(
    canvas ? API_ROUTES.CANVASES_EXPENSES_LIST(canvas) : "",
    {
      queryKey: ["expenses", canvas],
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
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-[375px] flex flex-col items-center justify-center gap-3 py-8">
            <div className="text-center text-2xl font-semibold">Add Expense</div>
            <div className="text-center text-sm text-muted-foreground">
              Track your spending and manage your budgets.
            </div>
            <Button className="w-[80%] min-h-[40px]" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </Card>
        </div>
        <NewExpenseModal open={open} setOpen={setOpen} />
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
        {items.map((expense) => (
          <GridCard
            key={expense.id}
            href={`/expense/${expense.id}`}
            imageUrl={expense.photoUrl || expense.category?.photoUrl}
            title={expense.name}
            updatedAt={expense.lastModifiedAt}
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
      <NewExpenseModal open={open} setOpen={setOpen} />
    </>
  );
}
