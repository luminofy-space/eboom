import express, { Request, Response } from "express";
import { db } from "../db/client";
import { exchangeRates, currencies } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { parseRouteParam } from "./routeParams";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";

const router = express.Router();

const fromCurrency = alias(currencies, "from_currency");
const toCurrency = alias(currencies, "to_currency");

router.get("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  try {
    const rates = await db
      .select({
        id: exchangeRates.id,
        fromCurrencyId: exchangeRates.fromCurrencyId,
        fromCurrencyCode: fromCurrency.code,
        toCurrencyId: exchangeRates.toCurrencyId,
        toCurrencyCode: toCurrency.code,
        rate: exchangeRates.rate,
        updatedAt: exchangeRates.updatedAt,
      })
      .from(exchangeRates)
      .innerJoin(fromCurrency, eq(exchangeRates.fromCurrencyId, fromCurrency.id))
      .innerJoin(toCurrency, eq(exchangeRates.toCurrencyId, toCurrency.id));

    res.json({ exchangeRates: rates });
  } catch (err) {
    console.error("Error fetching exchange rates:", err);
    sendError(res, ErrorKeys.exchangeRate.fetchFailed, 500);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const { fromCurrencyId, toCurrencyId, rate } = req.body;

  if (!fromCurrencyId || !toCurrencyId) {
    return sendError(res, ErrorKeys.validation.currencyRequired, 400);
  }
  if (Number(fromCurrencyId) === Number(toCurrencyId)) {
    return sendError(res, ErrorKeys.exchangeRate.sameCurrency, 400);
  }
  if (rate === undefined || rate === null || Number(rate) <= 0) {
    return sendError(res, ErrorKeys.exchangeRate.rateRequired, 400);
  }

  try {
    const validCurrencies = await db
      .select({ id: currencies.id })
      .from(currencies)
      .where(inArray(currencies.id, [Number(fromCurrencyId), Number(toCurrencyId)]));

    if (validCurrencies.length < 2) {
      return sendError(res, ErrorKeys.exchangeRate.invalidCurrency, 400);
    }

    const [upserted] = await db
      .insert(exchangeRates)
      .values({
        fromCurrencyId: Number(fromCurrencyId),
        toCurrencyId: Number(toCurrencyId),
        rate: String(rate),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [exchangeRates.fromCurrencyId, exchangeRates.toCurrencyId],
        set: {
          rate: String(rate),
          updatedAt: new Date(),
        },
      })
      .returning();

    res.status(201).json({ exchangeRate: upserted });
  } catch (err) {
    console.error("Error creating exchange rate:", err);
    sendError(res, ErrorKeys.exchangeRate.createFailed, 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return sendError(res, ErrorKeys.common.unauthorized, 401);

  const rateId = parseRouteParam(req.params.id);
  if (isNaN(rateId)) return sendError(res, ErrorKeys.common.invalidId, 400);

  try {
    const [existing] = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.id, rateId));

    if (!existing) return sendError(res, ErrorKeys.exchangeRate.notFound, 404);

    await db.delete(exchangeRates).where(eq(exchangeRates.id, rateId));

    res.json({ message: "Exchange rate deleted successfully" });
  } catch (err) {
    console.error("Error deleting exchange rate:", err);
    sendError(res, ErrorKeys.exchangeRate.deleteFailed, 500);
  }
});

export default router;
