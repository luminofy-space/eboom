import type { Metadata } from "next";
import { ComingSoonPlaceholder } from "@/src/components/ComingSoonPlaceholder";
import { pageTitle } from "@/src/lib/siteMetadata";

export const metadata: Metadata = pageTitle("Wish List");

export default function WishListPage() {
  return (
    <ComingSoonPlaceholder
      title="Wish List"
      description="Keep a list of items you'd like to buy. Share it with friends and family so they can find the perfect gift for any occasion."
    />
  );
}
