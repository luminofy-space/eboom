import type { Metadata } from "next";
import IncomeDetailPage from "@/src/views/incomes/IncomeDetailPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Income");

export default async function IncomeDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IncomeDetailPage id={Number(id)} />;
}
