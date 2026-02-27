"use client";

import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useInfiniteList } from "@/src/hooks/useInfiniteList";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectSearchQuery } from "@/src/redux/searchSlice";
import {
  openIncomeCreateModal,
  openIncomeEditModal,
  type IncomeResourceItem,
} from "@/src/redux/incomeSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { NewIncomeModal } from "./component/NewIncomeModal";
import AddIncomeButton from "./component/AddIncomeButton";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { Loader2 } from "lucide-react";

const hasWindow = typeof window !== "undefined";

export default function IncomesListPage() {
  const { canvas } = useCanvas();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    items,
    isLoading,
    isFetchingNextPage,
    sentinelRef,
  } = useInfiniteList<IncomeResourceItem>(
    canvas ? API_ROUTES.CANVASES_INCOME_RESOURCES_LIST(canvas) : "",
    {
      queryKey: ["income-resources", canvas],
      enabled: !!canvas,
      search: debouncedSearch,
    }
  );

  const { mutate: deleteIncome, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.INCOME_RESOURCES_DELETE(id)}`;
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
      await axios.delete(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries();
    },
  });

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
        <AddIncomeButton onClick={() => dispatch(openIncomeCreateModal())} />
        <NewIncomeModal />
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
            onEdit={() => dispatch(openIncomeEditModal(resource))}
            onDelete={() => setDeleteId(resource.id)}
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

      <FloatingAddButton onClick={() => dispatch(openIncomeCreateModal())} />
      <NewIncomeModal />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId !== null) deleteIncome(deleteId); }}
        isDeleting={isDeleting}
      />
    </>
  );
}
