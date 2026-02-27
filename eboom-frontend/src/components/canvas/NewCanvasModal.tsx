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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const canvasTypeItems: TItem[] = [
  { key: "personal", title: "Personal" },
  { key: "business", title: "Business" },
  { key: "family", title: "Family" },
];

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
  const { open, mode, editingItem } = useAppSelector(selectCanvasModal);
  const isEdit = mode === "edit";
  const queryClient = useQueryClient();

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
      } catch (error) {
        console.error("Error creating canvas:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => { if (!openState) handleClose(); }}>
      <DialogContent className="w-full max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Canvas" : "Add New Canvas"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update your canvas details."
                : "Create a new canvas to organize your finances. Each canvas is an independent financial workspace."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Preview + Name row */}
            <div className="flex flex-row items-end gap-3">
              <div
                className="flex shrink-0 size-12 items-center justify-center rounded-xl text-2xl select-none"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedEmoji}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <Label htmlFor="canvas-name">Name</Label>
                <Input
                  required
                  id="canvas-name"
                  placeholder="e.g. My Personal Budget"
                  {...register("name", { required: true })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="canvas-description">Description</Label>
              <Input
                id="canvas-description"
                placeholder="Optional description"
                {...register("description")}
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <Label>Type</Label>
              <GroupSelect
                items={canvasTypeItems}
                handleSelect={(item) => setValue("canvasType", item.key)}
                value={canvasType}
              />
            </div>

            {/* Base Currency — only in create mode */}
            {!isEdit && (
              <div className="flex flex-col gap-1">
                <Label>Base Currency</Label>
                <Combobox
                  items={currencies.map((c) => c.code)}
                  value={effectiveCode}
                  disabled={isLoadingCurr}
                  onValueChange={(val: string | null) => setValue("baseCurrencyCode", val ?? "")}
                >
                  <ComboboxInput placeholder="Select a currency" />
                  <ComboboxContent>
                    <ComboboxEmpty>No currencies found.</ComboboxEmpty>
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
              </div>
            )}

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <Label>Background Color</Label>
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
            </div>

            {/* Emoji picker */}
            <div className="flex flex-col gap-2">
              <Label>Icon</Label>
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
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={!name || isCreating || isUpdating} type="submit">
              {isEdit ? "Save Changes" : "Create Canvas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
