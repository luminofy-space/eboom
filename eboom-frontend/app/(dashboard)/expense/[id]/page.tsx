import type { Metadata } from "next";
import ExpenseDetailPage from "@/src/views/expenses/ExpenseDetailPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Expense");

export default async function ExpenseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExpenseDetailPage id={Number(id)} />;
}
