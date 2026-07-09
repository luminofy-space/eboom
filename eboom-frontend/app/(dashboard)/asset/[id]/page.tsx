import type { Metadata } from "next";
import AssetDetailPage from "@/src/views/assets/AssetDetailPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Asset");

export default async function AssetDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssetDetailPage id={Number(id)} />;
}
