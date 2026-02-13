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

interface ImageUploaderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const ImageUploader = ({ open, setOpen, onSuccess }: ImageUploaderProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API mutation for uploading profile photo
  const { mutate, isPending, fieldError, generalError } = useMutationApi(
    API_ROUTES.USERS_UPDATE_PROFILE_IMAGE,
    {
      method: "post",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      hasToken: true,
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview URL
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
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create FormData with the image file
      const formData = new FormData();
      formData.append("photo_url", selectedFile);

      // Execute the mutation
      await mutate(formData);

      // Show success message
      toast({
        title: "Success!",
        description: "Profile picture updated successfully",
      });

      // Reset form
      handleRemoveImage();

      // Close dialog
      setOpen(false);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      // Error is already handled by useMutationApi hook
      console.error("Error uploading image:", error);
    }
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      handleRemoveImage();
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <form onSubmit={handleSubmit}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new profile image. Supported formats: JPEG, PNG, WebP. Max size: 5MB.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Preview Section */}
            {previewUrl && (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Preview"
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
                  Remove
                </Button>
              </div>
            )}

            {/* File Input Section */}
            <div className="grid gap-3">
              <Label htmlFor="profile-image">
                Select Image
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
                Click the camera icon or browse to select an image
              </p>
            </div>

            {/* Error Display */}
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
                Cancel
              </Button>
            </DialogClose>
            <Button 
              // type="submit" 
              onClick={handleSubmit}
              disabled={!selectedFile || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default ImageUploader;