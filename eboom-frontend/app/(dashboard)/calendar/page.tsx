import type { Metadata } from "next";
import CalendarPage from "@/src/views/calendar/CalendarPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Calendar");

export default CalendarPage;
