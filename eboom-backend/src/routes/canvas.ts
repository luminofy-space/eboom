import express from "express";
const router = express.Router();
import supabase from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

router.post("/", async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { name, description, currency_code } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const canvas = {
      id: uuidv4(),
      owner_id: user.id,
      name,
      description: description || null,
      base_currency: currency_code || "USD",
      created_at: new Date(),
    };
    const { error } = await supabase.from("canvases").insert(canvas);
    if (error) throw error;
    await supabase
      .from("canvas_members")
      .insert({ canvas_id: canvas.id, user_id: user.id, role: "owner" });
    res.status(201).json({ canvas });
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
      .from("canvas_members")
      .select("canvas(*)")
      .eq("user_id", user.id);
    if (error) throw error;
    const canvases = data.map((r) => r.canvas);
    res.json({ canvases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed fetch canvases" });
  }
});

export default router;
