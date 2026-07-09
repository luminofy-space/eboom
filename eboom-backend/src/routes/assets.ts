import express, { Request, Response } from "express";
import { and, asc, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../db/client";
import {
  assets,
  assetCategories,
  assetVolumes,
  currencies,
  pricePoints,
} from "../db/schema";
import { parseRouteParam } from "./routeParams";
import { requireCanvasAccess } from "../middleware/canvasAccess";
import { parseListQueryParams } from "./listQueryParams";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";
import {
  deriveAssetValuation,
  formatMoneyNumber,
  buildValuationSeries,
  validateVolumeSequence,
  type VolumeInput,
  type PricePointInput,
} from "../utils/assetValuation";

const router = express.Router({ mergeParams: true });

function parsePaginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || "";
  const offset = (page - 1) * limit;
  return { page, limit, search, offset };
}

function parseOptionalDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function volumeToInput(row: {
  id: number;
  quantity: string;
  unitPrice: string;
  recordedAt: Date | null;
}): VolumeInput {
  return {
    id: row.id,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    recordedAt: row.recordedAt ?? new Date(0),
  };
}

function pricePointToInput(row: {
  id: number;
  unitPrice: string;
  recordedAt: Date | null;
}): PricePointInput {
  return {
    id: row.id,
    unitPrice: row.unitPrice,
    recordedAt: row.recordedAt ?? new Date(0),
  };
}

async function loadAssetOr404(canvasId: number, assetId: number) {
  const [existing] = await db.select().from(assets).where(eq(assets.id, assetId));
  if (!existing || existing.canvasId !== canvasId) return null;
  return existing;
}

async function loadVolumes(assetId: number) {
  return db
    .select()
    .from(assetVolumes)
    .where(eq(assetVolumes.assetId, assetId))
    .orderBy(asc(assetVolumes.recordedAt), asc(assetVolumes.id));
}

async function loadPricePoints(assetId: number) {
  return db
    .select()
    .from(pricePoints)
    .where(eq(pricePoints.assetId, assetId))
    .orderBy(asc(pricePoints.recordedAt), asc(pricePoints.id));
}

function withDerivedFields(
  asset: Record<string, unknown>,
  volumes: VolumeInput[],
  points: PricePointInput[]
) {
  const derived = deriveAssetValuation(volumes, points);
  return {
    ...asset,
    currentQuantity: formatMoneyNumber(derived.currentQuantity),
    costBasis: formatMoneyNumber(derived.costBasis),
    currentHoldingValue: formatMoneyNumber(derived.currentHoldingValue),
    unrealizedPnL: formatMoneyNumber(derived.unrealizedPnL),
  };
}

router.get("/", requireCanvasAccess("view"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;

  try {
    const { page, limit, search, offset, categoryId, currencyId } = parseListQueryParams(req);

    const conditions = [
      eq(assets.canvasId, canvasId),
      eq(assets.isArchived, false),
    ];

    if (search) {
      conditions.push(ilike(assets.name, `%${search}%`));
    }
    if (categoryId !== undefined) {
      conditions.push(eq(assets.assetCategoryId, categoryId));
    }
    if (currencyId !== undefined) {
      conditions.push(eq(assets.currencyId, currencyId));
    }

    const whereCondition = and(...conditions);

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

    const assetIds = assetsList.map((a) => a.asset.id);
    const allVolumes =
      assetIds.length > 0
        ? await db.select().from(assetVolumes).where(inArray(assetVolumes.assetId, assetIds))
        : [];
    const allPoints =
      assetIds.length > 0
        ? await db.select().from(pricePoints).where(inArray(pricePoints.assetId, assetIds))
        : [];

    const volumesByAsset = new Map<number, VolumeInput[]>();
    for (const v of allVolumes) {
      const list = volumesByAsset.get(v.assetId) ?? [];
      list.push(volumeToInput(v));
      volumesByAsset.set(v.assetId, list);
    }
    const pointsByAsset = new Map<number, PricePointInput[]>();
    for (const p of allPoints) {
      const list = pointsByAsset.get(p.assetId) ?? [];
      list.push(pricePointToInput(p));
      pointsByAsset.set(p.assetId, list);
    }

    const formattedAssets = assetsList.map((a) =>
      withDerivedFields(
        { ...a.asset, category: a.category, currency: a.currency },
        volumesByAsset.get(a.asset.id) ?? [],
        pointsByAsset.get(a.asset.id) ?? []
      )
    );

    res.json({ assets: formattedAssets, items: formattedAssets, total, page, limit });
  } catch (err) {
    console.error("Error fetching assets:", err);
    sendError(res, ErrorKeys.asset.fetchFailed, 500);
  }
});

