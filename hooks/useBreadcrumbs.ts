import { usePathname, useSearchParams } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
  disabled?: boolean; // New property to indicate if the link should be disabled
}

// Path to label mappings for better user experience
const PATH_LABEL_MAPPINGS: Record<string, string> = {
  "generate-quote": "Generate Quote",
  "electricity-quote": "Electricity Quote",
  "gas-quote": "Gas Quote",
  "dashboard": "Dashboard",
  "submitted-sales": "Submitted Sales",
  "export-contract": "Export Contract",
  "reports": "Reports",
  "tickets": "Tickets",
  "docusign": "DocuSign",
  "tpi-document": "TPI Document",
  "invoices": "Invoices",
  "users": "Users",
  "user-list": "User List",
  "role-list": "Role List",
  "add-user": "Add User",
  "add-new-role": "Add New Role",
  "permission": "Permission",
  "all-application": "All Application",
  "announcements": "Announcements",
};

// Menu items that have sub-menus but no direct pages
const MENU_ITEMS_WITHOUT_PAGES: string[] = [
  "generate-quote", // Has sub-items: electricity-quote, gas-quote
];

export const useBreadcrumbs = (customBreadcrumbs?: BreadcrumbItem[]) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sold tariff pages carry the quoteId in the pathname instead of query params.
  // Capture it so we can keep the breadcrumb link functional.
  const deriveQuoteId = (segments: string[]): string | null => {
    const existing = searchParams?.get("quoteId");
    if (existing) return existing;

    const soldTariffIndex = segments.indexOf("sold-tariff");
    if (soldTariffIndex !== -1 && segments[soldTariffIndex + 1]) {
      return segments[soldTariffIndex + 1];
    }

    return null;
  };

  const generateBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    const preservedQuoteId = deriveQuoteId(segments);

    // Always add home as the first item
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
    });

    let currentPath = "";
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Use mapping if available, otherwise convert segment to readable label
      const label = PATH_LABEL_MAPPINGS[segment] || segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Check if this menu item has sub-menus but no direct page
      const isDisabled = MENU_ITEMS_WITHOUT_PAGES.includes(segment);

      const href =
        segment === "quote-list" && preservedQuoteId
          ? `${currentPath}?quoteId=${preservedQuoteId}`
          : currentPath;

      breadcrumbs.push({
        label,
        href,
        isCurrentPage: index === segments.length - 1,
        disabled: isDisabled,
      });
    });

    return breadcrumbs;
  };

  return customBreadcrumbs || generateBreadcrumbsFromPath();
}; 