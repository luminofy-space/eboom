"use client";

import { useForm, useWatch } from "react-hook-form";
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
import useQueryApi from "@/src/api/useQuery";
import GroupSelect, { TItem } from "@/src/components/groupe-select/GroupeSelect";
import { useEffect } from "react";
import {
  DEFAULT_CANVAS_ICON,
  PRESET_COLORS,
  PRESET_EMOJIS,
  parseCanvasIcon,
  serializeCanvasIcon,
} from "./canvasUtils";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import { closeCanvasModal, selectCanvasModal } from "@/src/redux/canvasSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigationProgress } from "@/src/components/navigation/NavigationProgress";
import { useTranslation } from "react-i18next";

interface CanvasFormData {
  name: string;
  description: string;
  canvasType: string;
  selectedEmoji: string;
  selectedColor: string;
  baseCurrencyCode: string;
}

const defaultValues: CanvasFormData = {
  name: "",
  description: "",
  canvasType: "personal",
  selectedEmoji: DEFAULT_CANVAS_ICON.emoji,
  selectedColor: DEFAULT_CANVAS_ICON.color,
  baseCurrencyCode: "",
};

const hasWindow = typeof window !== "undefined";

export function NewCanvasModal() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation("canvas");
  const { t: tc } = useTranslation("common");
  const { open, mode, editingItem } = useAppSelector(selectCanvasModal);
  const isEdit = mode === "edit";
  const queryClient = useQueryClient();
  const { navigate } = useNavigationProgress();

  const canvasTypeItems: TItem[] = [
    { key: "personal", title: t("modal.fields.type.options.personal") },
    { key: "business", title: t("modal.fields.type.options.business") },
    { key: "family", title: t("modal.fields.type.options.family") },
  ];

  const { register, handleSubmit, reset, setValue, control } = useForm<CanvasFormData>({
    defaultValues,
  });

  const name = useWatch({ control, name: "name" });
  const canvasType = useWatch({ control, name: "canvasType" });
  const selectedEmoji = useWatch({ control, name: "selectedEmoji" });
  const selectedColor = useWatch({ control, name: "selectedColor" });
  const baseCurrencyCode = useWatch({ control, name: "baseCurrencyCode" });

  const { data: currenciesRes, isLoading: isLoadingCurr } = useQueryApi<{
    currencies?: { id: number; name: string; code: string; symbol: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
    staleTime: 10 * 60 * 1000,
    enabled: open,
  });

  const currencies = currenciesRes?.currencies ?? [];
  const effectiveCode = baseCurrencyCode || currencies[0]?.code || "";

  const { createCanvas, isCreating } = useCanvas();

  const { mutate: updateCanvasMutation, isPending: isUpdating } = useMutation({
    mutationFn: async (data: { name: string; description?: string; canvasType: string; photoUrl: string }) => {
      if (!editingItem) return;
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}${API_ROUTES.CANVASES_UPDATE(editingItem.id)}`;
      const token = hasWindow ? window.localStorage.getItem("accessToken") : null;
      await axios.put(url, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      handleClose();
    },
  });

  useEffect(() => {
    if (open && isEdit && editingItem) {
      const icon = parseCanvasIcon(editingItem.photoUrl ?? undefined);
      reset({
        name: editingItem.name,
        description: typeof editingItem.description === "string" ? editingItem.description : "",
        canvasType: editingItem.canvasType ?? "personal",
        selectedEmoji: icon.emoji,
        selectedColor: icon.color,
        baseCurrencyCode: "",
      });
    } else if (open && !isEdit) {
      reset(defaultValues);
    }
  }, [open, isEdit, editingItem, reset]);

  const handleClose = () => {
    dispatch(closeCanvasModal());
    reset(defaultValues);
  };

  const onSubmit = async (formData: CanvasFormData) => {
    const photoUrl = serializeCanvasIcon({ emoji: formData.selectedEmoji, color: formData.selectedColor });

    if (isEdit) {
      updateCanvasMutation({
        name: formData.name,
        description: formData.description || undefined,
        canvasType: formData.canvasType,
        photoUrl,
      });
    } else {
      const selectedCurrency = currencies.find((c) => c.code === effectiveCode);
      if (!selectedCurrency) return;

      try {
        await createCanvas(formData.name, formData.description, formData.canvasType, photoUrl, selectedCurrency.id);
        handleClose();
        navigate("/");
      } catch (error) {
        console.error("Error creating canvas:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => { if (!openState) handleClose(); }}>
      <DialogContent className="w-full max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("modal.edit.title") : t("modal.create.title")}</DialogTitle>
            <DialogDescription>
              {isEdit ? t("modal.edit.description") : t("modal.create.description")}
            </DialogDescription>
          </DialogHeader>

            <Stack direction="row" align="end" gap={3}>
              <div
                className="flex shrink-0 size-12 items-center justify-center rounded-xl text-2xl select-none"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedEmoji}
              </div>
              <Field className="flex-1">
                <FieldLabel htmlFor="canvas-name">{t("modal.fields.name.label")}</FieldLabel>
                <Input
                  required
                  id="canvas-name"
                  placeholder={t("modal.fields.name.placeholder")}
                  {...register("name", { required: true })}
                />
              </Field>
            </Stack>

            <Field>
              <FieldLabel htmlFor="canvas-description">{t("modal.fields.description.label")}</FieldLabel>
              <Input
                id="canvas-description"
                placeholder={t("modal.fields.description.placeholder")}
                {...register("description")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("modal.fields.type.label")}</FieldLabel>
              <GroupSelect
                items={canvasTypeItems}
                handleSelect={(item) => setValue("canvasType", item.key)}
                value={canvasType}
              />
            </Field>

            {!isEdit && (
              <Field>
                <FieldLabel>{t("modal.fields.baseCurrency.label")}</FieldLabel>
                <Combobox
                  items={currencies.map((c) => c.code)}
                  value={effectiveCode}
                  disabled={isLoadingCurr}
                  onValueChange={(val: string | null) => setValue("baseCurrencyCode", val ?? "")}
                >
                  <ComboboxInput placeholder={tc("placeholders.selectCurrency")} />
                  <ComboboxContent>
                    <ComboboxEmpty>{t("modal.empty.noCurrencies")}</ComboboxEmpty>
                    <ComboboxCollection>
                      {(code: string) => {
                        const c = currencies.find((c) => c.code === code);
                        return (
                          <ComboboxItem key={code} value={code}>
                            {c ? `${c.code} – ${c.name}` : code}
                          </ComboboxItem>
                        );
                      }}
                    </ComboboxCollection>
                  </ComboboxContent>
                </Combobox>
              </Field>
            )}

            <Field className="gap-2">
              <FieldLabel>{t("modal.fields.backgroundColor.label")}</FieldLabel>
              <div className="flex flex-row flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue("selectedColor", color)}
                    className="size-7 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  >
                    {selectedColor === color && (
                      <span className="flex items-center justify-center text-white text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            <Field className="gap-2">
              <FieldLabel>{t("modal.fields.icon.label")}</FieldLabel>
              <div className="flex flex-row flex-wrap gap-1">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue("selectedEmoji", emoji)}
                    className={`size-9 flex items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted ${
                      selectedEmoji === emoji ? "bg-muted ring-2 ring-primary" : ""
                    }`}
                    aria-label={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {tc("actions.cancel")}
              </Button>
            </DialogClose>
            <Button disabled={!name || isCreating || isUpdating} type="submit">
              {isEdit ? t("modal.submit.edit") : t("modal.submit.create")}
            </Button>
          </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
