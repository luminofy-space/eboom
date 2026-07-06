import type { Metadata } from "next";
import { ConfirmEmailForm } from "@/src/views/authentication/ConfirmEmail";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Email confirmation");

export default function Page() {
  return <ConfirmEmailForm />;
}
