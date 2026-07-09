"use client";

import API_ROUTES from "@/src/api/urls";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useInfiniteList } from "@/src/hooks/useInfiniteList";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectSearchQuery } from "@/src/redux/searchSlice";
import {
  openWalletCreateModal,
  openWalletEditModal,
  type WalletItem,
} from "@/src/redux/walletSlice";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutationApi } from "@/src/api/useMutation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Stack } from "@/components/ui/stack";
import { Spinner } from "@/components/ui/spinner";
import { Typography } from "@/components/ui/typography";
import { Plus } from "lucide-react";
import { NewWalletModal } from "./components/NewWalletModal";
import { GridCard } from "@/src/components/GridCard";
import { GridCardSkeleton } from "@/src/components/GridCardSkeleton";
import { FloatingAddButton } from "@/src/components/FloatingAddButton";
import { ConfirmDeleteDialog } from "@/src/components/ConfirmDeleteDialog";
import { useTranslation } from "react-i18next";


export default function WalletsListPage() {
  const { t } = useTranslation("wallets");
  const { t: tc } = useTranslation("common");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    items,
    isLoading,
    isFetching,
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

  const { mutate: deleteWallet, isPending: isDeleting } = useMutationApi(
    (id: number) => API_ROUTES.WALLETS_DELETE(canvas!, id),
    { method: "delete", successKey: "success.wallet.deleted", onSuccess: () => setDeleteId(null) }
  );

  const showLoading = isLoading || (isFetching && items.length === 0);

  if (showLoading) {
    return (
      <Container>
        <Grid variant="cards" gap={4}>
          {Array.from({ length: 8 }).map((_, i) => (
            <GridCardSkeleton key={i} />
          ))}
        </Grid>
      </Container>
    );
  }

  if (items.length === 0 && !searchQuery) {
    return (
      <>
        <Stack className="flex-1" align="center" justify="center">
          <Card className="w-[375px] py-8">
            <Stack align="center" gap={3}>
              <Typography variant="title" className="text-center">{t("list.empty.title")}</Typography>
              <Typography variant="muted-sm" className="text-center">
                {t("list.empty.description")}
              </Typography>
              {canEdit && (
              <Button className="w-[80%] min-h-[40px]" onClick={() => dispatch(openWalletCreateModal())}>
                <Plus className="mr-2 h-4 w-4" />
                {tc("actions.add")}
              </Button>
              )}
            </Stack>
          </Card>
        </Stack>
        <NewWalletModal />
      </>
    );
  }

  if (items.length === 0 && searchQuery) {
    return (
      <Stack className="flex-1" align="center" justify="center">
        <Typography variant="muted">{tc("empty.noResults", { query: searchQuery })}</Typography>
      </Stack>
    );
  }

  return (
    <>
      <Container>
        <Grid variant="cards" gap={4}>
          {items.map((wallet) => (
            <GridCard
              key={wallet.id}
              href={`/wallet/${wallet.id}`}
              imageUrl={wallet.photoUrl}
              title={wallet.name}
              updatedAt={wallet.lastModifiedAt}
              onEdit={canEdit ? () => dispatch(openWalletEditModal(wallet)) : undefined}
              onDelete={canEdit ? () => setDeleteId(wallet.id) : undefined}
            />
          ))}
        </Grid>
      </Container>

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <Stack direction="row" justify="center" className="py-4">
          <Spinner className="size-6 text-muted-foreground" />
        </Stack>
      )}

      {canEdit && <FloatingAddButton onClick={() => dispatch(openWalletCreateModal())} />}
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
