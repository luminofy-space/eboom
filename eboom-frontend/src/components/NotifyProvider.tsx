"use client";

import type { ReactNode } from "react";
import { SnackbarProvider } from "notistack";

interface NotifyProviderProps {
  children: ReactNode;
}

export function NotifyProvider({ children }: NotifyProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      dense
    >
      {children}
    </SnackbarProvider>
  );
}
