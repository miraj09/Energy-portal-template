"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import usePermissions from "@/hooks/usePermissions";
import { useMenu } from "@/contexts/MenuContext";
import { getFirstMenuHref } from "@/lib/navigation/menuUtils";
import { resolveRoutePermission } from "@/lib/navigation/routePermissions";
import { useFilteredSidebarMenu } from "@/hooks/useFilteredSidebarMenu";

type RoutePermissionGuardProps = {
  children: React.ReactNode;
};

/**
 * Blocks direct URL access to routes the user is not permitted to view.
 * Waits for permissions to load, then redirects unauthorized deep links.
 */
export default function RoutePermissionGuard({ children }: RoutePermissionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, isLoaded } = usePermissions();
  const contextMenu = useMenu();
  const { menu: filteredMenu } = useFilteredSidebarMenu();
  const menu = filteredMenu.length > 0 ? filteredMenu : contextMenu;

  useEffect(() => {
    if (!isLoaded) return;

    if (pathname === "/unauthorized") return;

    const requiredPermission = resolveRoutePermission(pathname);
    if (!requiredPermission) return;

    const isAllowed = hasPermission(requiredPermission.section, requiredPermission.action);
    if (isAllowed) return;

    const fallbackRoute = getFirstMenuHref(menu);
    router.replace(fallbackRoute ?? "/unauthorized");
  }, [pathname, isLoaded, hasPermission, menu, router]);

  return <>{children}</>;
}
