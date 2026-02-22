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
import GroupSelect, { TItem } from "@/src/components/groupe-select/GroupeSelect";
import { useState } from "react";
import {
  DEFAULT_CANVAS_ICON,
  PRESET_COLORS,
  PRESET_EMOJIS,
  serializeCanvasIcon,
} from "./canvasUtils";
import { useCanvas } from "@/src/hooks/useCanvas";

interface NewCanvasModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCreated?: () => void;
}

const canvasTypeItems: TItem[] = [
  { key: "personal", title: "Personal" },
  { key: "business", title: "Business" },
  { key: "family", title: "Family" },
];

export function NewCanvasModal({ open, setOpen, onCreated }: NewCanvasModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [canvasType, setCanvasType] = useState("personal");
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_CANVAS_ICON.emoji);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_CANVAS_ICON.color);
  const [baseCurrencyCode, setBaseCurrencyCode] = useState<string>("");

  const { data: currenciesRes, isLoading: isLoadingCurr } = useQueryApi<{
    currencies?: { id: number; name: string; code: string; symbol: string }[];
  }>(API_ROUTES.CURRENCIES_METADATA, {
    queryKey: ["currencies"],
    hasToken: true,
  });

  const currencies = currenciesRes?.currencies ?? [];
  const effectiveCode = baseCurrencyCode || currencies[0]?.code || "";

  const { createCanvas, isCreating } = useCanvas();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCurrency = currencies.find((c) => c.code === effectiveCode);
    if (!selectedCurrency) return;

    try {
      const photoUrl = serializeCanvasIcon({ emoji: selectedEmoji, color: selectedColor });

      createCanvas(name, description, canvasType, photoUrl, selectedCurrency.id);
      

      setName("");
      setDescription("");
      setCanvasType("personal");
      setSelectedEmoji(DEFAULT_CANVAS_ICON.emoji);
      setSelectedColor(DEFAULT_CANVAS_ICON.color);
      setBaseCurrencyCode("");
      setOpen(false);
      onCreated?.();
    } catch (error) {
      console.error("Error creating canvas:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Canvas</DialogTitle>
            <DialogDescription>
              Create a new canvas to organize your finances. Each canvas is an
              independent financial workspace.
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
                  name="name"
                  placeholder="e.g. My Personal Budget"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="canvas-description">Description</Label>
              <Input
                id="canvas-description"
                name="description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <Label>Type</Label>
              <GroupSelect
                items={canvasTypeItems}
                handleSelect={(item) => setCanvasType(item.key)}
                value={canvasType}
              />
            </div>

            {/* Base Currency */}
            <div className="flex flex-col gap-1">
              <Label>Base Currency</Label>
              <Combobox
                items={currencies.map((c) => c.code)}
                value={effectiveCode}
                disabled={isLoadingCurr}
                onValueChange={(val: string | null) => setBaseCurrencyCode(val ?? "")}
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

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <Label>Background Color</Label>
              <div className="flex flex-row flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
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
                    onClick={() => setSelectedEmoji(emoji)}
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
            <Button disabled={!name || isCreating} type="submit" onClick={handleSubmit}>
              Create Canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
