"use client";

import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";

export function NavUpcoming({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    badge?: string;
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Explore</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={isActive(item.url)}
              tooltip={item.title}
              onClick={() => router.push(item.url)}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
            {item.badge && (
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
