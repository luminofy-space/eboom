import express, { Request, Response } from "express";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db } from "../db/client";
import { assets, assetCategories, currencies } from "../db/schema";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router({ mergeParams: true });

function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const { page, limit, search, offset } = parsePaginationParams(req);

    const whereCondition = search
      ? and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false), ilike(assets.name, `%${search}%`))
      : and(eq(assets.canvasId, canvasId), eq(assets.isArchived, false));

    const [{ total }] = await db
      .select({ total: count() })
      .from(assets)
      .where(whereCondition);

    const assetsList = await db
      .select({
        asset: assets,
        category: assetCategories,
        currency: currencies,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.assetCategoryId, assetCategories.id))
      .leftJoin(currencies, eq(assets.currencyId, currencies.id))
      .where(whereCondition)
      .orderBy(desc(assets.lastModifiedAt))
      .limit(limit)
      .offset(offset);

    const formattedAssets = assetsList.map((a) => ({
      ...a.asset,
      category: a.category,
      currency: a.currency,
    }));

    res.json({ assets: formattedAssets, items: formattedAssets, total, page, limit });
  } catch (err) {
    console.error("Error fetching assets:", err);
    sendError(res, ErrorKeys.asset.fetchFailed, 500);
  }
});

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const { name, assetCategoryId, currencyId, estimatedValue, description, photoUrl } = req.body;

  if (!name || !assetCategoryId || !currencyId || estimatedValue === undefined || estimatedValue === null) {
    return sendError(res, ErrorKeys.validation.failed, 400);
  }

  const parsedAssetCategoryId = Number(assetCategoryId);
  const parsedCurrencyId = Number(currencyId);
  const parsedEstimatedValue = Number(estimatedValue);

  if (
    Number.isNaN(parsedAssetCategoryId) ||
    Number.isNaN(parsedCurrencyId) ||
    Number.isNaN(parsedEstimatedValue) ||
    parsedEstimatedValue < 0
  ) {
    return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
  }

  try {
    const [category] = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, parsedAssetCategoryId));
    if (!category) {
      return sendError(res, ErrorKeys.validation.categoryRequired, 400);
    }

    const [newAsset] = await db
      .insert(assets)
      .values({
        canvasId,
        name,
        assetCategoryId: parsedAssetCategoryId,
        currencyId: parsedCurrencyId,
        estimatedValue: String(parsedEstimatedValue),
        photoUrl: photoUrl || null,
        description: description || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ asset: newAsset });
  } catch (err) {
    console.error("Error creating asset:", err);
    sendError(res, ErrorKeys.asset.createFailed, 500);
  }
});

router.get("/:assetId", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const assetId = parseRouteParam(req.params.assetId);
  if (Number.isNaN(assetId)) {
    return sendError(res, ErrorKeys.asset.invalidId, 400);
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

    if (!row || row.asset.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.asset.notFound, 404);
    }

    res.json({
      asset: {
        ...row.asset,
        category: row.category,
        currency: row.currency,
      },
    });
  } catch (err) {
    console.error("Error fetching asset:", err);
    sendError(res, ErrorKeys.asset.fetchFailed, 500);
  }
});

router.put("/:assetId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const assetId = parseRouteParam(req.params.assetId);
  if (Number.isNaN(assetId)) {
    return sendError(res, ErrorKeys.asset.invalidId, 400);
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

    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.asset.notFound, 404);
    }

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
      return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
    }

    if (parsedAssetCategoryId !== undefined) {
      const [category] = await db
        .select()
        .from(assetCategories)
        .where(eq(assetCategories.id, parsedAssetCategoryId));
      if (!category) {
        return sendError(res, ErrorKeys.validation.categoryRequired, 400);
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
    sendError(res, ErrorKeys.asset.updateFailed, 500);
  }
});

router.delete("/:assetId", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;
  const assetId = parseRouteParam(req.params.assetId);
  if (Number.isNaN(assetId)) {
    return sendError(res, ErrorKeys.asset.invalidId, 400);
  }

  try {
    const [existing] = await db.select().from(assets).where(eq(assets.id, assetId));

    if (!existing || existing.canvasId !== canvasId) {
      return sendError(res, ErrorKeys.asset.notFound, 404);
    }

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
    sendError(res, ErrorKeys.asset.deleteFailed, 500);
  }
});

export default router;
