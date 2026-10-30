"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import TableHead from "@/components/ui/TableHead";
import TableActions from "@/components/ui/TableActions";
import ViewUserModal from "@/components/account/ViewUserModal";
import EditUserModal from "@/components/account/EditUserModal";
import { deleteUser } from "@/lib/actions/deleteUser";
import type { ParentAgentOption, UserRecord } from "@/lib/types/user";
import { Input } from "@/ui/input";
import { isSubAgentUser } from "@/lib/user/mapLoginUserData";

const USER_STORAGE_KEY = "energy_user_Data";

type AllUsersTableProps = {
  users: UserRecord[];
  tableTitle?: string;
  searchQuery?: string;
  rolesData: Array<{ id: number; name: string }>;
  parentAgentOptions?: ParentAgentOption[];
};

function readCurrentUserFromStorage(): UserRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserRecord;
  } catch {
    return null;
  }
}

export default function AllUsersTable({
  users = [],
  tableTitle = "All Users",
  searchQuery = "",
  rolesData = [],
  parentAgentOptions = [],
}: AllUsersTableProps) {
  const [search, setSearch] = useState(searchQuery);
  // Hidden until role is known so Sub-agents never see a flash of Add User.
  const [canAddUser, setCanAddUser] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setCanAddUser(!isSubAgentUser(readCurrentUserFromStorage()));
  }, []);

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
          {canAddUser ? (
            <button
              onClick={() => router.push("/users/add-user")}
              className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Add User
            </button>
          ) : null}
        </div>
      </div>

      <div className="account-card overflow-auto rounded-md">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <TableHead
            heads={["Actions", "User ID", "Name", "Email", "Phone", "Roles", "Reports To", "Status"]}
          />
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
                            parentAgentOptions={parentAgentOptions}
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
                <td className="px-4 py-2 text-xs text-card-foreground">
                  {user.parent_agent_details?.name || "N/A"}
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
