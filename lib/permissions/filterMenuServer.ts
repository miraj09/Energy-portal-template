type MenuPermission = {
  section?: string;
  action?: string;
};

type MenuItem = {
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
    const sectionPermissions = permissions[section];
    if (!sectionPermissions) return false;
    return sectionPermissions.has(action);
  };

  const prune = (items: MenuItem[]): MenuItem[] =>
    items
      .filter((item) => hasPermission(item.permission_code))
      .map((item) => {
        if (!item.submenu) return item;
        const children = prune(item.submenu);
        if (children.length === 0) return null;
        return { ...item, submenu: children };
      })
      .filter((item): item is MenuItem => item !== null);

  return prune(menuItems);
}
