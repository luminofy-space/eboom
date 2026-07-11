import type { Metadata } from "next";
import ExpensesListPage from "@/src/views/expenses/ExpensesListPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Expenses");

export default function ExpensesPage() {
  return <ExpensesListPage />;
}
