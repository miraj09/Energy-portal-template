"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import SubmitButton from "@/components/ui/SubmitButton";
import { updateRole } from "@/lib/actions/updateRole";
import type { RoleRecord } from "@/lib/types/role";

type PermissionSection = {
  name: string;
  permissions: Array<{ id: number; name: string; code: string }>;
};

type EditRoleProps = {
  initialRole: RoleRecord;
  permissionsData: PermissionSection[];
  onSave?: (savedData: unknown) => void;
  onClose?: () => void;
};

export default function EditRole({ initialRole, permissionsData, onSave, onClose }: EditRoleProps) {
  const [roleName, setRoleName] = useState(initialRole.name || "");
  const [description, setDescription] = useState(initialRole.description || "");
  const [isActive, setIsActive] = useState(initialRole.is_active !== false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(permissionsData?.[0]?.name || "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(
    new Set((initialRole.permissions_details || initialRole.role_permissions || []).map((p) => p.id))
  );

  const hasChanges = useMemo(() => {
    const original = new Set((initialRole.permissions_details || initialRole.role_permissions || []).map((p) => p.id));
    if (roleName !== initialRole.name) return true;
    if (description !== (initialRole.description || "")) return true;
    if (isActive !== (initialRole.is_active !== false)) return true;
    if (original.size !== selectedPermissionIds.size) return true;
    return Array.from(selectedPermissionIds).some((id) => !original.has(id));
  }, [description, initialRole, isActive, roleName, selectedPermissionIds]);

  const currentCategoryPermissions =
    permissionsData.find((category) => category.name === selectedCategory)?.permissions || [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChanges) {
      toast.error("No changes detected");
      return;
    }
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (selectedPermissionIds.size === 0) {
      toast.error("At least one permission is required");
      return;
    }

    setIsSubmitting(true);
    const result = await updateRole(initialRole.id, {
      role: {
        name: roleName.trim(),
        description: description.trim(),
        is_active: isActive,
      },
      permissions: Array.from(selectedPermissionIds),
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "Role updated successfully");
      onSave?.(result.data);
      onClose?.();
    } else {
      toast.error(result.message || "Failed to update role");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="account-light-surface space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-[#48505E]">Role Name</label>
          <input
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            className="mt-1 h-9 w-full rounded border border-gray-300 bg-white px-3 text-gray-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#48505E]">Status</label>
          <select
            className="mt-1 h-9 w-full rounded border border-gray-300 bg-white px-3 text-gray-900"
            value={isActive ? "active" : "inactive"}
            onChange={(event) => setIsActive(event.target.value === "active")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[#48505E]">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 min-h-[90px] w-full rounded border border-gray-300 bg-white p-3 text-gray-900"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="account-card rounded border border-border">
          <div className="border-b bg-primary p-2 text-sm font-semibold text-primary-foreground">Category</div>
          <div className="p-2">
            {permissionsData.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => setSelectedCategory(category.name)}
                className={`mb-2 w-full rounded border border-gray-200 p-2 text-left text-sm ${
                  selectedCategory === category.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="account-card rounded border border-border">
          <div className="border-b bg-primary p-2 text-sm font-semibold text-primary-foreground">Actions</div>
          <div className="p-2">
            {currentCategoryPermissions.map((permission) => (
              <label
                key={permission.id}
                className="mb-2 flex items-center justify-between rounded border border-gray-200 p-2 text-sm text-card-foreground"
              >
                <span className="text-card-foreground">{permission.name}</span>
                <input
                  type="checkbox"
                  checked={selectedPermissionIds.has(permission.id)}
                  onChange={() =>
                    setSelectedPermissionIds((prev) => {
                      const updated = new Set(prev);
                      if (updated.has(permission.id)) updated.delete(permission.id);
                      else updated.add(permission.id);
                      return updated;
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
        >
          Cancel
        </button>
        <SubmitButton isSubmitting={isSubmitting} defaultLabel="Update Role" submittingLabel="Updating..." />
      </div>
    </form>
  );
}
