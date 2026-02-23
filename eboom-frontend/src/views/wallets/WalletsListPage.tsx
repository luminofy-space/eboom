"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { useCanvas } from "@/src/hooks/useCanvas";
import { Plus } from "lucide-react";
import Link from "next/link";

interface Wallet {
  id: number;
  name: string;
  description?: string;
  walletType?: string;
}

export default function WalletsListPage() {
  const { canvas } = useCanvas();

  const { data, isLoading } = useQueryApi<{ wallets: Wallet[] }>(
    canvas ? API_ROUTES.CANVASES_WALLETS_LIST(canvas) : "",
    {
      queryKey: ["wallets", canvas],
      hasToken: true,
      enabled: !!canvas,
    }
  );

  const wallets = data?.wallets ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {wallets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-[375px] flex flex-col items-center justify-center gap-3 py-8">
            <div className="text-center text-2xl font-semibold">Add Wallet</div>
            <div className="text-center text-sm text-muted-foreground">
              Create wallets to manage your assets and accounts.
            </div>
            <Button className="w-[80%] min-h-[40px]">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => (
            <Link key={wallet.id} href={`/wallet/${wallet.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{wallet.name}</CardTitle>
                  <CardDescription>
                    {wallet.walletType || "Wallet"}
                    {wallet.description && ` · ${wallet.description}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
