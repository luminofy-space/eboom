import type { Metadata } from "next";
import TransactionsPage from "@/src/views/transactions/TransactionsPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Transactions");

export default function Page() {
  return <TransactionsPage />;
}
