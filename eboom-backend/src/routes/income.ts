import express from "express";
const router = express.Router();
import supabase from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

router.post("/", async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { name, currency, amount, date, type } = req.body;

  if (!name) return res.status(400).json({ error: "name required" });
  if (!currency) res.status(400).json({ error: "currency required" });
  if (!amount) res.status(400).json({ error: "amount required" });
  if (!date) res.status(400).json({ error: "date required" });
  if (!type) res.status(400).json({ error: "type required" });
  try {
    const income = {
      id: uuidv4(),
      owner_id: user.id,
      name,
      currency_code: currency,
      amount: amount,
      date: date,
      type: type,
      created_at: new Date(),
    };
    const { error } = await supabase.from("incomes").insert(income);
    if (error) throw error;
    await supabase
      .from("income_user")
      .insert({ canvas_id: income.id, user_id: user.id, role: "owner" });
    res.status(201).json({ income });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed create canvas" });
  }
});

router.get("/", async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { data, error } = await supabase
      .from("income_user")
      .select("income(*)")
      .eq("user_id", user.id);
    if (error) throw error;
    const incomes = data.map((r) => r.income);
    res.json({ incomes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed fetch incomes" });
  }
});

export default router;
