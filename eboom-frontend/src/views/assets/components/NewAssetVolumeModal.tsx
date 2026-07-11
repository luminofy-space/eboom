"use client";

import { Button } from "@/components/ui/button";
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
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitError } from "@/src/components/FormSubmitError";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import { translateSubmitError } from "@/src/utils/formUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AssetVolume } from "../hooks/useAssetDetail";

interface VolumeFormData {
  side: "buy" | "sell";
  quantity: string;
  unitPrice: string;
  recordedAt: string;
  notes: string;
}

function toDateInputValue(date: string | null | undefined): string {
  if (!date) return new Date().toISOString().slice(0, 10);
  return date.slice(0, 10);
}

interface NewAssetVolumeModalProps {
  assetId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVolume?: AssetVolume | null;
}

export function NewAssetVolumeModal({
  assetId,
  open,
  onOpenChange,
  editingVolume,
}: NewAssetVolumeModalProps) {
  const { t } = useTranslation("assets");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("assets", { keyPrefix: "validation" });
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const isEdit = !!editingVolume;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VolumeFormData>({
    defaultValues: {
      side: "buy",
      quantity: "1",
      unitPrice: "",
      recordedAt: toDateInputValue(null),
      notes: "",
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["asset", canvas, assetId] });
    queryClient.invalidateQueries({ queryKey: ["asset-volumes", canvas, assetId] });
    queryClient.invalidateQueries({ queryKey: ["asset-valuation-series", canvas, assetId] });
    queryClient.invalidateQueries({ queryKey: ["assets", canvas] });
  };

  const { mutateAsync: createVolume, isPending: isCreating } = useMutationApi(
    canvas ? API_ROUTES.ASSET_VOLUMES_CREATE(canvas, assetId) : "",
    { method: "post", successKey: "success.asset.volumeCreated", hasToken: true, onSuccess: invalidate }
  );

  const { mutateAsync: updateVolume, isPending: isUpdating } = useMutationApi(
    canvas && editingVolume
      ? API_ROUTES.ASSET_VOLUMES_UPDATE(canvas, assetId, editingVolume.id)
      : "",
    { method: "put", successKey: "success.asset.volumeUpdated", hasToken: true, onSuccess: invalidate }
  );

  const isSaving = isCreating || isUpdating || isSubmitting;

  useEffect(() => {
    if (!open) return;
    if (editingVolume) {
      const qty = Number(editingVolume.quantity);
      reset({
        side: qty < 0 ? "sell" : "buy",
        quantity: String(Math.abs(qty)),
        unitPrice: editingVolume.unitPrice ?? "",
        recordedAt: toDateInputValue(editingVolume.recordedAt),
        notes: editingVolume.notes ?? "",
      });
    } else {
      reset({
        side: "buy",
        quantity: "1",
        unitPrice: "",
        recordedAt: toDateInputValue(null),
        notes: "",
      });
    }
    setSubmitError(null);
  }, [open, editingVolume, reset]);

  const onSubmit = async (formData: VolumeFormData) => {
    setSubmitError(null);
    if (!canvas) {
      setSubmitError(tv("noCanvas"));
      return;
    }

    const absQty = Number(formData.quantity);
    const signedQty = formData.side === "sell" ? -Math.abs(absQty) : Math.abs(absQty);

    try {
      const payload = {
        quantity: String(signedQty),
        unitPrice: formData.unitPrice.trim(),
        recordedAt: new Date(formData.recordedAt).toISOString(),
        notes: formData.notes.trim() || null,
      };
      if (isEdit) {
        await updateVolume(payload);
      } else {
        await createVolume(payload);
      }
      onOpenChange(false);
    } catch (error) {
      setSubmitError(translateSubmitError(error, t("volumeModal.error.saveFailed"), tv));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? t("volumeModal.edit.title") : t("volumeModal.create.title")}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? t("volumeModal.edit.description")
                  : t("volumeModal.create.description")}
              </DialogDescription>
            </DialogHeader>

            <FormSubmitError message={submitError} />

            <Field>
              <FieldLabel>{t("volumeModal.fields.side.label")}</FieldLabel>
              <Controller
                name="side"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">{t("volumeModal.fields.side.buy")}</SelectItem>
                      <SelectItem value="sell">{t("volumeModal.fields.side.sell")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="volume-qty">{t("volumeModal.fields.quantity.label")}</FieldLabel>
              <NumberInput
                id="volume-qty"
                min="0"
                step="any"
                placeholder={t("volumeModal.fields.quantity.placeholder")}
                aria-invalid={!!errors.quantity}
                {...register("quantity", {
                  required: tv("quantityRequired"),
                  validate: (value) => {
                    const num = Number(value);
                    if (Number.isNaN(num) || num <= 0) return tv("quantityNonZero");
                    return true;
                  },
                })}
              />
              <FieldError errors={[errors.quantity]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="volume-price">{t("volumeModal.fields.unitPrice.label")}</FieldLabel>
              <NumberInput
                id="volume-price"
                min="0"
                step="any"
                placeholder={t("volumeModal.fields.unitPrice.placeholder")}
                aria-invalid={!!errors.unitPrice}
                {...register("unitPrice", {
                  required: tv("unitPriceRequired"),
                  validate: (value) => {
                    const num = Number(value);
                    if (Number.isNaN(num)) return tv("unitPriceRequired");
                    if (num < 0) return tv("unitPriceNonNegative");
                    return true;
                  },
                })}
              />
              <FieldError errors={[errors.unitPrice]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="volume-date">{t("volumeModal.fields.recordedAt.label")}</FieldLabel>
              <Input
                id="volume-date"
                type="date"
                aria-invalid={!!errors.recordedAt}
                {...register("recordedAt", { required: tv("recordedAtRequired") })}
              />
              <FieldError errors={[errors.recordedAt]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="volume-notes">{t("volumeModal.fields.notes.label")}</FieldLabel>
              <Textarea
                id="volume-notes"
                placeholder={t("volumeModal.fields.notes.placeholder")}
                {...register("notes")}
              />
            </Field>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {tc("actions.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? t("volumeModal.submit.edit") : t("volumeModal.submit.create")}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
