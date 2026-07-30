import { sidebarMenuConfig, type SidebarMenuItem } from "@/lib/navigation/sidebarMenuConfig";

export type RoutePermission = {
  section: string;
  action: string;
};

type RoutePermissionEntry = RoutePermission & {
  pathPrefix: string;
};

function collectRouteEntries(items: SidebarMenuItem[]): RoutePermissionEntry[] {
  const entries: RoutePermissionEntry[] = [];

  const walk = (nodes: SidebarMenuItem[]) => {
    nodes.forEach((item) => {
      if (item.href) {
        entries.push({
          pathPrefix: item.href,
          section: item.permission_code.section,
          action: item.permission_code.action,
        });
      }
      if (item.submenu?.length) walk(item.submenu);
    });
  };

  walk(items);
  return entries.sort((a, b) => b.pathPrefix.length - a.pathPrefix.length);
}

const ROUTE_PERMISSION_ENTRIES = collectRouteEntries(sidebarMenuConfig);

/**
 * Resolve the permission required for a pathname using longest prefix match.
 * Nested routes inherit the permission of their parent section (e.g. /invoices/123 → view_invoices).
 */
export function resolveRoutePermission(pathname: string): RoutePermission | null {
  const normalizedPath = pathname.split("?")[0];

  for (const entry of ROUTE_PERMISSION_ENTRIES) {
    if (
      normalizedPath === entry.pathPrefix ||
      normalizedPath.startsWith(`${entry.pathPrefix}/`)
    ) {
      return {
        section: entry.section,
        action: entry.action,
      };
    }
  }

  return null;
}
