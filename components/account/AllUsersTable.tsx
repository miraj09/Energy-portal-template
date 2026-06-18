"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import TableHead from "@/components/ui/TableHead";
import TableActions from "@/components/ui/TableActions";
import ViewUserModal from "@/components/account/ViewUserModal";
import EditUserModal from "@/components/account/EditUserModal";
import { deleteUser } from "@/lib/actions/deleteUser";
import type { UserRecord } from "@/lib/types/user";
import { Input } from "@/ui/input";

type AllUsersTableProps = {
  users: UserRecord[];
  tableTitle?: string;
  searchQuery?: string;
  rolesData: Array<{ id: number; name: string }>;
};

export default function AllUsersTable({
  users = [],
  tableTitle = "All Users",
  searchQuery = "",
  rolesData = [],
}: AllUsersTableProps) {
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
    router.push(`/users/user-list?${params.toString()}`);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#383E49]">{tableTitle}</h2>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="h-9"
            />
            <button type="submit" className="rounded bg-primary px-3 text-sm text-primary-foreground">
              Search
            </button>
          </form>
          <button
            onClick={() => router.push("/users/add-user")}
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
          >
            Add User
          </button>
        </div>
      </div>

      <div className="account-card overflow-auto rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <TableHead heads={["Actions", "User ID", "Name", "Email", "Phone", "Roles", "Status"]} />
          <tbody className="divide-y divide-gray-100 text-center text-card-foreground">
            {users.map((user) => (
              <tr key={String(user.id)} className="border-b border-[#D9D9D9]">
                <td className="px-4 py-2">
                  <TableActions
                    item={user}
                    module="authentication"
                    actions={{
                      view: { ViewComponent: (props) => <ViewUserModal {...props} /> },
                      edit: {
                        FormComponent: (props) => (
                          <EditUserModal
                            {...props}
                            rolesData={rolesData}
                            onSave={() => router.refresh()}
                          />
                        ),
                      },
                      delete: {
                        onDelete: async (item) => {
                          const result = await deleteUser((item as UserRecord).slug);
                          if (result.success) {
                            toast.success(result.message || "User deleted");
                            router.refresh();
                          } else {
                            toast.error(result.message || "Failed to delete user");
                          }
                        },
                        title: "Delete User",
                        description: `Are you sure you want to delete "${user.name}"?`,
                      },
                    }}
                  />
                </td>
                <td className="px-4 py-2 text-xs text-card-foreground">{user.user_id || user.id}</td>
                <td className="px-4 py-2 text-xs text-card-foreground">{user.name}</td>
                <td className="px-4 py-2 text-xs text-card-foreground">{user.email}</td>
                <td className="px-4 py-2 text-xs text-card-foreground">{user.phone || "N/A"}</td>
                <td className="px-4 py-2 text-xs text-card-foreground">
                  {(user.role_details || []).map((role) => role.name).join(", ") || "N/A"}
                </td>
                <td className="px-4 py-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
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
