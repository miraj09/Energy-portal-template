import { SIDEBAR_NAVIGATION_SECTION } from "@/lib/permissions/constants";

export type SidebarMenuItem = {
  id: string;
  label: string;
  href?: string;
  permission_code: { section: string; action: string };
  submenu?: SidebarMenuItem[];
};

const sidebarPermission = (action: string) => ({
  section: SIDEBAR_NAVIGATION_SECTION,
  action,
});

/**
 * Single source of truth for sidebar structure and permission codes.
 * Nested routes (e.g. /invoices/[id]) inherit the permission of the longest matching href prefix.
 */
export const sidebarMenuConfig: SidebarMenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    permission_code: sidebarPermission("view_dashboard"),
  },
  {
    id: "generate-quote",
    label: "Generate Quote",
    permission_code: sidebarPermission("view_generate_quote"),
    submenu: [
      {
        id: "electricity-quote",
        label: "Electricity Quote",
        href: "/generate-quote/electricity-quote",
        permission_code: sidebarPermission("view_electricity_quote"),
      },
      {
        id: "gas-quote",
        label: "Gas Quote",
        href: "/generate-quote/gas-quote",
        permission_code: sidebarPermission("view_gas_quote"),
      },
    ],
  },
  {
    id: "submitted-sales",
    label: "Submitted sales",
    href: "/submitted-sales",
    permission_code: sidebarPermission("view_submitted_sales"),
  },
  {
    id: "export-contract",
    label: "Export Contract",
    href: "/export-contract",
    permission_code: sidebarPermission("view_export_contract"),
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    permission_code: sidebarPermission("view_reports"),
  },
  {
    id: "tickets",
    label: "Tickets",
    permission_code: sidebarPermission("view_tickets"),
    submenu: [
      {
        id: "add-tickets",
        label: "Add Tickets",
        href: "/tickets/add-ticket",
        permission_code: sidebarPermission("add_tickets"),
      },
      {
        id: "manage-tickets",
        label: "Manage Tickets",
        href: "/tickets",
        permission_code: sidebarPermission("manage_tickets"),
      },
    ],
  },
  {
    id: "docusign",
    label: "DocuSign",
    href: "/docusign",
    permission_code: sidebarPermission("view_docusign"),
  },
  {
    id: "tpi-document",
    label: "TPI Document",
    href: "/tpi-document",
    permission_code: sidebarPermission("view_tpi_document"),
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/invoices",
    permission_code: sidebarPermission("view_invoices"),
  },
  {
    id: "users",
    label: "Users",
    permission_code: sidebarPermission("view_users"),
    submenu: [
      {
        id: "add-role",
        label: "Add Role",
        href: "/users/add-new-role",
        permission_code: sidebarPermission("add_role"),
      },
      {
        id: "role-list",
        label: "Role List",
        href: "/users/role-list",
        permission_code: sidebarPermission("view_role_list"),
      },
      {
        id: "user-list",
        label: "User List",
        href: "/users/user-list",
        permission_code: sidebarPermission("view_user_list"),
      },
    ],
  },
  {
    id: "all-applications",
    label: "All Application",
    href: "/all-applications",
    permission_code: sidebarPermission("view_all_application"),
  },
];
