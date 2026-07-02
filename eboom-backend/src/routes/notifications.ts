import express, { Request, Response } from "express";
import {
  deliverBudgetAlertNotificationsForUser,
  deliverOverdueNotificationEmailsForUser,
  getBudgetAlertNotifications,
  getOverdueNotifications,
} from "../services/notificationService";

const router = express.Router();

router.get("/overdue", async (req: Request, res: Response) => {
  const user = req.appUser;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const notifications = await getOverdueNotifications(user.id);
    const budgetAlerts = await getBudgetAlertNotifications(user.id);
    res.json({ notifications, budgetAlerts });

    void deliverOverdueNotificationEmailsForUser(user.id).catch((err) => {
      console.error(`Failed to deliver overdue notification email for user ${user.id}:`, err);
    });
    void deliverBudgetAlertNotificationsForUser(user.id).catch((err) => {
      console.error(`Failed to deliver budget alerts for user ${user.id}:`, err);
    });
  } catch (err) {
    console.error("Error fetching overdue notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

export default router;
