"use client";

import { useState, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutationApi } from "@/src/api/useMutation";
import API_ROUTES from "@/src/api/urls";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/src/hooks/useToast";
import { useTranslation } from "react-i18next";
import { fileToDataUrl } from "@/src/utils/formUtils";

interface ImageUploaderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const ImageUploader = ({ open, setOpen, onSuccess }: ImageUploaderProps) => {
  const { t } = useTranslation("profile");
  const { t: tc } = useTranslation("common");
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate, isPending, fieldError, generalError } = useMutationApi(
    API_ROUTES.USERS_UPDATE_PROFILE_IMAGE,
    {
      method: "post",
      hasToken: true,
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("imageUploader.toast.invalidFileType.title"),
          description: t("imageUploader.toast.invalidFileType.description"),
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("imageUploader.toast.fileTooLarge.title"),
          description: t("imageUploader.toast.fileTooLarge.description"),
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
            {previewUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={previewUrl}
                    alt={t("imageUploader.preview.alt")}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="text-red-600 hover:text-red-700"
                >
                  {t("imageUploader.preview.remove")}
                </Button>
              </div>
            )}

            <div className="grid gap-3">
              <Label htmlFor="profile-image">
                {t("imageUploader.fields.selectImage.label")}
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  id="profile-image"
                  name="profile_image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                {t("imageUploader.fields.selectImage.hint")}
              </p>
            </div>

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
