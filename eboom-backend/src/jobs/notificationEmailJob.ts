import { deliverOverdueNotificationEmailsForAllUsers } from "../services/notificationService";

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
  } catch (err) {
    console.error("Overdue notification email job failed:", err);
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
