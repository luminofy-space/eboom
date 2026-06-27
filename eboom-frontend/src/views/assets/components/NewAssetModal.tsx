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
import { selectAssetModal, closeAssetModal } from "@/src/redux/assetSlice";
import { fileToDataUrl, translateSubmitError, validateOptionalImage } from "@/src/utils/formUtils";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface AssetFormData {
  name: string;
  assetCategoryId: number | null;
  currencyId: number | null;
  estimatedValue: string;
  description: string;
  photo: File | null;
}

const defaultValues: AssetFormData = {
  name: "",
  assetCategoryId: null,
  currencyId: null,
  estimatedValue: "",
  description: "",
  photo: null,
};

export function NewAssetModal() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("assets");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("assets", { keyPrefix: "validation" });
  const { open, mode, editingItem } = useAppSelector(selectAssetModal);
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
  } = useForm<AssetFormData>({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { data: categoriesRes, isLoading: isLoadingCategories } = useQueryApi<{
    categories?: { id: number; name: string }[];
  }>(API_ROUTES.ASSET_CATEGORIES, {
    queryKey: ["asset-categories"],
    hasToken: true,
    enabled: open,
  });

  const { data: currenciesRes, isLoading: isLoadingCurrencies } = useQueryApi<{
    currencies?: { id: number; name: string; code: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
    enabled: open,
  });

  const categories = categoriesRes?.categories ?? [];
  const categoryIds = categories.map((c) => String(c.id));

  const currencies = currenciesRes?.currencies ?? [];
  const currencyLabels = currencies.map((c) => `${c.code} – ${c.name}`);
  const currencyIdToLabel = (id: number | null) => {
    if (id === null) return "";
    const c = currencies.find((cur) => cur.id === id);
    return c ? `${c.code} – ${c.name}` : "";
  };
  const currencyLabelToId = (label: string) => {
    const code = label.split(" – ")[0];
    return currencies.find((c) => c.code === code)?.id ?? null;
  };

  const { mutateAsync: createAsset, isPending: isCreating } = useMutationApi(
    API_ROUTES.CANVASES_ASSETS_CREATE(canvas ?? -1),
    {
      method: "post",
      hasToken: true,
    }
  );

  const { mutateAsync: updateAsset, isPending: isUpdating } = useMutationApi(
    editingItem ? API_ROUTES.ASSETS_UPDATE(editingItem.id) : "",
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
        assetCategoryId: editingItem.assetCategoryId ?? editingItem.category?.id ?? null,
        currencyId: editingItem.currencyId ?? editingItem.currency?.id ?? null,
        estimatedValue: editingItem.estimatedValue ?? "",
        description:
          typeof editingItem.description === "string" ? editingItem.description : "",
        photo: null,
      });
    } else if (open && !isEdit) {
      reset(defaultValues);
    }
  }, [open, isEdit, editingItem, reset]);

  const handleClose = (openState: boolean) => {
    if (!openState) {
      dispatch(closeAssetModal());
      reset(defaultValues);
      setSubmitError(null);
    }
  };

  const onSubmit = async (formData: AssetFormData) => {
    setSubmitError(null);

    if (!canvas) {
      setSubmitError(tv("noCanvas"));
      return;
    }

    try {
      const data = {
        name: formData.name.trim(),
        assetCategoryId: formData.assetCategoryId,
        currencyId: formData.currencyId,
        estimatedValue: formData.estimatedValue.trim(),
        description: formData.description.trim(),
        ...(formData.photo ? { photoUrl: await fileToDataUrl(formData.photo) } : {}),
      };

      if (isEdit) {
        await updateAsset(data);
      } else {
        await createAsset(data);
      }

      reset(defaultValues);
      setSubmitError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      dispatch(closeAssetModal());
    } catch (error) {
      setSubmitError(translateSubmitError(error, t("modal.error.saveFailed"), tv));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? t("modal.edit.title") : t("modal.create.title")}
              </DialogTitle>
              <DialogDescription>
                {isEdit ? t("modal.edit.description") : t("modal.create.description")}
              </DialogDescription>
            </DialogHeader>

            <FormSubmitError message={submitError} />

            <Stack direction="row" gap={5}>
              <Field className="flex-1">
                <FieldLabel htmlFor="asset-name">{t("modal.fields.name.label")}</FieldLabel>
                <Input
                  id="asset-name"
                  placeholder={t("modal.fields.name.placeholder")}
                  aria-invalid={!!errors.name}
                  {...register("name", {
                    required: tv("nameRequired"),
                    maxLength: {
                      value: 255,
                      message: tv("nameMaxLength"),
                    },
                    validate: (value) => value.trim().length > 0 || tv("nameRequired"),
                  })}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field className="flex-1">
                <FieldLabel htmlFor="asset-category">{t("modal.fields.category.label")}</FieldLabel>
                <Controller
                  name="assetCategoryId"
                  control={control}
                  rules={{
                    validate: (value) => value !== null || tv("categoryRequired"),
                  }}
                  render={({ field }) => (
                    <Combobox
                      id="asset-category"
                      items={categoryIds}
                      value={field.value !== null ? String(field.value) : ""}
                      disabled={isLoadingCategories}
                      onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                    >
                      <ComboboxInput placeholder={tc("placeholders.selectCategory")} />
                      <ComboboxContent className="z-[80]">
                        <ComboboxEmpty>{tc("empty.noCategoriesFound")}</ComboboxEmpty>
                        <ComboboxCollection>
                          {(categoryId) => {
                            const category = categories.find((c) => String(c.id) === categoryId);
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
                <FieldError errors={[errors.assetCategoryId]} />
              </Field>
            </Stack>

            <Stack direction="row" gap={5}>
              <Field className="flex-1">
                <FieldLabel htmlFor="asset-currency">{t("modal.fields.currency.label")}</FieldLabel>
                <Controller
                  name="currencyId"
                  control={control}
                  rules={{
                    validate: (value) => value !== null || tv("currencyRequired"),
                  }}
                  render={({ field }) => (
                    <Combobox
                      id="asset-currency"
                      items={currencyLabels}
                      value={currencyIdToLabel(field.value)}
                      disabled={isLoadingCurrencies}
                      onValueChange={(label) =>
                        field.onChange(label ? currencyLabelToId(label) : null)
                      }
                    >
                      <ComboboxInput placeholder={tc("placeholders.selectCurrency")} />
                      <ComboboxContent className="z-[80]">
                        <ComboboxEmpty>{tc("empty.noCurrenciesFound")}</ComboboxEmpty>
                        <ComboboxCollection>
                          {(label) => (
                            <ComboboxItem key={label} value={label}>
                              {label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxContent>
                    </Combobox>
                  )}
                />
                <FieldError errors={[errors.currencyId]} />
              </Field>

              <Field className="flex-1">
                <FieldLabel htmlFor="asset-value">{t("modal.fields.estimatedValue.label")}</FieldLabel>
                <Input
                  id="asset-value"
                  type="number"
                  min="0"
                  step="any"
                  placeholder={t("modal.fields.estimatedValue.placeholder")}
                  aria-invalid={!!errors.estimatedValue}
                  {...register("estimatedValue", {
                    required: tv("estimatedValueRequired"),
                    validate: (value) => {
                      const num = Number(value);
                      if (Number.isNaN(num)) return tv("estimatedValueRequired");
                      if (num < 0) return tv("estimatedValueNonNegative");
                      return true;
                    },
                  })}
                />
                <FieldError errors={[errors.estimatedValue]} />
              </Field>
            </Stack>

            <Field>
              <FieldLabel htmlFor="asset-description">{t("modal.fields.description.label")}</FieldLabel>
              <Input
                id="asset-description"
                placeholder={t("modal.fields.description.placeholder")}
                {...register("description")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="asset-photo">{t("modal.fields.photo.label")}</FieldLabel>
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
                    id="asset-photo"
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
                <Button type="button" variant="outline">
                  {tc("actions.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? t("modal.submit.edit") : t("modal.submit.create")}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
