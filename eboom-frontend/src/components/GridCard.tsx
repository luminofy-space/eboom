"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatRelativeEdit } from "@/src/utils/date";
import { useState } from "react";

interface GridCardProps {
  href: string;
  imageUrl?: string | null;
  title: string;
  updatedAt?: string | Date | null;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GridCard({ href, imageUrl, title, updatedAt, className, onEdit, onDelete }: GridCardProps) {
  const hasActions = onEdit || onDelete;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Link href={href} className={cn("block group", className)}>
      <Card
        className={cn(
          "relative aspect-[4/3] overflow-hidden p-0 gap-0",
          "transition-transform group-hover:scale-[1.02]",
          !imageUrl && "bg-gradient-to-br from-muted to-accent"
        )}
      >
        {imageUrl && (
          <CardContent className="absolute inset-0 p-0">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          </CardContent>
        )}

        {/* 3-dot action menu */}
        {hasActions && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-xs"
                  className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white border-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Dark gradient overlay at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

        <CardFooter className="absolute inset-x-0 bottom-0 p-3 flex-col items-start gap-0">
          <h3 className="text-white font-semibold text-sm truncate w-full">{title}</h3>
          {updatedAt && (
            <p className="text-white/70 text-xs mt-0.5">
              {formatRelativeEdit(updatedAt)}
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
