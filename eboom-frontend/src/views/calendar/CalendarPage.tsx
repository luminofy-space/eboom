"use client";

import dynamic from "next/dynamic";

const CalendarView = dynamic(() => import("@/src/views/calendar/CalendarView"), {
  ssr: false,
  loading: () => null,
});

export default function CalendarPage() {
  return <CalendarView />;
}
