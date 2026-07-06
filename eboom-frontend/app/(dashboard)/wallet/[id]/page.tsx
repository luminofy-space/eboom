import type { Metadata } from "next";
import WalletDetailPage from "@/src/views/wallets/WalletDetailPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Wallet");

export default async function WalletDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WalletDetailPage id={Number(id)} />;
}
