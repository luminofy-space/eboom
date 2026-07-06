import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/app/(dashboard)/calendar/calendar.module.css";

const WEEKDAY_COUNT = 7;
const WEEKS = 6;

export function CalendarSkeleton() {
  return (
    <div
      className={styles.calendarSkeleton}
      role="status"
      aria-busy="true"
      aria-label="Loading calendar"
    >
      <div className={styles.calendarSkeletonHeader}>
        {Array.from({ length: WEEKDAY_COUNT }, (_, index) => (
          <Skeleton key={index} className="mx-auto h-3 w-8 rounded-md" />
        ))}
      </div>
      <div className={styles.calendarSkeletonGrid}>
        {Array.from({ length: WEEKDAY_COUNT * WEEKS }, (_, index) => (
          <Skeleton key={index} className={styles.calendarSkeletonCell} />
        ))}
      </div>
    </div>
  );
}
