"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Fragment, useRef, useEffect } from "react";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useAppDispatch, useAppSelector } from "@/src/redux/store";
import {
  selectSearchQuery,
  selectSearchVisible,
  setSearchQuery,
  toggleSearch,
  hideSearch,
} from "@/src/redux/searchSlice";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const LIST_PAGES = ["/incomes", "/wallets", "/expenses"];

const ROUTE_KEYS: Record<string, { labelKey: string; listUrl: string }> = {
  incomes: { labelKey: "routes.incomes", listUrl: "/incomes" },
  income: { labelKey: "routes.incomes", listUrl: "/incomes" },
  wallets: { labelKey: "routes.wallets", listUrl: "/wallets" },
  wallet: { labelKey: "routes.wallets", listUrl: "/wallets" },
  expenses: { labelKey: "routes.expenses", listUrl: "/expenses" },
  expense: { labelKey: "routes.expenses", listUrl: "/expenses" },
  whiteboard: { labelKey: "routes.whiteboard", listUrl: "/whiteboard" },
  "budget-planning": { labelKey: "routes.budgetPlanning", listUrl: "/budget-planning" },
  transactions: { labelKey: "routes.transactions", listUrl: "/transactions" },
  "wish-list": { labelKey: "routes.wishList", listUrl: "/wish-list" },
  "ai-insights": { labelKey: "routes.aiInsights", listUrl: "/ai-insights" },
};

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

function buildBreadcrumbs(
  pathname: string,
  canvasName: string | null,
  dashboardLabel: string,
  t: (key: string) => string
): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbSegment[] = [];

  if (segments.length === 0) {
    crumbs.push({ label: canvasName || dashboardLabel });
    return crumbs;
  }

  crumbs.push({ label: canvasName || dashboardLabel, href: "/" });

  const section = segments[0];
  const route = ROUTE_KEYS[section];

  if (!route) {
    crumbs.push({ label: section });
    return crumbs;
  }

  const routeLabel = t(route.labelKey);

  if (segments.length === 1) {
    crumbs.push({ label: routeLabel });
  } else {
    crumbs.push({ label: routeLabel, href: route.listUrl });
    crumbs.push({ label: `#${segments[1]}` });
  }

  return crumbs;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { canvases, canvas } = useCanvas();
  const activeCanvas = canvases.find((c) => c.id === canvas);
  const { t } = useTranslation("navigation");
  const crumbs = buildBreadcrumbs(
    pathname,
    activeCanvas?.name ?? null,
    t("overview"),
    t
  );

  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const isSearchVisible = useAppSelector(selectSearchVisible);
  const inputRef = useRef<HTMLInputElement>(null);

  const isListPage = LIST_PAGES.includes(pathname);

  // Focus input when search becomes visible
  useEffect(() => {
    if (isSearchVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchVisible]);

  // Clear search when navigating away
  useEffect(() => {
    dispatch(hideSearch());
  }, [pathname, dispatch]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="me-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => (
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={i === 0 ? "hidden md:block" : ""}>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {isListPage && (
        <div className="flex items-center gap-2 px-4">
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isSearchVisible ? "w-64 opacity-100" : "w-0 opacity-0"
            )}
          >
            <Input
              ref={inputRef}
              placeholder={t("search.placeholder")}
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="h-8"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => dispatch(toggleSearch())}
          >
            {isSearchVisible ? (
              <X className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </header>
  );
}
