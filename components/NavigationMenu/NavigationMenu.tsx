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
import { collectMenuHrefs } from "@/lib/navigation/menuUtils";
import { useFilteredSidebarMenu } from "@/hooks/useFilteredSidebarMenu";
import type { MenuNode } from "@/contexts/MenuContext";
import { branding } from "@/lib/config/branding";

import DashboardIcon from "../Icons/DashboardIcon";
import GenerateQuoteIcon from "../Icons/GenerateQuoteIcon";
import SubmittedSalesIcon from "../Icons/SubmittedSalesIcon";
import ExportContractIcon from "../Icons/ExportContractIcon";
import ReportsIcon from "../Icons/ReportsIcon";
import TicketsIcon from "../Icons/TicketsIcon";
import DocuSignIcon from "../Icons/DocuSignIcon";
import TPIDocumentIcon from "../Icons/TPIDocumentIcon";
import InvoicesIcon from "../Icons/InvoicesIcon";
import UsersIcon from "../Icons/UsersIcon";
import AllApplicationIcon from "../Icons/AllApplicationIcon";

const ACTIVE_COLOR = "var(--primary)";
const INACTIVE_COLOR = "#737373";

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMenuNodeActive(pathname: string, node: MenuNode): boolean {
  if (node.href && isPathActive(pathname, node.href)) return true;
  return node.subItems?.some((child) => isMenuNodeActive(pathname, child)) ?? false;
}

function renderIcon(id: string, active: boolean): React.ReactNode {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;

  switch (id) {
    case "dashboard":
      return <DashboardIcon color={color} width={24} height={24} />;
    case "generate-quote":
      return <GenerateQuoteIcon color={color} width={28} height={28} />;
    case "submitted-sales":
      return <SubmittedSalesIcon color={color} width={24} height={24} />;
    case "export-contract":
      return <ExportContractIcon color={color} width={22} height={22} />;
    case "reports":
      return <ReportsIcon color={color} width={20} height={20} />;
    case "tickets":
      return <TicketsIcon color={color} width={34} height={34} />;
    case "docusign":
      return <DocuSignIcon color={color} width={22} height={23} />;
    case "tpi-document":
      return <TPIDocumentIcon color={color} width={24} height={25} />;
    case "invoices":
      return <InvoicesIcon color={color} width={22} height={23} />;
    case "users":
      return <UsersIcon color={color} width={28} height={28} />;
    case "all-applications":
      return <AllApplicationIcon color={color} width={22} height={22} />;
    default:
      return null;
  }
}

function mapMenuNodeToItem(
  node: MenuNode,
  pathname: string,
  navigate: (href: string) => void
): NavigationMenuItemProps {
  const active = isMenuNodeActive(pathname, node);
  const subItems = node.subItems?.map((child) => ({
    label: child.label,
    active: child.href ? pathname === child.href : false,
    onClick: child.href ? () => navigate(child.href!) : undefined,
  }));

  return {
    icon: renderIcon(node.id, active),
    label: node.label,
    active,
    subItems,
    onClick: node.href ? () => navigate(node.href!) : undefined,
  };
}

export const NavigationMenu = (): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const { isSidebarCollapsed } = useSidebar();
  const { startRouteLoading } = useRouteLoading();
  const { menu, isLoaded: isMenuLoaded } = useFilteredSidebarMenu();

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;
      startRouteLoading();
      router.push(href);
    },
    [router, pathname, startRouteLoading]
  );

  const menuItems = useMemo(
    () => menu.map((item) => mapMenuNodeToItem(item, pathname, navigate)),
    [menu, pathname, navigate]
  );

  React.useEffect(() => {
    const routesToPrefetch = collectMenuHrefs(menu);
    type PrefetchCapable = { prefetch?: (href: string) => void };
    const maybePrefetch = (router as unknown as PrefetchCapable).prefetch;
    if (maybePrefetch) {
      routesToPrefetch.forEach((route) => maybePrefetch(route));
    }
  }, [router, menu]);

  return (
    <div
      className={`h-full py-0 flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-16" : "w-48 xl:w-64"
      }`}
    >
      <div className={`flex justify-center py-4 ${isSidebarCollapsed ? "px-2" : ""}`}>
        {isSidebarCollapsed ? (
          <Image
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            alt={branding.logoAlt}
            src={branding.logoSrc}
            priority
            unoptimized
          />
        ) : (
          <Image
            width={139}
            height={52}
            className="w-[139px] h-[52px] object-contain"
            alt={branding.logoAlt}
            src={branding.logoSrc}
            priority
            unoptimized
          />
        )}
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className={`py-2 ${isSidebarCollapsed ? "px-2" : "px-1 xl:px-4"}`}>
          {!isMenuLoaded ? (
            <div className="px-3 py-4 text-xs text-gray-400">Loading menu...</div>
          ) : (
            menuItems.map((item, index) => (
              <NavigationMenuItem
                key={`nav-item-${menu[index]?.id ?? index}`}
                icon={item.icon}
                label={item.label}
                active={item.active}
                subItems={item.subItems}
                onClick={item.onClick}
                isCollapsed={isSidebarCollapsed}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
