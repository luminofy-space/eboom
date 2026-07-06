import type { Metadata } from "next";
import { ResetPasswordForm } from "@/src/views/authentication/ResetPassword";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Reset password");

export default function Page() {
  return <ResetPasswordForm />;
}
