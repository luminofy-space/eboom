"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { AiInsightItem } from "../types";

interface InsightCardsProps {
  insights: AiInsightItem[];
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

function priorityVariant(priority: AiInsightItem["priority"]) {
  if (priority === "high") return "destructive" as const;
  if (priority === "medium") return "default" as const;
  return "secondary" as const;
}

export function InsightCards({ insights }: InsightCardsProps) {
  const { t } = useTranslation("ai-insights");

  const sorted = [...insights].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );

  return (
    <Stack gap={4}>
      {sorted.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={priorityVariant(item.priority)}>
                {t(`insights.priority.${item.priority}`)}
              </Badge>
              <Badge variant="outline">{t(`insights.categories.${item.category}`)}</Badge>
            </div>
            <CardTitle className={cn("text-base leading-snug")}>{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Typography variant="body-sm" className="leading-relaxed">
              {item.body}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
