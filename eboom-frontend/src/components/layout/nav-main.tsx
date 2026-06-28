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
import { useNavigationProgress } from "@/src/components/navigation/NavigationProgress";

export type NavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
  badge?: number;
  onClick?: () => void;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function NavGroups({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const { navigate } = useNavigationProgress();

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    const base = url.replace(/s$/, "");
    return pathname === url || pathname.startsWith(base);
  };

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
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
      ))}
    </>
  );
}

/** @deprecated Use NavGroups instead */
export function NavMain({ items }: { items: NavItem[] }) {
  return <NavGroups groups={[{ label: "", items }]} />;
}
