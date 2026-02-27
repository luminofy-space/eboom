"use client";

import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Combobox,
    ComboboxCollection,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
} from "@/components/ui/combobox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectWalletModal, closeWalletModal } from "@/src/redux/walletSlice";
import { useEffect } from "react";

interface WalletFormData {
    name: string;
    walletCategoryId: number | null;
    walletNumber: string;
    description: string;
}

const defaultValues: WalletFormData = {
    name: "",
    walletCategoryId: null,
    walletNumber: "",
    description: "",
};

export function NewWalletModal() {
    const dispatch = useAppDispatch();
    const { open, mode, editingItem } = useAppSelector(selectWalletModal);
    const isEdit = mode === "edit";
    const { canvas } = useCanvas();

    const { register, handleSubmit, control, reset, watch } = useForm<WalletFormData>({
        defaultValues,
    });

    const name = watch("name");
    const walletCategoryId = watch("walletCategoryId");

    // Fetch wallet categories
    const { data: categoriesRes, isLoading: isLoadingCategories } =
        useQueryApi<{
            categories?: { id: number; name: string }[];
        }>(API_ROUTES.WALLET_CATEGORIES, {
            queryKey: ["wallet-categories", "metadata"],
            hasToken: true,
            enabled: open,
        });

    const categories = categoriesRes?.categories ?? [];
    const categoryNames = categories.map((c) => c.name);
    const categoryNameToId = (catName: string) =>
        categories.find((c) => c.name === catName)?.id ?? null;
    const categoryIdToName = (id: number | null) =>
        id !== null ? categories.find((c) => c.id === id)?.name ?? "" : "";

    // Mutations
    const { mutateAsync: createWallet } = useMutationApi(
        API_ROUTES.CANVASES_WALLETS_CREATE(canvas ?? -1),
        {
            method: "post",
            hasToken: true,
        }
    );

    const { mutateAsync: updateWallet } = useMutationApi(
        editingItem ? API_ROUTES.WALLETS_UPDATE(editingItem.id) : "",
        {
            method: "put",
            hasToken: true,
        }
    );

    // Populate form when editing, reset when creating
    useEffect(() => {
        if (open && isEdit && editingItem) {
            reset({
                name: editingItem.name ?? "",
                walletCategoryId: editingItem.walletCategoryId ?? null,
                walletNumber: editingItem.walletNumber ?? "",
                description: editingItem.description ?? "",
            });
        } else if (open && !isEdit) {
            reset(defaultValues);
        }
    }, [open, isEdit, editingItem, reset]);

    const handleClose = (openState: boolean) => {
        if (!openState) {
            dispatch(closeWalletModal());
            reset(defaultValues);
        }
    };

    const onSubmit = async (formData: WalletFormData) => {
        try {
            const data = {
                name: formData.name,
                walletCategoryId: formData.walletCategoryId,
                walletNumber: formData.walletNumber,
                description: formData.description,
            };

            if (isEdit) {
                await updateWallet(data);
            } else {
                await createWallet(data);
            }

            reset(defaultValues);
            dispatch(closeWalletModal());
        } catch (error) {
            console.error("Error saving wallet:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-full">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Edit Wallet" : "Add New Wallet"}</DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? "Update the details of your wallet."
                                : "Enter the details below to create a new wallet. Organize your accounts and keep track of your financial sources."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Row 1 */}
                    <div className="flex flex-row gap-5">
                        <div className="w-1/2 flex flex-col gap-1">
                            <Label htmlFor="wallet-name">Wallet Name</Label>
                            <Input
                                id="wallet-name"
                                placeholder="e.g. Main Bank Account"
                                {...register("name", { required: true })}
                            />
                        </div>

                        <div className="w-1/2 flex flex-col gap-1">
                            <Label htmlFor="wallet-category">Wallet Category</Label>
                            <Controller
                                name="walletCategoryId"
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Combobox
                                        id="wallet-category"
                                        items={categoryNames}
                                        value={categoryIdToName(field.value)}
                                        disabled={isLoadingCategories}
                                        onValueChange={(val) =>
                                            field.onChange(val ? categoryNameToId(val) : null)
                                        }
                                    >
                                        <ComboboxInput placeholder="Select a category" />
                                        <ComboboxContent className="z-[80]">
                                            <ComboboxEmpty>No categories found.</ComboboxEmpty>
                                            <ComboboxCollection>
                                                {(catName) => (
                                                    <ComboboxItem key={catName} value={catName}>
                                                        {catName}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxCollection>
                                        </ComboboxContent>
                                    </Combobox>
                                )}
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-row gap-5 mt-4">
                        <div className="w-1/2 flex flex-col gap-1">
                            <Label htmlFor="wallet-number">Wallet Number</Label>
                            <Input
                                id="wallet-number"
                                placeholder="e.g. 1234-5678-9012"
                                {...register("walletNumber")}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-row gap-5 mt-4">
                        <div className="w-full flex flex-col gap-1">
                            <Label htmlFor="wallet-description">Description</Label>
                            <Input
                                id="wallet-description"
                                placeholder="Optional notes about this wallet"
                                {...register("description")}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            disabled={!name || !walletCategoryId}
                            type="submit"
                        >
                            {isEdit ? "Save changes" : "Create Wallet"}
                        </Button>
                    </DialogFooter>
            </form>
                </DialogContent>
        </Dialog>
    );
}
