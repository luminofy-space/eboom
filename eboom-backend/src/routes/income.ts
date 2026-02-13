import express, { Request, Response } from "express";
import { db } from "../db/client";
import {
  incomeResources,
  canvasMembers,
  incomeResourceCategories,
  valueCategories,
  incomeTransactions,
  assets,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { IncomeResource, NewIncomeResource, IncomeTransaction, User } from "../db/schema/models";

const router = express.Router();

// Helper function to check canvas access
async function checkCanvasAccess(
  canvasId: number,
  userId: number
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(canvasMembers)
    .where(
      and(eq(canvasMembers.canvasId, canvasId), eq(canvasMembers.userId, userId))
    );
  return !!membership;
}

// ============================================================================
// INCOME RESOURCES ROUTES
// ============================================================================

// GET /resources/:id - Get a specific income resource
router.get("/resources/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.id);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  try {
    // Get the income resource with category info
    const [resource] = await db
      .select({
        incomeResource: incomeResources,
        category: incomeResourceCategories,
        valueCategory: valueCategories,
      })
      .from(incomeResources)
      .leftJoin(
        incomeResourceCategories,
        eq(incomeResources.incomeResourceCategoryId, incomeResourceCategories.id)
      )
      .leftJoin(
        valueCategories,
        eq(incomeResources.defaultValueCategoryId, valueCategories.id)
      )
      .where(eq(incomeResources.id, resourceId));

    if (!resource) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(
      resource.incomeResource.canvasId,
      user.id
    );
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      incomeResource: {
        ...resource.incomeResource,
        category: resource.category,
        defaultValueCategory: resource.valueCategory,
      },
    });
  } catch (err) {
    console.error("Error fetching income resource:", err);
    res.status(500).json({ error: "Failed to fetch income resource" });
  }
});

// PUT /resources/:id - Update an income resource
router.put("/resources/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.id);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  const {
    name,
    incomeResourceCategoryId,
    ownerId,
    defaultValueCategoryId,
    defaultEntityId,
    defaultAssetId,
    isRecurring,
    recurrencePattern,
    photoUrl,
    description,
  } = req.body;

  try {
    // Get the existing resource to check canvas access
    const [existing] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));

    if (!existing) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the income resource
    const [updatedResource] = await db
      .update(incomeResources)
      .set({
        ...(name !== undefined && { name }),
        ...(incomeResourceCategoryId !== undefined && { incomeResourceCategoryId }),
        ...(ownerId !== undefined && { ownerId }),
        ...(defaultValueCategoryId !== undefined && { defaultValueCategoryId }),
        ...(defaultEntityId !== undefined && { defaultEntityId }),
        ...(defaultAssetId !== undefined && { defaultAssetId }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrencePattern !== undefined && { recurrencePattern }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(description !== undefined && { description }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(incomeResources.id, resourceId))
      .returning();

    res.json({ incomeResource: updatedResource });
  } catch (err) {
    console.error("Error updating income resource:", err);
    res.status(500).json({ error: "Failed to update income resource" });
  }
});

// DELETE /resources/:id - Delete an income resource
router.delete("/resources/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.id);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  try {
    // Get the existing resource to check canvas access
    const [existing] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));

    if (!existing) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(existing.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete the income resource
    await db.delete(incomeResources).where(eq(incomeResources.id, resourceId));

    res.json({ message: "Income resource deleted successfully" });
  } catch (err) {
    console.error("Error deleting income resource:", err);
    res.status(500).json({ error: "Failed to delete income resource" });
  }
});

// ============================================================================
// INCOME TRANSACTIONS ROUTES
// ============================================================================

// GET /resources/:resourceId/transactions - Get transactions for an income resource
router.get("/resources/:resourceId/transactions", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.resourceId);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  try {
    // Get the income resource to check canvas access
    const [resource] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));

    if (!resource) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(resource.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all transactions for this income resource
    const transactions = await db
      .select({
        transaction: incomeTransactions,
        destinationAsset: assets,
      })
      .from(incomeTransactions)
      .leftJoin(assets, eq(incomeTransactions.destinationAssetId, assets.id))
      .where(eq(incomeTransactions.incomeResourceId, resourceId));

    const formattedTransactions = transactions.map((t) => ({
      ...t.transaction,
      destinationAsset: t.destinationAsset,
    }));

    res.json({ transactions: formattedTransactions });
  } catch (err) {
    console.error("Error fetching income transactions:", err);
    res.status(500).json({ error: "Failed to fetch income transactions" });
  }
});

