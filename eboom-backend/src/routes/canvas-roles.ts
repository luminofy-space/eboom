import express, { Request, Response } from "express";
import { inArray } from "drizzle-orm";
import { db } from "../db/client";
import { roles } from "../db/schema";

const router = express.Router();

const CANVAS_ROLE_NAMES = ["Collaborator", "Modifier", "Visitor"];

router.get("/", async (_req: Request, res: Response) => {
  try {
    const canvasRoles = await db
      .select()
      .from(roles)
      .where(inArray(roles.name, CANVAS_ROLE_NAMES));

    res.json({
      roles: canvasRoles.map((r) => ({
        id: r.id,
        name: r.name,
        permissions: r.permissions,
      })),
    });
  } catch (err) {
    console.error("Error fetching canvas roles:", err);
    res.status(500).json({ error: "Failed to fetch canvas roles" });
  }
});

export default router;
