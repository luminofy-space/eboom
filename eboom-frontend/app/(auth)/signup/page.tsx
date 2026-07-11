import type { Metadata } from "next";
import { SignupForm } from "@/src/views/authentication/Signup";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Sign up");

export default function Page() {
  return <SignupForm />;
}