// POST /resources/:resourceId/transactions - Create an income transaction
router.post("/resources/:resourceId/transactions", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const resourceId = parseInt(req.params.resourceId);
  if (isNaN(resourceId)) {
    return res.status(400).json({ error: "Invalid income resource ID" });
  }

  const {
    destinationAssetId,
    amount,
    expectedDate,
    receivedDate,
    status,
    notes,
    description,
    photoUrl,
  } = req.body;

  if (!destinationAssetId || !amount) {
    return res.status(400).json({
      error: "Destination asset and amount are required",
    });
  }

  try {
    // Get the income resource to check canvas access
    const [resource] = await db
      .select()
      .from(incomeResources)
      .where(eq(incomeResources.id, resourceId));

    if (!resource) {
      return res.status(404).json({ error: "Income resource not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(resource.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create the income transaction
    const [newTransaction] = await db
      .insert(incomeTransactions)
      .values({
        incomeResourceId: resourceId,
        destinationAssetId,
        amount,
        expectedDate: expectedDate || null,
        receivedDate: receivedDate || null,
        status: status || 'pending',
        notes: notes || null,
        description: description || null,
        photoUrl: photoUrl || null,
        createdBy: user.id,
        lastModifiedBy: user.id,
      })
      .returning();

    res.status(201).json({ transaction: newTransaction });
  } catch (err) {
    console.error("Error creating income transaction:", err);
    res.status(500).json({ error: "Failed to create income transaction" });
  }
});

// PUT /transactions/:id - Update an income transaction
router.put("/transactions/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const transactionId = parseInt(req.params.id);
  if (isNaN(transactionId)) {
    return res.status(400).json({ error: "Invalid transaction ID" });
  }

  const {
    destinationAssetId,
    amount,
    expectedDate,
    receivedDate,
    status,
    notes,
    description,
    photoUrl,
  } = req.body;

  try {
    // Get the transaction and its resource to check canvas access
    const [transaction] = await db
      .select({
        transaction: incomeTransactions,
        resource: incomeResources,
      })
      .from(incomeTransactions)
      .leftJoin(
        incomeResources,
        eq(incomeTransactions.incomeResourceId, incomeResources.id)
      )
      .where(eq(incomeTransactions.id, transactionId));

    if (!transaction || !transaction.resource) {
      return res.status(404).json({ error: "Income transaction not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(transaction.resource.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the transaction
    const [updatedTransaction] = await db
      .update(incomeTransactions)
      .set({
        ...(destinationAssetId !== undefined && { destinationAssetId }),
        ...(amount !== undefined && { amount }),
        ...(expectedDate !== undefined && { expectedDate }),
        ...(receivedDate !== undefined && { receivedDate }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(description !== undefined && { description }),
        ...(photoUrl !== undefined && { photoUrl }),
        lastModifiedBy: user.id,
        lastModifiedAt: new Date(),
      })
      .where(eq(incomeTransactions.id, transactionId))
      .returning();

    res.json({ transaction: updatedTransaction });
  } catch (err) {
    console.error("Error updating income transaction:", err);
    res.status(500).json({ error: "Failed to update income transaction" });
  }
});

// DELETE /transactions/:id - Delete an income transaction
router.delete("/transactions/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const transactionId = parseInt(req.params.id);
  if (isNaN(transactionId)) {
    return res.status(400).json({ error: "Invalid transaction ID" });
  }

  try {
    // Get the transaction and its resource to check canvas access
    const [transaction] = await db
      .select({
        transaction: incomeTransactions,
        resource: incomeResources,
      })
      .from(incomeTransactions)
      .leftJoin(
        incomeResources,
        eq(incomeTransactions.incomeResourceId, incomeResources.id)
      )
      .where(eq(incomeTransactions.id, transactionId));

    if (!transaction || !transaction.resource) {
      return res.status(404).json({ error: "Income transaction not found" });
    }

    // Check canvas access
    const hasAccess = await checkCanvasAccess(transaction.resource.canvasId, user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete the transaction
    await db.delete(incomeTransactions).where(eq(incomeTransactions.id, transactionId));

    res.json({ message: "Income transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting income transaction:", err);
    res.status(500).json({ error: "Failed to delete income transaction" });
  }
});

export default router;
