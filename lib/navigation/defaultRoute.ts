import { sidebarMenuConfig } from "@/lib/navigation/sidebarMenuConfig";
import { filterMenuForServer } from "@/lib/permissions/filterMenuServer";
import { getFirstMenuHref, toMenuNodes } from "@/lib/navigation/menuUtils";
import type { PermissionMap } from "@/lib/permissions/types";

/**
 * Returns the first route the user is allowed to access based on sidebar permissions.
 * Falls back to /dashboard when no permitted routes exist.
 */
export function getDefaultRouteForPermissions(permissions: PermissionMap): string {
  const filteredMenu = toMenuNodes(filterMenuForServer(sidebarMenuConfig, permissions));
  return getFirstMenuHref(filteredMenu) ?? "/unauthorized";
}
