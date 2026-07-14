import type { Viewport } from "next";
import { LANDING_BASE_COLOR } from "@/src/views/landing/landingBackgroundStyle";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: LANDING_BASE_COLOR,
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="dark min-h-svh text-foreground"
      style={{ backgroundColor: LANDING_BASE_COLOR }}
    >
      {children}
    </div>
  );
}
