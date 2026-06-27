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
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { FormSubmitError } from "@/src/components/FormSubmitError";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { selectWalletModal, closeWalletModal } from "@/src/redux/walletSlice";
import { fileToDataUrl, translateSubmitError, validateOptionalImage } from "@/src/utils/formUtils";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface WalletFormData {
    name: string;
    walletCategoryId: number | null;
    description: string;
    photo: File | null;
}

const defaultValues: WalletFormData = {
    name: "",
    walletCategoryId: null,
    description: "",
    photo: null,
};

interface NewWalletModalProps {
    onCreateSuccess?: (entity: { id: number }) => void;
}

export function NewWalletModal({ onCreateSuccess }: NewWalletModalProps) {
    const dispatch = useAppDispatch();
    const { t } = useTranslation("wallets");
    const { t: tc } = useTranslation("common");
    const { t: tv } = useTranslation("validation");
    const { open, mode, editingItem } = useAppSelector(selectWalletModal);
    const isEdit = mode === "edit";
    const { canvas } = useCanvas();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<WalletFormData>({
        defaultValues,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const { data: categoriesRes, isLoading: isLoadingCategories } =
        useQueryApi<{
            categories?: { id: number; name: string }[];
        }>(API_ROUTES.WALLET_CATEGORIES, {
            queryKey: ["wallet-categories", "metadata"],
            hasToken: true,
            enabled: open,
        });

    const categories = categoriesRes?.categories ?? [];
    const categoryIds = categories.map((c) => String(c.id));

    const { mutateAsync: createWallet, isPending: isCreating } = useMutationApi(
        API_ROUTES.CANVASES_WALLETS_CREATE(canvas ?? -1),
        {
            method: "post",
            hasToken: true,
        }
    );

    const { mutateAsync: updateWallet, isPending: isUpdating } = useMutationApi(
        editingItem ? API_ROUTES.WALLETS_UPDATE(editingItem.id) : "",
        {
            method: "put",
            hasToken: true,
        }
    );

    const isSaving = isCreating || isUpdating || isSubmitting;

    useEffect(() => {
        if (open && isEdit && editingItem) {
            reset({
                name: editingItem.name ?? "",
                walletCategoryId: editingItem.walletCategoryId ?? null,
                description: typeof editingItem.description === "string" ? editingItem.description : "",
                photo: null,
            });
        } else if (open && !isEdit) {
            reset(defaultValues);
        }
    }, [open, isEdit, editingItem, reset]);

    const handleClose = (openState: boolean) => {
        if (!openState) {
            dispatch(closeWalletModal());
            reset(defaultValues);
            setSubmitError(null);
        }
    };

    const onSubmit = async (formData: WalletFormData) => {
        setSubmitError(null);

        if (!canvas) {
            setSubmitError(tv("noCanvas"));
            return;
        }

        try {
            const data = {
                name: formData.name.trim(),
                walletCategoryId: formData.walletCategoryId,
                description: formData.description.trim(),
                ...(formData.photo
                    ? { photoUrl: await fileToDataUrl(formData.photo) }
                    : {}),
            };

            if (isEdit) {
                await updateWallet(data);
            } else {
                const response = await createWallet(data);
                const walletId = (response as { wallet?: { id: number } })?.wallet?.id;
                if (typeof walletId === "number") {
                    onCreateSuccess?.({ id: walletId });
                }
            }

            reset(defaultValues);
            setSubmitError(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            dispatch(closeWalletModal());
        } catch (error) {
            setSubmitError(translateSubmitError(error, tv("walletSaveFailed"), tv));
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="w-full">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup className="gap-4">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? t("modal.edit.title") : t("modal.create.title")}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? t("modal.edit.description") : t("modal.create.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <FormSubmitError message={submitError} />

                    <Stack direction="row" gap={5}>
                        <Field className="flex-1">
                            <FieldLabel htmlFor="wallet-name">{t("modal.fields.name.label")}</FieldLabel>
                            <Input
                                id="wallet-name"
                                placeholder={t("modal.fields.name.placeholder")}
                                aria-invalid={!!errors.name}
                                {...register("name", {
                                    required: tv("nameRequired"),
                                    maxLength: {
                                        value: 255,
                                        message: tv("nameMaxLength"),
                                    },
                                    validate: (value) =>
                                        value.trim().length > 0 || tv("nameRequired"),
                                })}
                            />
                            <FieldError errors={[errors.name]} />
                        </Field>

                        <Field className="flex-1">
                            <FieldLabel htmlFor="wallet-category">{t("modal.fields.category.label")}</FieldLabel>
                            <Controller
                                name="walletCategoryId"
                                control={control}
                                rules={{
                                    validate: (value) =>
                                        value !== null || tv("categoryRequired"),
                                }}
                                render={({ field }) => (
                                    <Combobox
                                        id="wallet-category"
                                        items={categoryIds}
                                        value={field.value !== null ? String(field.value) : ""}
                                        disabled={isLoadingCategories}
                                        onValueChange={(val) =>
                                            field.onChange(val ? Number(val) : null)
                                        }
                                    >
                                        <ComboboxInput placeholder={tc("placeholders.selectCategory")} />
                                        <ComboboxContent className="z-[80]">
                                            <ComboboxEmpty>{tc("empty.noCategoriesFound")}</ComboboxEmpty>
                                            <ComboboxCollection>
                                                {(categoryId) => {
                                                    const category = categories.find(
                                                        (c) => String(c.id) === categoryId
                                                    );
                                                    if (!category) return null;
                                                    return (
                                                        <ComboboxItem key={categoryId} value={categoryId}>
                                                            {category.name}
                                                        </ComboboxItem>
                                                    );
                                                }}
                                            </ComboboxCollection>
                                        </ComboboxContent>
                                    </Combobox>
                                )}
                            />
                            <FieldError errors={[errors.walletCategoryId]} />
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

                    <Field>
                        <FieldLabel htmlFor="wallet-photo">{t("modal.fields.photo.label")}</FieldLabel>
                        <Controller
                            name="photo"
                            control={control}
                            rules={{
                                validate: (file) =>
                                    validateOptionalImage(file, {
                                        invalidType: tv("imageInvalidType"),
                                        tooLarge: tv("imageTooLarge"),
                                    }),
                            }}
                            render={({ field }) => (
                                <Input
                                    ref={fileInputRef}
                                    id="wallet-photo"
                                    type="file"
                                    accept="image/*"
                                    aria-invalid={!!errors.photo}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        field.onChange(file);
                                    }}
                                />
                            )}
                        />
                        <FieldError errors={[errors.photo]} />
                    </Field>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSaving}>
                                {tc("actions.cancel")}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="size-4 animate-spin" />}
                            {isSaving
                                ? isEdit
                                  ? tc("actions.saving")
                                  : tc("actions.creating")
                                : isEdit
                                  ? t("modal.submit.edit")
                                  : t("modal.submit.create")}
                        </Button>
                    </DialogFooter>
                    </FieldGroup>
            </form>
                </DialogContent>
        </Dialog>
    );
}
