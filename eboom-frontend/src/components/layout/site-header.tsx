import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import { useCanvas } from "@/src/hooks/useCanvas";

const ROUTE_LABELS: Record<string, { label: string; listUrl: string }> = {
  incomes: { label: "Incomes", listUrl: "/incomes" },
  income: { label: "Incomes", listUrl: "/incomes" },
  wallets: { label: "Wallets", listUrl: "/wallets" },
  wallet: { label: "Wallets", listUrl: "/wallets" },
  expenses: { label: "Expenses", listUrl: "/expenses" },
  expense: { label: "Expenses", listUrl: "/expenses" },
};

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

function buildBreadcrumbs(pathname: string, canvasName: string | null): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbSegment[] = [];

  // First crumb: canvas name
  if (segments.length === 0) {
    crumbs.push({ label: canvasName || "Dashboard" });
    return crumbs;
  }

  crumbs.push({ label: canvasName || "Dashboard", href: "/" });

  // Section crumb (incomes, wallets, expenses, income, wallet, expense)
  const section = segments[0];
  const route = ROUTE_LABELS[section];

  if (!route) {
    crumbs.push({ label: section });
    return crumbs;
  }

  if (segments.length === 1) {
    // List page — section is current page
    crumbs.push({ label: route.label });
  } else {
    // Detail page — section links to list, ID is current page
    crumbs.push({ label: route.label, href: route.listUrl });
    crumbs.push({ label: `#${segments[1]}` });
  }

  return crumbs;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { canvases, canvas } = useCanvas();
  const activeCanvas = canvases.find((c) => c.id === canvas);
  const crumbs = buildBreadcrumbs(pathname, activeCanvas?.name ?? null);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
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
    </header>
  )
}
