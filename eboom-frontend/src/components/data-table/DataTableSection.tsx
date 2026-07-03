"use client";

import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableProps } from "./DataTable";

export interface DataTableSectionProps<T> extends DataTableProps<T> {
  title: string;
  subtitle?: string;
  count?: string;
  headerAction?: React.ReactNode;
  containerClassName?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  skeletonRows?: number;
}

export function DataTableSection<T>({
  title,
  subtitle,
  count,
  headerAction,
  containerClassName,
  isLoading = false,
  isError = false,
  errorMessage,
  skeletonRows = 4,
  ...tableProps
}: DataTableSectionProps<T>) {
  if (isLoading) {
    return (
      <Container className={containerClassName}>
        <Stack gap={4}>
          <Skeleton className="h-7 w-48" />
          <div className="overflow-hidden rounded-lg border">
            <div className="space-y-3 p-4">
              {Array.from({ length: skeletonRows }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </Stack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className={containerClassName}>
        <Typography variant="muted-sm">{errorMessage}</Typography>
      </Container>
    );
  }

  return (
    <Container className={containerClassName}>
      <Stack gap={4}>
        <Stack direction="row" align="center" justify="between" gap={4}>
          <div>
            <Typography variant="heading">{title}</Typography>
            {subtitle && <Typography variant="muted-sm">{subtitle}</Typography>}
          </div>
          {(count || headerAction) && (
            <Stack direction="row" align="center" gap={3}>
              {count && (
                <Typography variant="count" className="hidden sm:block">
                  {count}
                </Typography>
              )}
              {headerAction}
            </Stack>
          )}
        </Stack>

        <DataTable {...tableProps} />
      </Stack>
    </Container>
  );
}
