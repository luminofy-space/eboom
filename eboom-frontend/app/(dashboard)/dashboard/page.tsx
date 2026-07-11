import type { Metadata } from "next";
import DashboardPage from "@/src/views/dashboard/DashboardPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Overview");

export default DashboardPage;
