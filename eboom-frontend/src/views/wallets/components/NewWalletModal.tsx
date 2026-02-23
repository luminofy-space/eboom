"use client";

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
import { useState } from "react";

interface NewWalletModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function NewWalletModal({ open, setOpen }: NewWalletModalProps) {
    const { canvas } = useCanvas();

    // 🔹 Fetch wallet categories
    const { data: categoriesRes, isLoading: isLoadingCategories } =
        useQueryApi<{
            categories?: { id: number; name: string }[];
        }>(API_ROUTES.WALLET_CATEGORIES, {
            queryKey: ["wallet-categories", "metadata"],
            hasToken: true
        });

    const categoryItems =
        categoriesRes?.categories
            ?.map((c) => c.id)
            .filter((id): id is number => typeof id === "number") ?? [];

    const categoryDisplayName = (id: number | string) => {
        const parsed = typeof id === "number" ? id : Number(id);
        return (
            categoriesRes?.categories?.find((c) => c.id === parsed)?.name ??
            `${id}`
        );
    };

    // 🔹 Mutation
    const { mutateAsync } = useMutationApi(
        API_ROUTES.CANVASES_WALLETS_CREATE(canvas ?? -1),
        {
            method: "post",
            hasToken: true,
        }
    );

    // 🔹 State
    const [name, setName] = useState("");
    const [walletCategoryId, setWalletCategoryId] = useState<number | null>(null);
    const [walletNumber, setWalletNumber] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await mutateAsync({
                name,
                walletCategoryId,
                walletNumber,
                description,
            });

            // Reset form
            setName("");
            setWalletCategoryId(null);
            setWalletNumber("");
            setDescription("");

            setOpen(false);
        } catch (error) {
            console.error("Error creating wallet:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <form onSubmit={handleSubmit}>
                <DialogContent className="w-full">
                    <DialogHeader>
                        <DialogTitle>Add New Wallet</DialogTitle>
                        <DialogDescription>
                            Enter the details below to create a new wallet. Organize your
                            accounts and keep track of your financial sources.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Row 1 */}
                    <div className="flex flex-row gap-5">
                        <div className="w-1/2 flex flex-col gap-1">
                            <Label htmlFor="wallet-name">Wallet Name</Label>
                            <Input
                                required
                                id="wallet-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Main Bank Account"
                            />
                        </div>

                        <div className="w-1/2 flex flex-col gap-1">
                            <Label htmlFor="wallet-category">Wallet Category</Label>
                            <Combobox
                                id="wallet-category"
                                items={categoryItems.map((id) => id.toString())}
                                value={
                                    walletCategoryId !== null
                                        ? walletCategoryId.toString()
                                        : ""
                                }
                                disabled={isLoadingCategories}
                                onValueChange={(val) =>
                                    setWalletCategoryId(val ? Number(val) : null)
                                }
                            >
                                <ComboboxInput placeholder="Select a category" />
                                <ComboboxContent className="z-[80]">
                                    <ComboboxEmpty>No categories found.</ComboboxEmpty>
                                    <ComboboxCollection>
                                        {(item) => (
                                            <ComboboxItem key={item} value={item}>
                                                {categoryDisplayName(item)}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxCollection>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-row gap-5 mt-4">
                        <div className="w-1/2 flex flex-col gap-1">
                            <Label htmlFor="wallet-number">Wallet Number</Label>
                            <Input
                                id="wallet-number"
                                value={walletNumber}
                                onChange={(e) => setWalletNumber(e.target.value)}
                                placeholder="e.g. 1234-5678-9012"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-row gap-5 mt-4">
                        <div className="w-full flex flex-col gap-1">
                            <Label htmlFor="wallet-description">Description</Label>
                            <Input
                                id="wallet-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional notes about this wallet"
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
                            Create Wallet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
}