"use client";

import * as React from "react";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  Wallet,
  Presentation,
  PiggyBank,
  ShoppingBag,
  BrainCircuit,
  Users,
  LayoutDashboard,
  CalendarDays,
  Landmark,
} from "lucide-react";

import { NavGroups } from "./nav-main";
import { NavUpcoming } from "./nav-upcoming";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { CanvasSwitcher } from "../canvas/CanvasSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "../AuthProvider";
import { useTranslation } from "react-i18next";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, userLoading: isLoading } = useAuthContext();
  const { t } = useTranslation("navigation");
  const { canManageMembers } = useCanvasPermissions();

  const navGroups = [
    {
      label: t("groups.overview"),
      items: [
        {
          title: t("overview"),
          url: "/",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: t("groups.finances"),
      items: [
        {
          title: t("routes.incomes"),
          url: "/incomes",
          icon: BanknoteArrowUp,
        },
        {
          title: t("routes.wallets"),
          url: "/wallets",
          icon: Wallet,
        },
        {
          title: t("routes.expenses"),
          url: "/expenses",
          icon: BanknoteArrowDown,
        },
        {
          title: t("routes.assets"),
          url: "/assets",
          icon: Landmark,
        },
      ],
    },
    {
      label: t("groups.planning"),
      items: [
        {
          title: t("routes.calendar"),
          url: "/calendar",
          icon: CalendarDays,
        },
        {
          title: t("routes.budgetPlanning"),
          url: "/budget-planning",
          icon: PiggyBank,
        },
        {
          title: t("routes.whiteboard"),
          url: "/whiteboard",
          icon: Presentation,
        },
        ...(canManageMembers
          ? [
              {
                title: t("routes.manageMembers"),
                url: "/members",
                icon: Users,
              },
            ]
          : []),
      ],
    },
  ];

  const data = {
    navUpcoming: [
      {
        title: t("routes.wishList"),
        url: "/wish-list",
        icon: ShoppingBag,
        badge: t("badges.soon"),
      },
      {
        title: t("routes.aiInsights"),
        url: "/ai-insights",
        icon: BrainCircuit,
        badge: t("badges.soon"),
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <CanvasSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavGroups groups={navGroups} />
        <SidebarSeparator />
        <NavUpcoming items={data.navUpcoming} />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <NavUser
            user={{
              name: user?.firstName + " " + user?.lastName,
              email: user?.email || "",
              avatar: user?.photoUrl || "https://ui.shadcn.com/avatar.svg",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
