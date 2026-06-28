"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount, formatDate } from "@/src/i18n/formatters";
import type { CanvasSummaryRecentActivity } from "../types";
import { StatusChip } from "./StatusChip";
import { useTranslation } from "react-i18next";

interface DashboardRecentActivityProps {
  activities?: CanvasSummaryRecentActivity[];
  isLoading?: boolean;
}

export function DashboardRecentActivity({
  activities = [],
  isLoading,
}: DashboardRecentActivityProps) {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const router = useRouter();

  const handleRowClick = (activity: CanvasSummaryRecentActivity) => {
    if (activity.type === "income_entry") {
      router.push(`/income/${activity.entityId}`);
    } else {
      router.push(`/expense/${activity.entityId}`);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Stack gap={4}>
          <Stack direction="row" align="center" justify="between" gap={4}>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-36" />
          </Stack>
          <Skeleton className="h-64 w-full" />
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" gap={4}>
          <Typography variant="title">{t("recentActivity.title")}</Typography>
          <Button variant="outline" size="sm" asChild>
            <Link href="/transactions">{t("recentActivity.viewAllTransactions")}</Link>
          </Button>
        </Stack>

        {activities.length === 0 ? (
          <Typography variant="muted-sm">{t("recentActivity.empty")}</Typography>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("recentActivity.columns.type")}</TableHead>
                  <TableHead>{t("recentActivity.columns.name")}</TableHead>
                  <TableHead>{tc("labels.amount")}</TableHead>
                  <TableHead>{t("recentActivity.columns.date")}</TableHead>
                  <TableHead>{tc("labels.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow
                    key={`${activity.type}-${activity.id}`}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(activity)}
                  >
                    <TableCell>
                      <Badge variant="outline">
                        {activity.type === "income_entry"
                          ? t("recentActivity.types.income")
                          : t("recentActivity.types.expense")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{activity.entityName}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatAmount(activity.amount, activity.currencySymbol)}
                    </TableCell>
                    <TableCell>
                      {formatDate(activity.date, { fallback: tc("empty.emDash") })}
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={activity.status}
                        label={t(`recentActivity.status.${activity.status}`)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Stack>
    </Container>
  );
}
