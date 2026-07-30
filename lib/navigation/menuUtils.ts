import type { MenuNode } from "@/contexts/MenuContext";

type FilteredMenuItem = {
  id?: string;
  label: string;
  href?: string;
  submenu?: FilteredMenuItem[];
};

/** Convert server-filtered menu config into MenuContext nodes. */
export function toMenuNodes(items: FilteredMenuItem[]): MenuNode[] {
  return items.map((item) => ({
    id: item.id ?? item.label,
    label: item.label,
    href: item.href,
    subItems: item.submenu?.length ? toMenuNodes(item.submenu) : undefined,
  }));
}

/** Collect all navigable hrefs from a menu tree (for prefetching). */
export function collectMenuHrefs(items: MenuNode[]): string[] {
  const hrefs: string[] = [];

  const walk = (nodes: MenuNode[]) => {
    nodes.forEach((node) => {
      if (node.href) hrefs.push(node.href);
      if (node.subItems?.length) walk(node.subItems);
    });
  };

  walk(items);
  return hrefs;
}

/** First navigable href in menu order — used for post-login / unauthorized fallbacks. */
export function getFirstMenuHref(items: MenuNode[]): string | null {
  for (const item of items) {
    if (item.href) return item.href;
    if (item.subItems?.length) {
      const childHref = getFirstMenuHref(item.subItems);
      if (childHref) return childHref;
    }
  }
  return null;
}
