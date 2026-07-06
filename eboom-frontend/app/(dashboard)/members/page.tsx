import type { Metadata } from "next";
import CanvasMembersPage from "@/src/views/canvas-members/CanvasMembersPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Manage members");

export default function MembersPage() {
  return <CanvasMembersPage />;
}
