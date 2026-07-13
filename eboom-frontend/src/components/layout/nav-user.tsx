"use client";

import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Mail,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploader from "@/src/views/profile/ImageUploader";
import { useCanvasInvitations } from "@/src/hooks/useCanvasInvitations";
import { useNotifications } from "@/src/hooks/useNotifications";
import { NotificationsPanel } from "@/src/components/layout/NotificationsPanel";
import { CanvasInvitationsPanel } from "@/src/components/layout/CanvasInvitationsPanel";
import { useAuthContext } from "../AuthProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useTextDirection } from "@/src/i18n/useTextDirection";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { signOut } = useAuthContext();
  const [imageModal, setImageModal] = useState(false);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { t } = useTranslation("navigation");
  const { pendingReceivedCount } = useCanvasInvitations();
  const { notifications, budgetAlerts, notificationCount, isLoading: isLoadingNotifications } =
    useNotifications();
  const { dropdownSide } = useTextDirection();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton size="lg" className="relative">
              <Bell className="size-4" />
              <span className="flex-1 text-start">{t("notifications.title")}</span>
              {notificationCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-3"
            side={isMobile ? "bottom" : dropdownSide}
            align="end"
            sideOffset={4}
          >
            <PopoverHeader className="mb-2 px-1">
              <PopoverTitle>{t("notifications.title")}</PopoverTitle>
            </PopoverHeader>
            <NotificationsPanel
              notifications={notifications}
              budgetAlerts={budgetAlerts}
              isLoading={isLoadingNotifications}
              onClose={() => setNotificationsOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <Popover open={invitationsOpen} onOpenChange={setInvitationsOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton size="lg" className="relative">
              <Mail className="size-4" />
              <span className="flex-1 text-start">{t("account.canvasInvitations")}</span>
              {pendingReceivedCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {pendingReceivedCount > 99 ? "99+" : pendingReceivedCount}
                </span>
              )}
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-96 p-3"
            side={isMobile ? "bottom" : dropdownSide}
            align="end"
            sideOffset={4}
          >
            <PopoverHeader className="mb-2 px-1">
              <PopoverTitle>{t("account.canvasInvitations")}</PopoverTitle>
            </PopoverHeader>
            <CanvasInvitationsPanel onClose={() => setInvitationsOpen(false)} />
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : dropdownSide}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar
                  className="h-8 w-8 rounded-lg"
                  onClick={() => {
                    setImageModal(true);
                  }}
                >
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{`${
                    user.name.split(" ")[0][0]
                  }${user.name.split(" ")[1][0]}`}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <LanguageSwitcher />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
            >
              <LogOut />
              {t("account.logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <ImageUploader
        open={imageModal}
        setOpen={setImageModal}
        existingImageUrl={user.avatar || null}
      />
    </SidebarMenu>
  );
}
