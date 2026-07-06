"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableRowActionsMenu } from "./TableRowActionsMenu";

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  headerClassName?: string;
  cell: (row: T) => React.ReactNode;
  cellClassName?: string;
  stopRowClick?: boolean;
}

export interface DataTableRowActions<T> {
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  deleteDisabled?: boolean | ((row: T) => boolean);
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage: React.ReactNode;
  footer?: React.ReactNode;
  showActions?: boolean;
  actions?: DataTableRowActions<T>;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
  bordered?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage,
  footer,
  showActions = false,
  actions,
  onRowClick,
  getRowClassName,
  bordered = true,
}: DataTableProps<T>) {
  const columnCount = columns.length + (showActions ? 1 : 0);

  const table = (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id} className={column.headerClassName}>
              {column.header}
            </TableHead>
          ))}
          {showActions && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-24 text-center">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </TableCell>
          </TableRow>
        ) : (
          data.map((row) => (
            <TableRow
              key={getRowKey(row)}
              className={cn(onRowClick && "cursor-pointer", getRowClassName?.(row))}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={column.cellClassName}
                  onClick={
                    onRowClick && column.stopRowClick
                      ? (event) => event.stopPropagation()
                      : undefined
                  }
                >
                  {column.cell(row)}
                </TableCell>
              ))}
              {showActions && (
                <TableCell
                  onClick={onRowClick ? (event) => event.stopPropagation() : undefined}
                >
                  <TableRowActionsMenu
                    onEdit={actions?.onEdit ? () => actions.onEdit?.(row) : undefined}
                    onDelete={actions?.onDelete ? () => actions.onDelete?.(row) : undefined}
                    deleteDisabled={
                      typeof actions?.deleteDisabled === "function"
                        ? actions.deleteDisabled(row)
                        : actions?.deleteDisabled
                    }
                  />
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
      {data.length > 0 && footer && <TableFooter>{footer}</TableFooter>}
    </Table>
  );

  if (!bordered) {
    return table;
  }

  return <div className="overflow-hidden rounded-lg border">{table}</div>;
}