router.post("/", requireCanvasAccess("edit"), async (req: Request, res: Response) => {
  const canvasId = req.canvasId!;
  const user = req.appUser!;

  const {
    name,
    assetCategoryId,
    currencyId,
    quantity,
    unitPrice,
    description,
    photoUrl,
    recordedAt,
  } = req.body;

  if (!name || !assetCategoryId || !currencyId || unitPrice === undefined || unitPrice === null) {
    return sendError(res, ErrorKeys.validation.failed, 400);
  }

  const parsedAssetCategoryId = Number(assetCategoryId);
  const parsedCurrencyId = Number(currencyId);
  const parsedQuantity = quantity === undefined || quantity === null || quantity === "" ? 1 : Number(quantity);
  const parsedUnitPrice = Number(unitPrice);
  const parsedRecordedAt = parseOptionalDate(recordedAt) ?? new Date();

  if (Number.isNaN(parsedAssetCategoryId) || Number.isNaN(parsedCurrencyId)) {
    return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
  }
  if (Number.isNaN(parsedQuantity) || parsedQuantity === 0) {
    return sendError(res, ErrorKeys.asset.quantityNonZero, 400);
  }
  if (Number.isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
    return sendError(res, ErrorKeys.asset.unitPriceNonNegative, 400);
  }
  if (recordedAt && !parseOptionalDate(recordedAt)) {
    return sendError(res, ErrorKeys.asset.recordedAtInvalid, 400);
  }

  try {
    const [category] = await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.id, parsedAssetCategoryId));
    if (!category) {
      return sendError(res, ErrorKeys.validation.categoryRequired, 400);
    }

    const created = await db.transaction(async (tx) => {
      const [newAsset] = await tx
        .insert(assets)
        .values({
          canvasId,
          name,
          assetCategoryId: parsedAssetCategoryId,
          currencyId: parsedCurrencyId,
          photoUrl: photoUrl || null,
          description: description || null,
          createdBy: user.id,
          lastModifiedBy: user.id,
        })
        .returning();

      const [volume] = await tx
        .insert(assetVolumes)
        .values({
          assetId: newAsset.id,
          quantity: String(parsedQuantity),
          unitPrice: String(parsedUnitPrice),
          recordedAt: parsedRecordedAt,
          createdBy: user.id,
        })
        .returning();

      const [pricePoint] = await tx
        .insert(pricePoints)
        .values({
          assetId: newAsset.id,
          unitPrice: String(parsedUnitPrice),
          recordedAt: parsedRecordedAt,
          createdBy: user.id,
        })
        .returning();

      return { asset: newAsset, volume, pricePoint };
    });

    const derived = withDerivedFields(
      created.asset,
      [volumeToInput(created.volume)],
      [pricePointToInput(created.pricePoint)]
    );

    res.status(201).json({ asset: derived });
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

    const volumes = await loadVolumes(assetId);
    const points = await loadPricePoints(assetId);

    res.json({
      asset: withDerivedFields(
        { ...row.asset, category: row.category, currency: row.currency },
        volumes.map(volumeToInput),
        points.map(pricePointToInput)
      ),
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

  const { name, assetCategoryId, currencyId, description, photoUrl, isArchived } = req.body;

  try {
    const existing = await loadAssetOr404(canvasId, assetId);
    if (!existing) {
      return sendError(res, ErrorKeys.asset.notFound, 404);
    }

    const parsedAssetCategoryId =
      assetCategoryId !== undefined ? Number(assetCategoryId) : undefined;
    const parsedCurrencyId = currencyId !== undefined ? Number(currencyId) : undefined;

    if (
      (parsedAssetCategoryId !== undefined && Number.isNaN(parsedAssetCategoryId)) ||
      (parsedCurrencyId !== undefined && Number.isNaN(parsedCurrencyId))
    ) {
      return sendError(res, ErrorKeys.validation.invalidCategoryOrCurrency, 400);
    }

    if (parsedCurrencyId !== undefined && parsedCurrencyId !== existing.currencyId) {
      return sendError(res, ErrorKeys.asset.currencyLocked, 400);
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
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(isArchived !== undefined && { isArchived }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning();

    const volumes = await loadVolumes(assetId);
    const points = await loadPricePoints(assetId);

    res.json({
      asset: withDerivedFields(
        updatedAsset,
        volumes.map(volumeToInput),
        points.map(pricePointToInput)
      ),
    });
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
    const existing = await loadAssetOr404(canvasId, assetId);
    if (!existing) {
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

router.get(
  "/:assetId/volumes",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const assetId = parseRouteParam(req.params.assetId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const volumes = await loadVolumes(assetId);
      res.json({ volumes, items: volumes });
    } catch (err) {
      console.error("Error fetching asset volumes:", err);
      sendError(res, ErrorKeys.asset.volumeFetchFailed, 500);
    }
  }
);

router.post(
  "/:assetId/volumes",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const user = req.appUser!;
    const assetId = parseRouteParam(req.params.assetId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }

    const { quantity, unitPrice, recordedAt, notes } = req.body;
    const parsedQuantity = Number(quantity);
    const parsedUnitPrice = Number(unitPrice);
    const parsedRecordedAt = parseOptionalDate(recordedAt) ?? new Date();

    if (quantity === undefined || quantity === null || Number.isNaN(parsedQuantity)) {
      return sendError(res, ErrorKeys.asset.quantityRequired, 400);
    }
    if (parsedQuantity === 0) {
      return sendError(res, ErrorKeys.asset.quantityNonZero, 400);
    }
    if (unitPrice === undefined || unitPrice === null || Number.isNaN(parsedUnitPrice)) {
      return sendError(res, ErrorKeys.asset.unitPriceRequired, 400);
    }
    if (parsedUnitPrice < 0) {
      return sendError(res, ErrorKeys.asset.unitPriceNonNegative, 400);
    }
    if (recordedAt && !parseOptionalDate(recordedAt)) {
      return sendError(res, ErrorKeys.asset.recordedAtInvalid, 400);
    }

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const currentVolumes = await loadVolumes(assetId);
      const candidate: VolumeInput[] = [
        ...currentVolumes.map(volumeToInput),
        {
          id: Number.MAX_SAFE_INTEGER,
          quantity: parsedQuantity,
          unitPrice: parsedUnitPrice,
          recordedAt: parsedRecordedAt,
        },
      ];

      try {
        validateVolumeSequence(candidate);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "INSUFFICIENT_QUANTITY") {
          return sendError(res, ErrorKeys.asset.insufficientQuantity, 400);
        }
        return sendError(res, ErrorKeys.validation.failed, 400);
      }

      const [volume] = await db
        .insert(assetVolumes)
        .values({
          assetId,
          quantity: String(parsedQuantity),
          unitPrice: String(parsedUnitPrice),
          recordedAt: parsedRecordedAt,
          notes: notes ?? null,
          createdBy: user.id,
        })
        .returning();

      await db
        .update(assets)
        .set({ lastModifiedBy: user.id, lastModifiedAt: new Date() })
        .where(eq(assets.id, assetId));

      res.status(201).json({ volume });
    } catch (err) {
      console.error("Error creating asset volume:", err);
      sendError(res, ErrorKeys.asset.volumeCreateFailed, 500);
    }
  }
);

router.put(
  "/:assetId/volumes/:volumeId",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const user = req.appUser!;
    const assetId = parseRouteParam(req.params.assetId);
    const volumeId = parseRouteParam(req.params.volumeId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }
    if (Number.isNaN(volumeId)) {
      return sendError(res, ErrorKeys.asset.invalidVolumeId, 400);
    }

    const { quantity, unitPrice, recordedAt, notes } = req.body;

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const [volume] = await db
        .select()
        .from(assetVolumes)
        .where(and(eq(assetVolumes.id, volumeId), eq(assetVolumes.assetId, assetId)));
      if (!volume) {
        return sendError(res, ErrorKeys.asset.volumeNotFound, 404);
      }

      const nextQuantity =
        quantity !== undefined && quantity !== null ? Number(quantity) : Number(volume.quantity);
      const nextUnitPrice =
        unitPrice !== undefined && unitPrice !== null
          ? Number(unitPrice)
          : Number(volume.unitPrice);
      const nextRecordedAt =
        recordedAt !== undefined
          ? parseOptionalDate(recordedAt)
          : volume.recordedAt;

      if (Number.isNaN(nextQuantity) || nextQuantity === 0) {
        return sendError(res, ErrorKeys.asset.quantityNonZero, 400);
      }
      if (Number.isNaN(nextUnitPrice) || nextUnitPrice < 0) {
        return sendError(res, ErrorKeys.asset.unitPriceNonNegative, 400);
      }
      if (recordedAt !== undefined && !nextRecordedAt) {
        return sendError(res, ErrorKeys.asset.recordedAtInvalid, 400);
      }

      const currentVolumes = await loadVolumes(assetId);
      const candidate: VolumeInput[] = currentVolumes.map((v) =>
        v.id === volumeId
          ? {
              id: v.id,
              quantity: nextQuantity,
              unitPrice: nextUnitPrice,
              recordedAt: nextRecordedAt ?? new Date(0),
            }
          : volumeToInput(v)
      );

      try {
        validateVolumeSequence(candidate);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "INSUFFICIENT_QUANTITY") {
          return sendError(res, ErrorKeys.asset.insufficientQuantity, 400);
        }
        return sendError(res, ErrorKeys.validation.failed, 400);
      }

      const [updated] = await db
        .update(assetVolumes)
        .set({
          quantity: String(nextQuantity),
          unitPrice: String(nextUnitPrice),
          recordedAt: nextRecordedAt ?? volume.recordedAt!,
          ...(notes !== undefined && { notes }),
        })
        .where(eq(assetVolumes.id, volumeId))
        .returning();

      await db
        .update(assets)
        .set({ lastModifiedBy: user.id, lastModifiedAt: new Date() })
        .where(eq(assets.id, assetId));

      res.json({ volume: updated });
    } catch (err) {
      console.error("Error updating asset volume:", err);
      sendError(res, ErrorKeys.asset.volumeUpdateFailed, 500);
    }
  }
);

