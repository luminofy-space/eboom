import type { Metadata } from "next";
import BudgetPlanningPage from "@/src/views/budget-planning/BudgetPlanningPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Budget & Planning");

export default function Page() {
  return <BudgetPlanningPage />;
}
