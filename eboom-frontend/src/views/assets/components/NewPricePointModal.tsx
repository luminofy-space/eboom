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
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitError } from "@/src/components/FormSubmitError";
import API_ROUTES from "@/src/api/urls";
import { useMutationApi } from "@/src/api/useMutation";
import { useCanvas } from "@/src/hooks/useCanvas";
import { translateSubmitError } from "@/src/utils/formUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AssetPricePoint } from "../hooks/useAssetDetail";

interface PricePointFormData {
  unitPrice: string;
  recordedAt: string;
  notes: string;
}

function toDateInputValue(date: string | null | undefined): string {
  if (!date) return new Date().toISOString().slice(0, 10);
  return date.slice(0, 10);
}

interface NewPricePointModalProps {
  assetId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPricePoint?: AssetPricePoint | null;
}

export function NewPricePointModal({
  assetId,
  open,
  onOpenChange,
  editingPricePoint,
}: NewPricePointModalProps) {
  const { t } = useTranslation("assets");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("assets", { keyPrefix: "validation" });
  const { canvas } = useCanvas();
  const queryClient = useQueryClient();
  const isEdit = !!editingPricePoint;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PricePointFormData>({
    defaultValues: {
      unitPrice: "",
      recordedAt: toDateInputValue(null),
      notes: "",
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["asset", canvas, assetId] });
    queryClient.invalidateQueries({ queryKey: ["asset-price-points", canvas, assetId] });
    queryClient.invalidateQueries({ queryKey: ["asset-valuation-series", canvas, assetId] });
    queryClient.invalidateQueries({ queryKey: ["assets", canvas] });
  };

  const { mutateAsync: createPoint, isPending: isCreating } = useMutationApi(
    canvas ? API_ROUTES.ASSET_PRICE_POINTS_CREATE(canvas, assetId) : "",
    {
      method: "post",
      successKey: "success.asset.pricePointCreated",
      hasToken: true,
      onSuccess: invalidate,
    }
  );

  const { mutateAsync: updatePoint, isPending: isUpdating } = useMutationApi(
    canvas && editingPricePoint
      ? API_ROUTES.ASSET_PRICE_POINTS_UPDATE(canvas, assetId, editingPricePoint.id)
      : "",
    {
      method: "put",
      successKey: "success.asset.pricePointUpdated",
      hasToken: true,
      onSuccess: invalidate,
    }
  );

  const isSaving = isCreating || isUpdating || isSubmitting;

  useEffect(() => {
    if (!open) return;
    if (editingPricePoint) {
      reset({
        unitPrice: editingPricePoint.unitPrice ?? "",
        recordedAt: toDateInputValue(editingPricePoint.recordedAt),
        notes: editingPricePoint.notes ?? "",
      });
    } else {
      reset({
        unitPrice: "",
        recordedAt: toDateInputValue(null),
        notes: "",
      });
    }
    setSubmitError(null);
  }, [open, editingPricePoint, reset]);

  const onSubmit = async (formData: PricePointFormData) => {
    setSubmitError(null);
    if (!canvas) {
      setSubmitError(tv("noCanvas"));
      return;
    }

    try {
      const payload = {
        unitPrice: formData.unitPrice.trim(),
        recordedAt: new Date(formData.recordedAt).toISOString(),
        notes: formData.notes.trim() || null,
      };
      if (isEdit) {
        await updatePoint(payload);
      } else {
        await createPoint(payload);
      }
      onOpenChange(false);
    } catch (error) {
      setSubmitError(translateSubmitError(error, t("pricePointModal.error.saveFailed"), tv));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup className="gap-4">
            <DialogHeader>
              <DialogTitle>
                {isEdit ? t("pricePointModal.edit.title") : t("pricePointModal.create.title")}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? t("pricePointModal.edit.description")
                  : t("pricePointModal.create.description")}
              </DialogDescription>
            </DialogHeader>

            <FormSubmitError message={submitError} />

            <Field>
              <FieldLabel htmlFor="pp-value">
                {t("pricePointModal.fields.unitPrice.label")}
              </FieldLabel>
              <NumberInput
                id="pp-value"
                min="0"
                step="any"
                placeholder={t("pricePointModal.fields.unitPrice.placeholder")}
                aria-invalid={!!errors.unitPrice}
                {...register("unitPrice", {
                  required: tv("unitPricePointRequired"),
                  validate: (value) => {
                    const num = Number(value);
                    if (Number.isNaN(num)) return tv("unitPricePointRequired");
                    if (num < 0) return tv("unitPricePointNonNegative");
                    return true;
                  },
                })}
              />
              <FieldError errors={[errors.unitPrice]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="pp-date">{t("pricePointModal.fields.recordedAt.label")}</FieldLabel>
              <Input
                id="pp-date"
                type="date"
                aria-invalid={!!errors.recordedAt}
                {...register("recordedAt", { required: tv("recordedAtRequired") })}
              />
              <FieldError errors={[errors.recordedAt]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="pp-notes">{t("pricePointModal.fields.notes.label")}</FieldLabel>
              <Textarea
                id="pp-notes"
                placeholder={t("pricePointModal.fields.notes.placeholder")}
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
                {isEdit
                  ? t("pricePointModal.submit.edit")
                  : t("pricePointModal.submit.create")}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
