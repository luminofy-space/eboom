"use client";

import { Typography } from "@/components/ui/typography";

interface TableEntityCellProps {
  name: React.ReactNode;
  caption?: React.ReactNode;
}

export function TableEntityCell({ name, caption }: TableEntityCellProps) {
  return (
    <div className="flex flex-col">
      <span>{name}</span>
      {caption && <Typography variant="caption">{caption}</Typography>}
    </div>
  );
}

interface TableNotesCellProps {
  notes: string | null | undefined;
  emptyLabel: string;
}

export function TableNotesCell({ notes, emptyLabel }: TableNotesCellProps) {
  if (notes) {
    return <span title={notes}>{notes}</span>;
  }

  return <span className="text-muted-foreground">{emptyLabel}</span>;
}

export const tableNotesCellClassName = "hidden max-w-[200px] truncate md:table-cell";
