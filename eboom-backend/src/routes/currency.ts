import express from "express";
const router = express.Router();
import supabase from "../supabaseClient";

router.get("/", async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { data, error } = await supabase
      .from('currencies')
      .select('*');

    if (error) throw error;
    res.json({ currencies: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed fetch currencies" });
  }
});

export default router;
