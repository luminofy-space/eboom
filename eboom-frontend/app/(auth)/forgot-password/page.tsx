import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/src/views/authentication/ForgotPassword";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Forgot password");

export default function Page() {
  return <ForgotPasswordForm />;
}
