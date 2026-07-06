import type { Metadata } from "next";
import { LoginForm } from "@/src/views/authentication/Login";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Log in");

export default function Page() {
  return <LoginForm />;
}
