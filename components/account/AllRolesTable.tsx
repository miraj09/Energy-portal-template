"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TableHead from "@/components/ui/TableHead";
import TableActions from "@/components/ui/TableActions";
import ViewRoleModal from "@/components/account/ViewRoleModal";
import EditRoleModal from "@/components/account/EditRoleModal";
import PermissionGate from "@/components/auth/PermissionGate";
import { SIDEBAR_NAVIGATION_SECTION } from "@/lib/permissions/constants";
import { deleteRole } from "@/lib/actions/deleteRole";
import type { RoleRecord } from "@/lib/types/role";
import { toast } from "sonner";

type PermissionSection = {
  name: string;
  permissions: Array<{ id: number; name: string; code: string }>;
};

type AllRolesTableProps = {
  roles: RoleRecord[];
  tableTitle?: string;
  searchQuery?: string;
  permissionsData: PermissionSection[];
};

export default function AllRolesTable({
  roles = [],
  tableTitle = "All Roles",
  searchQuery = "",
  permissionsData = [],
}: AllRolesTableProps) {
  const [search, setSearch] = useState(searchQuery);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");
    params.delete("page");
    router.push(`/users/role-list?${params.toString()}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US");
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#383E49]">{tableTitle}</h2>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search roles..."
              className="h-9 rounded border border-gray-300 bg-white px-3 text-sm text-gray-900"
            />
            <button type="submit" className="rounded bg-primary px-3 text-sm text-primary-foreground">
              Search
            </button>
          </form>
          <PermissionGate section={SIDEBAR_NAVIGATION_SECTION} action="add_role">
            <button
              type="button"
              onClick={() => router.push("/users/add-new-role")}
              className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Add Role
            </button>
          </PermissionGate>
        </div>
      </div>
      <div className="account-card overflow-auto rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <TableHead heads={["Actions", "Role Name", "Description", "Created At", "Status"]} />
          <tbody className="divide-y divide-gray-100 text-center text-card-foreground">
            {roles.map((role) => (
              <tr key={role.id} className="border-b border-[#D9D9D9]">
                <td className="px-4 py-2">
                  <TableActions
                    item={role}
                    module="authentication"
                    actions={{
                      view: {
                        ViewComponent: (props) => <ViewRoleModal {...props} />,
                        title: "View Role",
                      },
                      edit: {
                        FormComponent: (props) => (
                          <EditRoleModal {...props} permissionsData={permissionsData} />
                        ),
                        title: "Edit Role",
                      },
                      delete: {
                        onDelete: async (item) => {
                          const result = await deleteRole((item as RoleRecord).id);
                          if (result.success) {
                            toast.success(result.message || "Role deleted");
                            router.refresh();
                          } else {
                            toast.error(result.message || "Failed to delete role");
                          }
                        },
                        title: "Delete Role",
                        description: `Are you sure you want to delete the role "${role.name}"?`,
                      },
                    }}
                  />
                </td>
                <td className="px-4 py-2 text-xs font-medium text-card-foreground">{role.name || "N/A"}</td>
                <td className="px-4 py-2 text-xs font-medium text-card-foreground">
                  {role.description || "No description"}
                </td>
                <td className="px-4 py-2 text-xs font-medium text-card-foreground">{formatDate(role.created_at)}</td>
                <td className="px-4 py-2 text-xs font-medium text-card-foreground">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      role.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {role.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
