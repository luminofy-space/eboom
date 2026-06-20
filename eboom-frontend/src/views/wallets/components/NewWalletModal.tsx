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
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectWalletModal, closeWalletModal } from "@/src/redux/walletSlice";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface WalletFormData {
    name: string;
    walletCategoryId: number | null;
    description: string;
}

const defaultValues: WalletFormData = {
    name: "",
    walletCategoryId: null,
    description: "",
};

export function NewWalletModal() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation("wallets");
    const { t: tc } = useTranslation("common");
    const { open, mode, editingItem } = useAppSelector(selectWalletModal);
    const isEdit = mode === "edit";
    const { canvas } = useCanvas();

    const { register, handleSubmit, control, reset, watch } = useForm<WalletFormData>({
        defaultValues,
    });

    const name = watch("name");
    const walletCategoryId = watch("walletCategoryId");

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

    useEffect(() => {
        if (open && isEdit && editingItem) {
            reset({
                name: editingItem.name ?? "",
                walletCategoryId: editingItem.walletCategoryId ?? null,
                description: typeof editingItem.description === "string" ? editingItem.description : "",
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
            <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup className="gap-4">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t("modal.edit.title") : t("modal.create.title")}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? t("modal.edit.description") : t("modal.create.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <Stack direction="row" gap={5}>
                        <Field className="flex-1">
                            <FieldLabel htmlFor="wallet-name">{t("modal.fields.name.label")}</FieldLabel>
                            <Input
                                id="wallet-name"
                                placeholder={t("modal.fields.name.placeholder")}
                                {...register("name", { required: true })}
                            />
                        </Field>

                        <Field className="flex-1">
                            <FieldLabel htmlFor="wallet-category">{t("modal.fields.category.label")}</FieldLabel>
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
                                        <ComboboxInput placeholder={tc("placeholders.selectCategory")} />
                                        <ComboboxContent className="z-[80]">
                                            <ComboboxEmpty>{tc("empty.noCategoriesFound")}</ComboboxEmpty>
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
                        </Field>
                    </Stack>

                    <Field>
                        <FieldLabel htmlFor="wallet-description">{t("modal.fields.description.label")}</FieldLabel>
                        <Input
                            id="wallet-description"
                            placeholder={t("modal.fields.description.placeholder")}
                            {...register("description")}
                        />
                    </Field>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{tc("actions.cancel")}</Button>
                        </DialogClose>
                        <Button
                            disabled={!name || !walletCategoryId}
                            type="submit"
                        >
                            {isEdit ? t("modal.submit.edit") : t("modal.submit.create")}
                        </Button>
                    </DialogFooter>
                    </FieldGroup>
            </form>
                </DialogContent>
        </Dialog>
    );
}