router.delete(
  "/:assetId/volumes/:volumeId",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const user = req.appUser!;
    const assetId = parseRouteParam(req.params.assetId);
    const volumeId = parseRouteParam(req.params.volumeId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }
    if (Number.isNaN(volumeId)) {
      return sendError(res, ErrorKeys.asset.invalidVolumeId, 400);
    }

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const [volume] = await db
        .select()
        .from(assetVolumes)
        .where(and(eq(assetVolumes.id, volumeId), eq(assetVolumes.assetId, assetId)));
      if (!volume) {
        return sendError(res, ErrorKeys.asset.volumeNotFound, 404);
      }

      const currentVolumes = await loadVolumes(assetId);
      const candidate = currentVolumes.filter((v) => v.id !== volumeId).map(volumeToInput);

      try {
        if (candidate.length > 0) validateVolumeSequence(candidate);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "INSUFFICIENT_QUANTITY") {
          return sendError(res, ErrorKeys.asset.insufficientQuantity, 400);
        }
        return sendError(res, ErrorKeys.validation.failed, 400);
      }

      await db.delete(assetVolumes).where(eq(assetVolumes.id, volumeId));

      await db
        .update(assets)
        .set({ lastModifiedBy: user.id, lastModifiedAt: new Date() })
        .where(eq(assets.id, assetId));

      res.json({ message: "Volume deleted successfully" });
    } catch (err) {
      console.error("Error deleting asset volume:", err);
      sendError(res, ErrorKeys.asset.volumeDeleteFailed, 500);
    }
  }
);

