"use client";

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavigationProgressContextValue {
  navigate: (href: string) => void;
  isNavigating: boolean;
}

const NavigationProgressContext =
  createContext<NavigationProgressContextValue | null>(null);

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  return (
    <NavigationProgressContext.Provider
      value={{ navigate, isNavigating: isPending }}
    >
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function NavigationProgressBar({ className }: { className?: string }) {
  const { isNavigating } = useNavigationProgress();

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-hidden
      className={cn(
        "pointer-events-none relative h-0.5 w-full shrink-0 overflow-hidden bg-primary/10",
        className
      )}
    >
      <div className="absolute inset-y-0 w-1/3 animate-[navigation-progress_1.1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (!context) {
    throw new Error("useNavigationProgress must be used within NavigationProgressProvider");
  }
  return context;
}
