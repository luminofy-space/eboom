// Canvas presentation state -- whiteboard viewport and node positions.

import {
  integer,
  numeric,
  unique,
} from "drizzle-orm/pg-core";
import { workspaceSchema } from "./schemas";
import { pk, updatedAt } from "./columns";
import { canvases } from "./identity";

export const whiteboardEntityTypeEnum = workspaceSchema.enum("whiteboard_entity_type", [
  "wallet",
  "income",
  "expense",
]);

export const whiteboardViewports = workspaceSchema.table("whiteboard_viewports", {
  canvasId: integer("canvas_id")
    .primaryKey()
    .references(() => canvases.id),
  x: numeric("x", { precision: 12, scale: 4 }).notNull().default("0"),
  y: numeric("y", { precision: 12, scale: 4 }).notNull().default("0"),
  zoom: numeric("zoom", { precision: 8, scale: 4 }).notNull().default("1"),
  updatedAt: updatedAt(),
});

export const whiteboardNodePositions = workspaceSchema.table("whiteboard_node_positions",
  {
    id: pk(),
    canvasId: integer("canvas_id")
      .notNull()
      .references(() => canvases.id),
    entityType: whiteboardEntityTypeEnum("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    x: numeric("x", { precision: 12, scale: 4 }).notNull(),
    y: numeric("y", { precision: 12, scale: 4 }).notNull(),
    updatedAt: updatedAt(),
  },
  (table) => ({
    uniqueCanvasEntity: unique().on(table.canvasId, table.entityType, table.entityId),
  })
);
