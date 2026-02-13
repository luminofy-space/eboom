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
import API_ROUTES from "@/src/api/urls";
import useQueryApi from "@/src/api/useQuery";
import { Skeleton } from "@/components/ui/skeleton";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData, isLoading } = useQueryApi<any>(
    API_ROUTES.USERS_GET_ME,
    {
      queryKey: ["user"],
      hasToken: true,
    }
  );

  const user = userData?.user?.userMetadata;

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
