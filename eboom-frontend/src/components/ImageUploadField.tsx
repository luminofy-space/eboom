"use client";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageIcon, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  id?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  existingImageUrl?: string | null;
  disabled?: boolean;
  invalid?: boolean;
  variant?: "card" | "avatar";
}

export function ImageUploadField({
  id,
  value,
  onChange,
  existingImageUrl,
  disabled = false,
  invalid = false,
  variant = "card",
}: ImageUploadFieldProps) {
  const { t } = useTranslation("common", { keyPrefix: "imageUpload" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(value);

    return () => {
      reader.abort();
    };
  }, [value]);

  const displayUrl = previewUrl ?? (value ? null : existingImageUrl) ?? null;
  const hasPreview = !!displayUrl;
  const canRemove = !!value;
  const isAvatar = variant === "avatar";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0] ?? null;
      onChange(file);
    },
  });

  function handleRemove(event: React.MouseEvent) {
    event.stopPropagation();
    onChange(null);
  }

  return (
    <div className="grid gap-2">
      <div
        {...getRootProps({
          id,
          className: cn(
            "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
            isDragActive && "border-primary bg-primary/5",
            invalid && "border-destructive",
            disabled && "cursor-not-allowed opacity-50",
            hasPreview && "border-solid p-0"
          ),
          "aria-invalid": invalid,
        })}
      >
        <input {...getInputProps()} />

        {hasPreview ? (
          <>
            <div
              className={cn(
                "relative flex w-full items-center justify-center overflow-hidden bg-muted",
                isAvatar ? "min-h-[160px]" : "min-h-[120px] aspect-video"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt={t("previewAlt")}
                className={cn(
                  "object-cover",
                  isAvatar ? "size-32 rounded-full border-2 border-background shadow-sm" : "size-full"
                )}
              />
            </div>
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 px-4 text-center opacity-0 transition-opacity hover:opacity-100",
                isDragActive && "opacity-100"
              )}
            >
              {isDragActive ? (
                <Upload className="size-8 text-primary" />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground" />
              )}
              <p className="text-sm text-foreground">{t("dropzone")}</p>
            </div>
          </>
        ) : (
          <>
            {isDragActive ? (
              <Upload className="size-8 text-primary" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">{t("dropzone")}</p>
            <p className="text-xs text-muted-foreground">{t("hint")}</p>
          </>
        )}
      </div>

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={disabled}
          className="w-fit text-destructive hover:text-destructive"
        >
          {t("remove")}
        </Button>
      )}
    </div>
  );
}
