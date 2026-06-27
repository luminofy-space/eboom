"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { formatMoney } from "@/src/i18n/formatters";
import { ENTITY_CARD_GRADIENT } from "@/src/styles/entity-card-styles";
import { cn } from "@/lib/utils";

export interface WalletNodeData {
  entityId: number;
  name: string;
  categoryName: string;
  subWallets: Array<{
    amount: string;
    currency?: { symbol?: string } | null;
  }>;
  canEdit?: boolean;
}

function WalletNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WalletNodeData;
  const primaryBalance = nodeData.subWallets?.[0];
  const balanceLabel =
    primaryBalance != null
      ? formatMoney(primaryBalance.amount, primaryBalance.currency?.symbol)
      : formatMoney(0);

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-emerald-500"
        isConnectable={!!nodeData.canEdit}
      />
      <Card
        className={cn(
          "w-[220px] gap-0 border-blue-500/30 py-0 shadow-md",
          ENTITY_CARD_GRADIENT.wallet,
          selected && "ring-2 ring-primary"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="rounded-md bg-blue-500/10 p-1.5">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nodeData.name}</p>
              {nodeData.categoryName ? (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {nodeData.categoryName}
                </Badge>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">{balanceLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-red-500"
        isConnectable={!!nodeData.canEdit}
      />
    </>
  );
}

export const WalletNode = memo(WalletNodeComponent);
