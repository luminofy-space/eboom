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
  Calendar,
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

const data = {
  navMain: [
    {
      title: "Incomes",
      url: "/incomes",
      icon: BanknoteArrowUp,
    },
    {
      title: "Wallets",
      url: "/wallets",
      icon: Wallet,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: BanknoteArrowDown,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
    },
  ],
  navUpcoming: [
    {
      title: "Whiteboard",
      url: "/whiteboard",
      icon: Presentation,
      badge: "Soon",
    },
    {
      title: "Budget & Planning",
      url: "/budget-planning",
      icon: PiggyBank,
      badge: "Soon",
    },
    {
      title: "Wish List",
      url: "/wish-list",
      icon: ShoppingBag,
      badge: "Soon",
    },
    {
      title: "AI Insights",
      url: "/ai-insights",
      icon: BrainCircuit,
      badge: "Soon",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, userLoading: isLoading } = useAuthContext();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <CanvasSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
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
