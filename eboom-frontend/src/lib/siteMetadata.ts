import type { Metadata } from "next";

export const APP_NAME = "eBoom";

export const APP_DESCRIPTION =
  "Track income, wallets, expenses, and transfers across multiple currencies. Built for individuals, families, and small businesses.";

export function pageTitle(page: string): Metadata {
  return { title: page };
}
