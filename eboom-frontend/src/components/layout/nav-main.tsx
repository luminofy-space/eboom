"use client";

import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    const base = url.replace(/s$/, "");
    return pathname === url || pathname.startsWith(base);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuButton
            key={item.title}
            isActive={isActive(item.url)}
            tooltip={item.title}
            onClick={() => router.push(item.url)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </SidebarMenuButton>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
