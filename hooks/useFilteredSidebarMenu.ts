"use client";

import { useMemo } from "react";
import usePermissionStore from "@/lib/permissions/permissionStore";
import { sidebarMenuConfig } from "@/lib/navigation/sidebarMenuConfig";
import { filterMenuForServer } from "@/lib/permissions/filterMenuServer";
import { toMenuNodes } from "@/lib/navigation/menuUtils";
import type { MenuNode } from "@/contexts/MenuContext";

/**
 * Sidebar menu filtered by the current user's permissions.
 * Returns [] while permissions are still loading so unauthorized items never flash.
 */
export function useFilteredSidebarMenu(): {
  menu: MenuNode[];
  isLoaded: boolean;
} {
  const permissions = usePermissionStore((state) => state.permissions);
  const isLoaded = usePermissionStore((state) => state.isLoaded);

  const menu = useMemo(() => {
    if (!isLoaded) return [];
    return toMenuNodes(filterMenuForServer(sidebarMenuConfig, permissions));
  }, [isLoaded, permissions]);

  return { menu, isLoaded };
}
