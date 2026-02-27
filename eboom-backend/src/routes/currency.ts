import express from "express";
const router = express.Router();
import { db } from "../db/client";
import { currencies } from "../db/schema";
import { eq } from "drizzle-orm";

router.get("/", async (req, res) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const data = await db.select().from(currencies).where(eq(currencies.isActive, true));
    res.json({ currencies: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed fetch currencies" });
  }
});

export default router;
