import type { Metadata } from "next";
import AIInsightsPage from "@/src/views/ai-insights/AIInsightsPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("AI Insights");

export default function Page() {
  return <AIInsightsPage />;
}
