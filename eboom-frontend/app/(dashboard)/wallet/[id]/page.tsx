"use client";

import { useParams } from "next/navigation";
import WalletDetailPage from "@/src/views/wallets/WalletDetailPage";

export default function WalletDetail() {
  const { id } = useParams<{ id: string }>();
  return <WalletDetailPage id={Number(id)} />;
}
