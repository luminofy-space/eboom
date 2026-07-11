import type { Metadata } from "next";
import WalletsListPage from "@/src/views/wallets/WalletsListPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Wallets");

export default function WalletsPage() {
  return <WalletsListPage />;
}
