import express, { Request, Response } from "express";
import {
  deliverOverdueNotificationEmailsForUser,
  getOverdueNotifications,
} from "../services/notificationService";

const router = express.Router();

router.get("/overdue", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const notifications = await getOverdueNotifications(user.id);
    res.json({ notifications });

    void deliverOverdueNotificationEmailsForUser(user.id).catch((err) => {
      console.error(`Failed to deliver overdue notification email for user ${user.id}:`, err);
    });
  } catch (err) {
    console.error("Error fetching overdue notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

export default router;
