"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wallet } from "lucide-react";
import { formatMoney } from "@/src/i18n/formatters";
import { ENTITY_CARD_GRADIENT } from "./entity-card-styles";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const MAX_VISIBLE_BALANCES = 2;

export interface WalletNodeData {
  entityId: number;
  name: string;
  categoryName: string;
  subWallets: Array<{
    id?: number;
    amount: string;
    currency?: { code?: string; symbol?: string } | null;
  }>;
  canEdit?: boolean;
}

function formatSubWalletBalance(
  subWallet: WalletNodeData["subWallets"][number],
  includeCode = false
): string {
  const formatted = formatMoney(subWallet.amount, subWallet.currency?.symbol);
  const code = subWallet.currency?.code;
  if (includeCode && code) {
    return `${formatted} (${code})`;
  }
  return formatted;
}

function WalletNodeComponent({ data, selected }: NodeProps) {
  const { t } = useTranslation("whiteboard");
  const nodeData = data as unknown as WalletNodeData;
  const subWallets = nodeData.subWallets ?? [];
  const visibleBalances = subWallets.slice(0, MAX_VISIBLE_BALANCES);
  const hiddenCount = Math.max(0, subWallets.length - MAX_VISIBLE_BALANCES);

  return (
    <div className="wallet-node-root relative overflow-visible">
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
              <div className="mt-2 space-y-0.5">
                {subWallets.length === 0 ? (
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatMoney(0)}
                  </p>
                ) : (
                  <>
                    {visibleBalances.map((subWallet, index) => (
                      <p
                        key={subWallet.id ?? `${subWallet.currency?.code ?? "currency"}-${index}`}
                        className="truncate text-xs tabular-nums text-muted-foreground"
                      >
                        {formatSubWalletBalance(subWallet)}
                      </p>
                    ))}
                    {hiddenCount > 0 ? (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="inline-block cursor-default text-xs text-muted-foreground/80 underline decoration-dotted underline-offset-2"
                              onPointerDown={(event) => event.stopPropagation()}
                            >
                              {t("walletNode.moreBalances", { count: hiddenCount })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs space-y-1">
                            {subWallets.map((subWallet, index) => (
                              <p
                                key={subWallet.id ?? `${subWallet.currency?.code ?? "currency"}-${index}`}
                                className="tabular-nums"
                              >
                                {formatSubWalletBalance(subWallet, true)}
                              </p>
                            ))}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </>
                )}
              </div>
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
    </div>
  );
}

export const WalletNode = memo(WalletNodeComponent);