router.get(
  "/:assetId/price-points",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const assetId = parseRouteParam(req.params.assetId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const points = await loadPricePoints(assetId);
      res.json({ pricePoints: points, items: points });
    } catch (err) {
      console.error("Error fetching price points:", err);
      sendError(res, ErrorKeys.asset.pricePointFetchFailed, 500);
    }
  }
);

router.post(
  "/:assetId/price-points",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const user = req.appUser!;
    const assetId = parseRouteParam(req.params.assetId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }

    const { unitPrice, recordedAt, notes } = req.body;
    const parsedUnitPrice = Number(unitPrice);
    const parsedRecordedAt = parseOptionalDate(recordedAt) ?? new Date();

    if (unitPrice === undefined || unitPrice === null || Number.isNaN(parsedUnitPrice)) {
      return sendError(res, ErrorKeys.asset.unitPricePointRequired, 400);
    }
    if (parsedUnitPrice < 0) {
      return sendError(res, ErrorKeys.asset.unitPricePointNonNegative, 400);
    }
    if (recordedAt && !parseOptionalDate(recordedAt)) {
      return sendError(res, ErrorKeys.asset.recordedAtInvalid, 400);
    }

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const [point] = await db
        .insert(pricePoints)
        .values({
          assetId,
          unitPrice: String(parsedUnitPrice),
          recordedAt: parsedRecordedAt,
          notes: notes ?? null,
          createdBy: user.id,
        })
        .returning();

      await db
        .update(assets)
        .set({ lastModifiedBy: user.id, lastModifiedAt: new Date() })
        .where(eq(assets.id, assetId));

      res.status(201).json({ pricePoint: point });
    } catch (err) {
      console.error("Error creating price point:", err);
      sendError(res, ErrorKeys.asset.pricePointCreateFailed, 500);
    }
  }
);

