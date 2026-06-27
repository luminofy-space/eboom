"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BanknoteArrowDown } from "lucide-react";
import { ENTITY_CARD_GRADIENT } from "@/src/styles/entity-card-styles";
import { cn } from "@/lib/utils";

export interface ExpenseNodeData {
  entityId: number;
  name: string;
  categoryName: string;
  currencySymbol?: string;
  canEdit?: boolean;
}

function ExpenseNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ExpenseNodeData;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!h-2.5 !w-2.5 !border-2 !border-background !bg-red-500"
        isConnectable={!!nodeData.canEdit}
      />
      <Card
        className={cn(
          "w-[220px] gap-0 border-red-500/30 py-0 shadow-md",
          ENTITY_CARD_GRADIENT.expense,
          selected && "ring-2 ring-primary"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="rounded-md bg-red-500/10 p-1.5">
              <BanknoteArrowDown className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nodeData.name}</p>
              {nodeData.categoryName ? (
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {nodeData.categoryName}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export const ExpenseNode = memo(ExpenseNodeComponent);
