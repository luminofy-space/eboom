import type { Metadata } from "next";
import WhiteboardPage from "@/src/views/whiteboard/WhiteboardPage";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Whiteboard");

export default function Page() {
  return <WhiteboardPage />;
}
