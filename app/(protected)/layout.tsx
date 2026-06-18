import PermissionProvider from "@/components/auth/PermissionProvider";
import ProtectedLayoutShell from "@/app/(protected)/ProtectedLayoutShell";
import { MenuProvider } from "@/contexts/MenuContext";
import { filterMenuForServer } from "@/lib/permissions/filterMenuServer";
import { loadUserPermissions } from "@/lib/permissions/permissionUtils";
import { cookies } from "next/headers";

const usersMenuConfig = [
  {
    label: "Add Role",
    href: "/users/add-new-role",
    permission_code: { section: "authentication", action: "add_role" },
  },
  {
    label: "Role List",
    href: "/users/role-list",
    permission_code: { section: "authentication", action: "view_role_list" },
  },
  {
    label: "User List",
    href: "/users/user-list",
    permission_code: { section: "authentication", action: "view_user_list" },
  },
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  let permissions = {};
  let filteredUsersMenu: Array<{ label: string; href: string }> = [];

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token");

    if (accessToken?.value) {
      permissions = await loadUserPermissions();
      filteredUsersMenu = filterMenuForServer(usersMenuConfig, permissions).map((item) => ({
        label: item.label,
        href: item.href || "/users/user-list",
      }));
    }
  } catch {
    permissions = {};
    filteredUsersMenu = [];
  }

  return (
    <PermissionProvider initialPermissions={permissions}>
      <MenuProvider menu={filteredUsersMenu}>
        <ProtectedLayoutShell>{children}</ProtectedLayoutShell>
      </MenuProvider>
    </PermissionProvider>
  );
}


