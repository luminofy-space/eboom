"use client";

import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useNavigationProgress } from "@/src/components/navigation/NavigationProgress";

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
  const pathname = usePathname();
  const { t } = useTranslation("navigation");
  const { navigate } = useNavigationProgress();

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
                navigate(item.url);
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