router.put(
  "/:assetId/price-points/:pricePointId",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const user = req.appUser!;
    const assetId = parseRouteParam(req.params.assetId);
    const pricePointId = parseRouteParam(req.params.pricePointId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }
    if (Number.isNaN(pricePointId)) {
      return sendError(res, ErrorKeys.asset.invalidPricePointId, 400);
    }

    const { unitPrice, recordedAt, notes } = req.body;

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const [point] = await db
        .select()
        .from(pricePoints)
        .where(and(eq(pricePoints.id, pricePointId), eq(pricePoints.assetId, assetId)));
      if (!point) {
        return sendError(res, ErrorKeys.asset.pricePointNotFound, 404);
      }

      const nextUnitPrice =
        unitPrice !== undefined && unitPrice !== null
          ? Number(unitPrice)
          : Number(point.unitPrice);
      const nextRecordedAt =
        recordedAt !== undefined ? parseOptionalDate(recordedAt) : point.recordedAt;

      if (Number.isNaN(nextUnitPrice) || nextUnitPrice < 0) {
        return sendError(res, ErrorKeys.asset.unitPricePointNonNegative, 400);
      }
      if (recordedAt !== undefined && !nextRecordedAt) {
        return sendError(res, ErrorKeys.asset.recordedAtInvalid, 400);
      }

      const [updated] = await db
        .update(pricePoints)
        .set({
          unitPrice: String(nextUnitPrice),
          recordedAt: nextRecordedAt ?? point.recordedAt!,
          ...(notes !== undefined && { notes }),
        })
        .where(eq(pricePoints.id, pricePointId))
        .returning();

      await db
        .update(assets)
        .set({ lastModifiedBy: user.id, lastModifiedAt: new Date() })
        .where(eq(assets.id, assetId));

      res.json({ pricePoint: updated });
    } catch (err) {
      console.error("Error updating price point:", err);
      sendError(res, ErrorKeys.asset.pricePointUpdateFailed, 500);
    }
  }
);

router.delete(
  "/:assetId/price-points/:pricePointId",
  requireCanvasAccess("edit"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const user = req.appUser!;
    const assetId = parseRouteParam(req.params.assetId);
    const pricePointId = parseRouteParam(req.params.pricePointId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }
    if (Number.isNaN(pricePointId)) {
      return sendError(res, ErrorKeys.asset.invalidPricePointId, 400);
    }

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const [point] = await db
        .select()
        .from(pricePoints)
        .where(and(eq(pricePoints.id, pricePointId), eq(pricePoints.assetId, assetId)));
      if (!point) {
        return sendError(res, ErrorKeys.asset.pricePointNotFound, 404);
      }

      await db.delete(pricePoints).where(eq(pricePoints.id, pricePointId));

      await db
        .update(assets)
        .set({ lastModifiedBy: user.id, lastModifiedAt: new Date() })
        .where(eq(assets.id, assetId));

      res.json({ message: "Price point deleted successfully" });
    } catch (err) {
      console.error("Error deleting price point:", err);
      sendError(res, ErrorKeys.asset.pricePointDeleteFailed, 500);
    }
  }
);

router.get(
  "/:assetId/valuation-series",
  requireCanvasAccess("view"),
  async (req: Request, res: Response) => {
    const canvasId = req.canvasId!;
    const assetId = parseRouteParam(req.params.assetId);
    if (Number.isNaN(assetId)) {
      return sendError(res, ErrorKeys.asset.invalidId, 400);
    }

    try {
      const existing = await loadAssetOr404(canvasId, assetId);
      if (!existing) {
        return sendError(res, ErrorKeys.asset.notFound, 404);
      }

      const volumes = await loadVolumes(assetId);
      const points = await loadPricePoints(assetId);
      const series = buildValuationSeries(
        volumes.map(volumeToInput),
        points.map(pricePointToInput)
      ).map((p) => ({
        recordedAt: p.recordedAt,
        unitPrice: formatMoneyNumber(p.unitPrice),
        quantity: formatMoneyNumber(p.quantity),
        costBasis: formatMoneyNumber(p.costBasis),
        holdingValue: formatMoneyNumber(p.holdingValue),
        unrealizedPnL: formatMoneyNumber(p.unrealizedPnL),
      }));

      res.json({ series, items: series });
    } catch (err) {
      console.error("Error fetching valuation series:", err);
      sendError(res, ErrorKeys.asset.fetchFailed, 500);
    }
  }
);

export default router;
