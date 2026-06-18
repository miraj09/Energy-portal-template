"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SubmitButton from "@/components/ui/SubmitButton";
import { createRole } from "@/lib/actions/createRole";

type PermissionSection = {
  name: string;
  permissions: Array<{ id: number; name: string; code: string }>;
};

type AddRoleProps = {
  permissionsData: PermissionSection[];
};

export default function AddRole({ permissionsData }: AddRoleProps) {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set<number>());

  useEffect(() => {
    if (permissionsData.length > 0) {
      setSelectedCategory(permissionsData[0].name);
    }
  }, [permissionsData]);

  const selectedCategoryData = permissionsData.find((category) => category.name === selectedCategory);
  const currentCategoryPermissions = selectedCategoryData?.permissions || [];

  const isAllCategorySelected =
    currentCategoryPermissions.length > 0 &&
    currentCategoryPermissions.every((permission) => selectedPermissionIds.has(permission.id));

  function handlePermissionToggle(permissionId: number) {
    setSelectedPermissionIds((previous) => {
      const updated = new Set(previous);
      if (updated.has(permissionId)) updated.delete(permissionId);
      else updated.add(permissionId);
      return updated;
    });
  }

  function handleSelectAllCategory(categoryName: string) {
    const categoryPermissions =
      permissionsData.find((category) => category.name === categoryName)?.permissions || [];

    setSelectedPermissionIds((previous) => {
      const updated = new Set(previous);
      const allSelected = categoryPermissions.every((permission) => updated.has(permission.id));

      categoryPermissions.forEach((permission) => {
        if (allSelected) updated.delete(permission.id);
        else updated.add(permission.id);
      });

      return updated;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (selectedPermissionIds.size === 0) {
      toast.error("At least one permission is required");
      return;
    }

    setIsSubmitting(true);
    const result = await createRole({
      role: {
        name: roleName.trim(),
        description: description.trim(),
        is_active: isActive,
      },
      permissions: Array.from(selectedPermissionIds),
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "Role created successfully");
      router.push("/users/role-list");
      router.refresh();
      return;
    }

    toast.error(result.message || "Failed to create role");
  }

  return (
    <div className="account-light-surface mx-auto max-w-6xl space-y-3 px-8 py-5">
      <h2 className="text-2xl font-semibold text-[#48505E]">Add Role</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="col-span-3">
              <label className="block text-base font-medium text-[#48505E]">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder="Type Role"
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-base font-medium text-[#48505E]">Status</label>
              <div className="mt-1 flex items-center space-x-3">
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    checked={isActive === true}
                    onChange={() => setIsActive(true)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex cursor-pointer items-center space-x-2">
                  <input
                    type="radio"
                    checked={isActive === false}
                    onChange={() => setIsActive(false)}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Inactive</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">Active roles can be assigned to users</p>
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-[#48505E]">
              Description <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Type Description"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="account-card rounded-md border border-border shadow-sm">
            <div className="rounded-t-md bg-primary px-4 py-2 font-medium text-primary-foreground">
              Category
            </div>
            <div className="w-full divide-y px-4 py-2 text-left">
              {permissionsData.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setSelectedCategory(category.name)}
                  className={`mb-2 w-full rounded-md border border-gray-200 px-4 py-2 text-left text-sm hover:bg-primary/20 ${
                    category.name === selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="account-card rounded-md border border-border shadow-sm lg:col-span-2">
            <div className="flex justify-between rounded-t-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground lg:px-8">
              <div>Action</div>
              <div>Permission</div>
            </div>
            <div className="divide-y text-sm text-card-foreground">
              {selectedCategory && selectedCategoryData ? (
                <>
                  <div className="flex items-center justify-between px-5 py-2 lg:px-8">
                    <span className="text-card-foreground">All Permission</span>
                    <input
                      type="checkbox"
                      checked={isAllCategorySelected}
                      onChange={() => handleSelectAllCategory(selectedCategory)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>

                  {currentCategoryPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between px-5 py-2 lg:px-8"
                    >
                      <span className="text-card-foreground">{permission.name}</span>
                      <input
                        type="checkbox"
                        checked={selectedPermissionIds.has(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="px-5 py-2 text-sm text-gray-500 lg:px-8">
                  {selectedCategory
                    ? `No permissions available for ${selectedCategory}`
                    : "Select a category"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <SubmitButton
            isSubmitting={isSubmitting}
            defaultLabel="Add Role"
            submittingLabel="Creating Role..."
          />
        </div>
      </form>
    </div>
  );
}
