import { checkPermission } from "@/lib/permissions/checkPermission";

type MenuPermission = {
  section?: string;
  action?: string;
};

type MenuItem = {
  id?: string;
  label: string;
  href?: string;
  permission_code?: MenuPermission;
  submenu?: MenuItem[];
};

export function filterMenuForServer(
  menuItems: MenuItem[],
  permissions: Record<string, Set<string>> = {}
): MenuItem[] {
  const hasPermission = (permission?: MenuPermission) => {
    if (!permission) return true;
    const { section, action } = permission;
    if (!section || !action) return true;
    return checkPermission(permissions, section, action);
  };

  const prune = (items: MenuItem[]): MenuItem[] =>
    items
      .map((item) => {
        if (item.submenu?.length) {
          const children = prune(item.submenu);
          if (children.length === 0) return null;

          // Folder-style parents without their own route are shown when any child is allowed.
          if (!item.href) {
            return { ...item, submenu: children };
          }

          if (!hasPermission(item.permission_code)) return null;
          return { ...item, submenu: children };
        }

        if (!hasPermission(item.permission_code)) return null;
        return item;
      })
      .filter((item): item is MenuItem => item !== null);

  return prune(menuItems);
}
