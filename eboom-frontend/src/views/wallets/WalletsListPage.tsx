"use client";

import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useInfiniteList } from "@/src/hooks/useInfiniteList";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectSearchQuery } from "@/src/redux/searchSlice";
import {
  openWalletCreateModal,
  openWalletEditModal,
  type WalletItem,
} from "@/src/redux/walletSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { NewWalletModal } from "./components/NewWalletModal";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";

const hasWindow = typeof window !== "undefined";

export default function WalletsListPage() {
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
  } = useInfiniteList<WalletItem>(
    canvas ? API_ROUTES.CANVASES_WALLETS_LIST(canvas) : "",
    {
      queryKey: ["wallets", canvas],
      enabled: !!canvas,
      search: debouncedSearch,
    }
  );

  const { mutate: deleteWallet, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.WALLETS_DELETE(id)}`;
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
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-[375px] flex flex-col items-center justify-center gap-3 py-8">
            <div className="text-center text-2xl font-semibold">Add Wallet</div>
            <div className="text-center text-sm text-muted-foreground">
              Create wallets to manage your assets.
            </div>
            <Button className="w-[80%] min-h-[40px]" onClick={() => dispatch(openWalletCreateModal())}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </Card>
        </div>
        <NewWalletModal />
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
        {items.map((wallet) => (
          <GridCard
            key={wallet.id}
            href={`/wallet/${wallet.id}`}
            imageUrl={wallet.photoUrl || wallet.category?.photoUrl}
            title={wallet.name}
            updatedAt={wallet.lastModifiedAt}
            onEdit={() => dispatch(openWalletEditModal(wallet))}
            onDelete={() => setDeleteId(wallet.id)}
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

      <FloatingAddButton onClick={() => dispatch(openWalletCreateModal())} />
      <NewWalletModal />

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={() => { if (deleteId !== null) deleteWallet(deleteId); }}
        isDeleting={isDeleting}
      />
    </>
  );
}
