import type { Metadata } from "next";
import { VerifyEmail } from "@/src/views/authentication/VerifyEmail";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Verify email");

export default function Page() {
  return <VerifyEmail />;
}
