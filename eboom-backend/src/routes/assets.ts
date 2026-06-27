import express, { Request, Response } from "express";
import { db } from "../db/client";
import { assets, assetCategories, currencies } from "../db/schema";
import { eq } from "drizzle-orm";
import { checkCanvasPermission } from "../services/canvasAccessService";
import { parseRouteParam } from "./routeParams";

const router = express.Router();

function denyPermission(res: Response, access: { allowed: false; status: 403; error: string }) {
  return res.status(access.status).json({ error: access.error });
}

router.get("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const assetId = parseRouteParam(req.params.id);
  if (isNaN(assetId)) {
    return res.status(400).json({ error: "Invalid asset ID" });
  }

  try {
    const [row] = await db
      .select({
        asset: assets,
        category: assetCategories,
        currency: currencies,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.assetCategoryId, assetCategories.id))
      .leftJoin(currencies, eq(assets.currencyId, currencies.id))
      .where(eq(assets.id, assetId));

    if (!row) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const access = await checkCanvasPermission(row.asset.canvasId, user.id, "view");
    if (!access.allowed) return denyPermission(res, access);

    res.json({
      asset: {
        ...row.asset,
        category: row.category,
        currency: row.currency,
      },
    });
  } catch (err) {
    console.error("Error fetching asset:", err);
    res.status(500).json({ error: "Failed to fetch asset" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const assetId = parseRouteParam(req.params.id);
  if (isNaN(assetId)) {
    return res.status(400).json({ error: "Invalid asset ID" });
  }

  const {
    name,
    assetCategoryId,
    currencyId,
    estimatedValue,
    description,
    photoUrl,
    isArchived,
  } = req.body;

  try {
    const [existing] = await db.select().from(assets).where(eq(assets.id, assetId));

    if (!existing) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const access = await checkCanvasPermission(existing.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    const parsedAssetCategoryId =
      assetCategoryId !== undefined ? Number(assetCategoryId) : undefined;
    const parsedCurrencyId = currencyId !== undefined ? Number(currencyId) : undefined;
    const parsedEstimatedValue =
      estimatedValue !== undefined ? Number(estimatedValue) : undefined;

    if (
      (parsedAssetCategoryId !== undefined && Number.isNaN(parsedAssetCategoryId)) ||
      (parsedCurrencyId !== undefined && Number.isNaN(parsedCurrencyId)) ||
      (parsedEstimatedValue !== undefined &&
        (Number.isNaN(parsedEstimatedValue) || parsedEstimatedValue < 0))
    ) {
      return res.status(400).json({ error: "Invalid category, currency, or estimated value" });
    }

    if (parsedAssetCategoryId !== undefined) {
      const [category] = await db
        .select()
        .from(assetCategories)
        .where(eq(assetCategories.id, parsedAssetCategoryId));
      if (!category) {
        return res.status(400).json({ error: "Invalid asset category" });
      }
    }

    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...(name !== undefined && { name }),
        ...(parsedAssetCategoryId !== undefined && { assetCategoryId: parsedAssetCategoryId }),
        ...(parsedCurrencyId !== undefined && { currencyId: parsedCurrencyId }),
        ...(parsedEstimatedValue !== undefined && {
          estimatedValue: String(parsedEstimatedValue),
        }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning();

    res.json({ asset: updatedAsset });
  } catch (err) {
    console.error("Error updating asset:", err);
    res.status(500).json({ error: "Failed to update asset" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const assetId = parseRouteParam(req.params.id);
  if (isNaN(assetId)) {
    return res.status(400).json({ error: "Invalid asset ID" });
  }

  try {
    const [existing] = await db.select().from(assets).where(eq(assets.id, assetId));

    if (!existing) {
      return res.status(404).json({ error: "Asset not found" });
    }

    const access = await checkCanvasPermission(existing.canvasId, user.id, "edit");
    if (!access.allowed) return denyPermission(res, access);

    await db
      .update(assets)
      .set({
        isArchived: true,
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(assets.id, assetId));

    res.json({ message: "Asset archived successfully" });
  } catch (err) {
    console.error("Error deleting asset:", err);
    res.status(500).json({ error: "Failed to delete asset" });
  }
});

export default router;
