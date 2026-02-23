"use client";

import * as React from "react";
import { BanknoteArrowDown, BanknoteArrowUp, Wallet } from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
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
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, userLoading: isLoading } = useAuthContext();

  // return (
  //   <Sidebar collapsible="icon" {...props}>
  //     <SidebarHeader>
  //       <TeamSwitcher teams={data.teams} />
  //     </SidebarHeader>
  //     <SidebarContent>
  //       <NavMain items={data.navMain} />
  //       {/* <NavProjects projects={data.projects} /> */}
  //     </SidebarContent>
  //     <SidebarFooter>

  //      {isLoading ? <Skeleton className="h-10 w-full" /> : <NavUser
  //         user={{
  //           name: user?.firstName + " " + user?.lastName,
  //           email: user?.email || "",
  //           avatar: user?.photoUrl || "https://ui.shadcn.com/avatar.svg",
  //         }}
  //       />}
  //     </SidebarFooter>
  //     <SidebarRail />
  //   </Sidebar>
  // );
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <CanvasSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavMain items={data.navMain} />
          </SidebarMenuItem>
        </SidebarMenu>
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
