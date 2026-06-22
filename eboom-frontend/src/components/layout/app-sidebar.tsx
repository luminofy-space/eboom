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
} from "lucide-react";

import { NavMain } from "./nav-main";
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

  const navMain = [
    {
      title: t("dashboard"),
      url: "/",
      icon: LayoutDashboard,
    },
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
  ];

  const data = {
    navUpcoming: [
      {
        title: t("routes.budgetPlanning"),
        url: "/budget-planning",
        icon: PiggyBank,
        badge: t("badges.soon"),
      },
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
        <NavMain items={navMain} />
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
