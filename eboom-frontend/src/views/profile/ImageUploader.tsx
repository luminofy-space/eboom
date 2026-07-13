"use client";

import { useState } from "react";
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
import { Field, FieldError } from "@/components/ui/field";
import { ImageUploadField } from "@/src/components/ImageUploadField";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import { Loader2 } from "lucide-react";
import { useToast } from "@/src/hooks/useToast";
import { useTranslation } from "react-i18next";
import { fileToDataUrl, validateOptionalImage } from "@/src/utils/formUtils";

interface ImageUploaderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  existingImageUrl?: string | null;
  onSuccess?: () => void;
}

const ImageUploader = ({ open, setOpen, existingImageUrl, onSuccess }: ImageUploaderProps) => {
  const { t } = useTranslation("profile");
  const { t: tc } = useTranslation("common");
  const { t: tv } = useTranslation("validation");
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending, fieldError, generalError } = useMutationApi(
    API_ROUTES.USERS_UPDATE_PROFILE_IMAGE,
    {
      method: "post",
      hasToken: true,
    }
  );

  function handleFileChange(file: File | null) {
    if (!file) {
      setSelectedFile(null);
      setValidationError(null);
      return;
    }

    const error = validateOptionalImage(file, {
      invalidType: tv("imageInvalidType"),
      tooLarge: tv("imageTooLarge"),
    });

    if (error !== true) {
      setSelectedFile(null);
      setValidationError(error);
      return;
    }

    setSelectedFile(file);
    setValidationError(null);
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setValidationError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: t("imageUploader.toast.noImageSelected.title"),
        description: t("imageUploader.toast.noImageSelected.description"),
        variant: "destructive",
      });
      return;
    }

    try {
      const photoDataUrl = await fileToDataUrl(selectedFile);

      await mutate({ photo_url: photoDataUrl });

      toast({
        title: t("imageUploader.toast.success.title"),
        description: t("imageUploader.toast.success.description"),
      });

      handleRemoveImage();
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleRemoveImage();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("imageUploader.title")}</DialogTitle>
            <DialogDescription>
              {t("imageUploader.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field data-invalid={!!validationError}>
              <ImageUploadField
                id="profile-image"
                value={selectedFile}
                onChange={handleFileChange}
                existingImageUrl={existingImageUrl}
                invalid={!!validationError}
                disabled={isPending}
                variant="avatar"
              />
              {validationError && <FieldError>{validationError}</FieldError>}
            </Field>

            {fieldError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  {Object.values(fieldError).join(", ")}
                </p>
              </div>
            )}

              {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  {generalError.message}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                disabled={isPending}
              >
                {tc("actions.cancel")}
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFile || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("imageUploader.submitting")}
                </>
              ) : (
                t("imageUploader.submit")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default ImageUploader;
