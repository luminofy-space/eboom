import type { Metadata } from "next";
import AssetsListPage from "@/src/views/assets/AssetsListPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Assets");

export default function AssetsPage() {
  return <AssetsListPage />;
}
