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
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useNavigationProgress } from "@/src/components/navigation/NavigationProgress";

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
  const pathname = usePathname();
  const { t } = useTranslation("navigation");
  const { navigate } = useNavigationProgress();

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("groups.explore")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={isActive(item.url)}
              tooltip={item.title}
              onClick={() => navigate(item.url)}
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
