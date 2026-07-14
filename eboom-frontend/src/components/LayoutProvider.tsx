"use client";

import React from "react";
import { AppSidebar } from "@/src/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./layout/site-header";
import { useTextDirection } from "@/src/i18n/useTextDirection";
import { NavigationProgressBar, NavigationProgressProvider } from "@/src/components/navigation/NavigationProgress";
import { CanvasRequiredGate } from "@/src/components/canvas/CanvasRequiredGate";

export default function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { sidebarSide } = useTextDirection();

  return (
    <NavigationProgressProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" side={sidebarSide} />
        <SidebarInset>
          <SiteHeader />
          <NavigationProgressBar />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 md:gap-6 h-full">
                <CanvasRequiredGate>{children}</CanvasRequiredGate>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NavigationProgressProvider>
  );
}
