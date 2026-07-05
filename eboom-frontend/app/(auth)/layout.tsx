import { AuthShell } from "@/src/views/authentication/AuthShell";
import { authStaticBackgroundStyle } from "@/src/views/authentication/authBackgroundStyle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-svh" style={authStaticBackgroundStyle}>
      <AuthShell>{children}</AuthShell>
    </div>
  );
}
