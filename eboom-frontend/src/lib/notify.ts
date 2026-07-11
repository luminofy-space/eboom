"use client";

import { closeSnackbar, enqueueSnackbar, type OptionsObject } from "notistack";
import i18n from "@/src/i18n";

type NotifyParams = Record<string, string | number | undefined>;

/** Backend keys look like `errors.expense.notFound`; i18n path is under ns `errors`. */
export function toI18nKey(key: string, namespace: "errors" | "success"): string {
  const prefix = `${namespace}.`;
  if (key.startsWith(prefix)) {
    return key.slice(prefix.length);
  }
  if (key.startsWith("errors.") && namespace === "errors") {
    return key.slice("errors.".length);
  }
  if (key.startsWith("success.") && namespace === "success") {
    return key.slice("success.".length);
  }
  return key;
}

export function translateNotifyKey(
  key: string,
  namespace: "errors" | "success",
  params?: NotifyParams
): string {
  const path = toI18nKey(key, namespace);
  const translated = i18n.t(path, {
    ns: namespace,
    ...(params ?? {}),
    defaultValue: "",
  });
  if (translated && translated !== path) return translated;
  return i18n.t("common.unknown", {
    ns: "errors",
    defaultValue: key,
  });
}

const defaultOptions: OptionsObject = {
  anchorOrigin: { vertical: "bottom", horizontal: "center" },
  autoHideDuration: 4000,
};

export function notifyError(key: string, params?: NotifyParams, options?: OptionsObject) {
  enqueueSnackbar(translateNotifyKey(key, "errors", params), {
    ...defaultOptions,
    variant: "error",
    ...options,
  });
}

export function notifySuccess(key: string, params?: NotifyParams, options?: OptionsObject) {
  enqueueSnackbar(translateNotifyKey(key, "success", params), {
    ...defaultOptions,
    variant: "success",
    ...options,
  });
}

export function notifyDismiss(key?: string | number) {
  closeSnackbar(key);
}

export function errorKeyFromStatus(status?: number): string {
  if (status === 401) return "errors.common.unauthorized";
  if (status === 403) return "errors.common.forbidden";
  if (status === 404) return "errors.common.notFound";
  if (status && status >= 500) return "errors.common.internal";
  return "errors.common.unknown";
}
