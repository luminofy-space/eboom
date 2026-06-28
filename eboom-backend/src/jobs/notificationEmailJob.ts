import {
  deliverBudgetAlertNotificationsForUser,
  deliverOverdueNotificationEmailsForAllUsers,
} from "../services/notificationService";

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;
const STARTUP_DELAY_MS = 30 * 1000;

function isEnabled(): boolean {
  const flag = process.env.NOTIFICATION_EMAIL_ENABLED;
  if (flag === "0" || flag === "false") return false;
  return true;
}

function getIntervalMs(): number {
  const raw = process.env.NOTIFICATION_EMAIL_INTERVAL_MS;
  const parsed = raw ? parseInt(raw, 10) : DEFAULT_INTERVAL_MS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INTERVAL_MS;
}

async function runJob(): Promise<void> {
  if (!isEnabled()) return;

  try {
    await deliverOverdueNotificationEmailsForAllUsers();
    await deliverBudgetAlertsForAllUsers();
  } catch (err) {
    console.error("Notification job failed:", err);
  }
}

async function deliverBudgetAlertsForAllUsers(): Promise<void> {
  const { db } = await import("../db/client");
  const { canvasMembers, canvases } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  const members = await db
    .selectDistinct({ userId: canvasMembers.userId })
    .from(canvasMembers)
    .innerJoin(canvases, eq(canvasMembers.canvasId, canvases.id))
    .where(eq(canvases.isArchived, false));

  let count = 0;
  for (const { userId } of members) {
    try {
      count += await deliverBudgetAlertNotificationsForUser(userId);
    } catch (err) {
      console.error(`Failed budget alerts for user ${userId}:`, err);
    }
  }
  if (count > 0) {
    console.log(`Created ${count} budget alert notification(s)`);
  }
}

export function startNotificationEmailJob(): void {
  if (!isEnabled()) {
    console.log("Overdue notification emails are disabled");
    return;
  }

  const intervalMs = getIntervalMs();
  console.log(
    `Overdue notification email job scheduled every ${Math.round(intervalMs / 60000)} minute(s)`
  );

  setTimeout(() => {
    void runJob();
    setInterval(() => {
      void runJob();
    }, intervalMs);
  }, STARTUP_DELAY_MS);
}
