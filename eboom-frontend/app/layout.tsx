import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/src/components/QueryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/src/components/AuthProvider";
import ReduxProvider from "@/src/redux/ReduxProvider";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_DESCRIPTION, APP_NAME } from "@/src/lib/siteMetadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style data-fullcalendar />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <I18nProvider>
            <QueryProvider>
              <AuthProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                  <TooltipProvider>
                    {children}
                  </TooltipProvider>
                </ThemeProvider>
              </AuthProvider>
            </QueryProvider>
          </I18nProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
