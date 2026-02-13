"use client";

import * as React from "react";
import { BanknoteArrowDown, BanknoteArrowUp, Wallet } from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "../AuthProvider";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Income",
      url: "/income",
      icon: BanknoteArrowUp,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: BanknoteArrowDown,
    },
    {
      title: "wallet",
      url: "/wallet",
      icon: Wallet,
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
