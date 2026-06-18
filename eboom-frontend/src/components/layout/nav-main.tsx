"use client";

import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string;
    icon?: LucideIcon;
    badge?: number;
    onClick?: () => void;
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation("navigation");

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    const base = url.replace(/s$/, "");
    return pathname === url || pathname.startsWith(base);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("groups.management")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuButton
            key={item.title}
            isActive={item.url ? isActive(item.url) : false}
            tooltip={item.title}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
                return;
              }
              if (item.url) {
                router.push(item.url);
              }
            }}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge != null && item.badge > 0 ? (
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            ) : null}
          </SidebarMenuButton>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
