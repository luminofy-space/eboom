import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatRelativeEdit(date: string | Date | null | undefined): string {
  if (!date) return "";
  return `Edited ${dayjs(date).fromNow()}`;
}
