import type { Metadata } from "next";
import IncomesListPage from "@/src/views/incomes/IncomesListPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Incomes");

export default function IncomesPage() {
  return <IncomesListPage />;
}
