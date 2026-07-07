import type { AxiosError } from "@/src/types/axios";

type ApiErrorBody = {
  error?: string;
  message?: string;
  errors?: Record<string, string>;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message && !("response" in error)) {
    return error.message;
  }

  if (error && typeof error === "object" && "response" in error) {
    const data = (error as AxiosError<ApiErrorBody>).response?.data as
      | ApiErrorBody
      | undefined;

    if (data?.error) return data.error;
    if (data?.message) return data.message;

    if (data?.errors) {
      const firstFieldError = Object.values(data.errors).find(Boolean);
      if (firstFieldError) return firstFieldError;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function validateOptionalImage(
  file: File | null,
  messages: { invalidType: string; tooLarge: string }
): true | string {
  if (!file) return true;
  if (!file.type.startsWith("image/")) return messages.invalidType;
  if (file.size > MAX_IMAGE_SIZE_BYTES) return messages.tooLarge;
  return true;
}

/**
 * Reads an image File into a persistent base64 data URL.
 *
 * The backend stores `photoUrl` as a plain string with no file storage, so we
 * persist the image inline. `URL.createObjectURL` must NOT be used here: it
 * returns an ephemeral `blob:` URL that is only valid within the current
 * document session and breaks after a reload.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function validateDateNotBefore(
  laterDate: string,
  earlierDate: string,
  message: string
): true | string {
  if (!laterDate || !earlierDate) return true;
  return laterDate >= earlierDate ? true : message;
}

const KNOWN_API_ERRORS: Record<string, string> = {
  "Insufficient wallet balance": "insufficientBalance",
};

export function translateSubmitError(
  error: unknown,
  fallback: string,
  translate?: (key: string) => string
): string {
  const raw = getApiErrorMessage(error, fallback);

  if (translate) {
    const mappedKey = KNOWN_API_ERRORS[raw];
    if (mappedKey) {
      return translate(mappedKey);
    }
  }

  return raw;
}
