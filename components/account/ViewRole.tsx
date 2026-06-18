import type { RoleRecord } from "@/lib/types/role";

type ViewRoleProps = {
  role: RoleRecord;
};

export default function ViewRole({ role }: ViewRoleProps) {
  const permissions = role.permissions_details || role.role_permissions || [];

  return (
    <div className="account-light-surface space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[#48505E]">{role.name}</h3>
        <p className="text-sm text-gray-600">{role.description || "No description"}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {permissions.map((permission) => (
          <div key={permission.id} className="account-card rounded border p-3">
            <p className="font-medium text-card-foreground">{permission.name}</p>
            <p className="text-xs text-gray-600">{permission.code}</p>
          </div>
        ))}
        {permissions.length === 0 ? (
          <p className="text-sm text-gray-600">No permissions assigned.</p>
        ) : null}
      </div>
    </div>
  );
}
