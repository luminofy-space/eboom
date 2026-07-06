import { LANDING_BASE_COLOR } from "@/src/views/landing/landingBackgroundStyle";

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
