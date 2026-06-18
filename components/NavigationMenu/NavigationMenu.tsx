"use client";

import React, { JSX, useMemo, useCallback } from "react";
import { ScrollArea } from "@/ui/scroll-area";
import {
  NavigationMenuItem,
  NavigationMenuItemProps,
} from "./components/NavigationMenuItem";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMenu } from "@/contexts/MenuContext";
import { branding } from "@/lib/config/branding";

// SVG icon imports
import DashboardIcon from '../Icons/DashboardIcon';
import GenerateQuoteIcon from '../Icons/GenerateQuoteIcon';
import SubmittedSalesIcon from '../Icons/SubmittedSalesIcon';
import ExportContractIcon from '../Icons/ExportContractIcon';
import ReportsIcon from '../Icons/ReportsIcon';
import TicketsIcon from '../Icons/TicketsIcon';
import DocuSignIcon from '../Icons/DocuSignIcon';
import TPIDocumentIcon from '../Icons/TPIDocumentIcon';
import InvoicesIcon from '../Icons/InvoicesIcon';
import UsersIcon from '../Icons/UsersIcon';
// import PermissionIcon from '../Icons/PermissionIcon';
import AllApplicationIcon from '../Icons/AllApplicationIcon';

export const NavigationMenu = (): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const { isSidebarCollapsed } = useSidebar();
  const { startRouteLoading } = useRouteLoading();
  const usersMenu = useMenu();
  /**
   * Navigate to a new route and trigger the global route loading state.
   *
   * Important detail:
   * - We **skip** starting the loading state (and calling `router.push`)
   *   when the target `href` is exactly the current `pathname`.
   *   Otherwise, the RouteLoadingContext effect (which only listens to
   *   `pathname` changes) never fires and the app appears to be stuck
   *   in a loading state for "self-navigation" clicks (e.g. clicking
   *   "Add Tickets" while already on `/tickets/add-ticket`).
   */
  const navigate = useCallback(
    (href: string) => {
      // Avoid redundant navigation and infinite loading when clicking
      // the currently active menu item.
      if (href === pathname) return;

      startRouteLoading();
      router.push(href);
    },
    [router, pathname, startRouteLoading]
  );
  
  // Memoize menu items to prevent unnecessary re-renders
  const menuItems: NavigationMenuItemProps[] = useMemo(() => [
    {
      icon: <DashboardIcon color={pathname === "/dashboard" ? "var(--primary)" : "#737373"} width={24} height={24} />,
      label: "Dashboard",
      active: pathname === "/dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: <GenerateQuoteIcon color={pathname.startsWith("/generate-quote") ? "var(--primary)" : "#737373"} width={28} height={28} />,
      label: "Generate Quote",
      active: pathname.startsWith("/generate-quote"),
      subItems: [
        {
          label: "Electricity Quote",
          active: pathname === "/generate-quote/electricity-quote",
          onClick: () => navigate("/generate-quote/electricity-quote"),
        },
        {
          label: "Gas Quote",
          active: pathname === "/generate-quote/gas-quote",
          onClick: () => navigate("/generate-quote/gas-quote"),
        },
      ],
    },
    {
      icon: <SubmittedSalesIcon color={pathname === "/submitted-sales" ? "var(--primary)" : "#737373"} width={24} height={24} />,
      label: "Submitted sales",
      active: pathname === "/submitted-sales",
      onClick: () => navigate("/submitted-sales"),
    },
    {
      icon: <ExportContractIcon color={pathname === "/export-contract" ? "var(--primary)" : "#737373"} width={22} height={22} />,
      label: "Export Contract",
      active: pathname === "/export-contract",
      onClick: () => navigate("/export-contract"),
    },
    {
      icon: <ReportsIcon color={pathname === "/reports" ? "var(--primary)" : "#737373"} width={20} height={20} />,
      label: "Reports",
      active: pathname === "/reports",
      onClick: () => navigate("/reports"),
    },
    {
      icon: <TicketsIcon color={pathname === "/tickets" ? "var(--primary)" : "#737373"} width={34} height={34} />,
      label: "Tickets",
      active: pathname.startsWith("/tickets"),
      subItems: [
        {
          label: "Add Tickets",
          // Route is `/tickets/add-ticket` (singular). The previous plural path
          // rendered an empty page because it does not exist.
          active: pathname === "/tickets/add-ticket",
          onClick: () => navigate("/tickets/add-ticket"),
        },
        {
          label: "Manage Tickets",
          active: pathname === "/tickets",
          onClick: () => navigate("/tickets"),
        },
      ],
    },
    {
      icon: <DocuSignIcon color={pathname === "/docusign" ? "var(--primary)" : "#737373"} width={22} height={23} />,
      label: "DocuSign",
      active: pathname === "/docusign",
      onClick: () => navigate("/docusign"),
    },
    {
      icon: <TPIDocumentIcon color={pathname === "/tpi-document" ? "var(--primary)" : "#737373"} width={24} height={25} />,
      label: "TPI Document",
      active: pathname === "/tpi-document",
      onClick: () => navigate("/tpi-document"),
    },
    {
      icon: <InvoicesIcon color={pathname === "/invoices" ? "var(--primary)" : "#737373"} width={22} height={23} />,
      label: "Invoices",
      active: pathname === "/invoices",
      onClick: () => navigate("/invoices"),
    },
   

    ...(usersMenu.length > 0
      ? [{
          icon: <UsersIcon color={pathname.startsWith("/users") ? "var(--primary)" : "#737373"} width={28} height={28} />,
          label: "Users",
          active: pathname.startsWith("/users"),
          subItems: usersMenu.map((item) => ({
            label: item.label,
            active: pathname === item.href,
            onClick: () => navigate(item.href || "/users/user-list"),
          })),
        }]
      : []),
    // {
    //   icon: <PermissionIcon color={pathname === "/permission" ? "var(--primary)" : "#737373"} width={24} height={25} />,
    //   label: "Permission",
    //   active: pathname === "/permission",
    //   onClick: () => router.push("/permission"),
    // },
    {
      icon: <AllApplicationIcon color={pathname === "/all-applications" ? "var(--primary)" : "#737373"} width={22} height={22} />,
      label: "All Application",
      active: pathname === "/all-applications",
      onClick: () => navigate("/all-applications"),
    },
  ], [pathname, navigate, usersMenu]);

  // Prefetch routes for faster navigation
  React.useEffect(() => {
    const routesToPrefetch = [
      "/dashboard",
      "/generate-quote/electricity-quote",
      "/generate-quote/gas-quote",
      "/submitted-sales",
      "/export-contract",
      "/reports",
      "/tickets",
      "/docusign",
      "/tpi-document",
      "/invoices",
      "/users/user-list",
      "/users/role-list",
      "/users/add-new-role",
      "/all-applications",
    ];
    // router.prefetch exists in next/link; for programmatic, some environments still expose it
    type PrefetchCapable = { prefetch?: (href: string) => void };
    const maybePrefetch = (router as unknown as PrefetchCapable).prefetch;
    if (maybePrefetch) {
      routesToPrefetch.forEach((r) => maybePrefetch(r));
    }
  }, [router]);

  return (
    <div className={`h-full py-0 flex flex-col transition-all duration-300 ease-in-out ${
      isSidebarCollapsed ? 'w-16' : 'w-48 xl:w-64'
    }`}>
      <div className={`flex justify-center py-4 ${isSidebarCollapsed ? 'px-2' : ''}`}>
        {isSidebarCollapsed ? (
          <Image
            width={32}
            height={32}
            className="w-8 h-8 object-cover"
            alt={branding.logoAlt}
            src={branding.logoSrc}
            priority
          />
        ) : (
          <Image
            width={139}
            height={52}
            className="w-[139px] h-[52px] object-cover"
            alt={branding.logoAlt}
            src={branding.logoSrc}
            priority
          />
        )}
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className={`py-2 ${isSidebarCollapsed ? 'px-2' : 'px-1 xl:px-4'}`}>
          {menuItems.map((item, index) => (
            <NavigationMenuItem
              key={`nav-item-${index}`}
              icon={item.icon}
              label={item.label}
              active={item.active}
              subItems={item.subItems}
              onClick={item.onClick}
              isCollapsed={isSidebarCollapsed}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
