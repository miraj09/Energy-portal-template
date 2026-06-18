"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateUser } from "@/lib/actions/updateUser";
import SubmitButton from "@/components/ui/SubmitButton";
import type { UserRecord } from "@/lib/types/user";
import { CustomMultiSelect, type SelectOption } from "@/ui/multiSelect";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
);

type EditUserProps = {
  user: UserRecord;
  rolesData: Array<{ id: number; name: string }>;
  onSave: () => void;
  onClose: () => void;
};

export default function EditUser({ user, rolesData, onSave, onClose }: EditUserProps) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [isActive, setIsActive] = useState(user.is_active);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<SelectOption[]>(
    (user.role_details || []).map((role) => ({ value: String(role.id), label: role.name }))
  );

  const roleOptions: SelectOption[] = rolesData.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await updateUser({
      slug: user.slug,
      name,
      email,
      phone,
      role: selectedRoles.map((role) => Number(role.value)),
      is_active: isActive,
      gender: user.gender,
      user_id: user.user_id,
      image_url: user.image_url,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "User updated successfully");
      onSave();
      onClose();
    } else {
      toast.error(result.message || "Failed to update user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="account-light-surface space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="edit-name">Name</Label>
          <Input id="edit-name" className="mt-1" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="edit-email">Email</Label>
          <Input id="edit-email" className="mt-1" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="edit-phone">Phone</Label>
          <Input id="edit-phone" className="mt-1" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="edit-status">Status</Label>
          <select
            id="edit-status"
            className={cn(selectClassName, "mt-1")}
            value={isActive ? "active" : "inactive"}
            onChange={(event) => setIsActive(event.target.value === "active")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Roles</Label>
        <CustomMultiSelect
          className="mt-1"
          options={roleOptions}
          value={selectedRoles}
          onChange={setSelectedRoles}
          placeholder="Select roles"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-900">
          Cancel
        </button>
        <SubmitButton isSubmitting={isSubmitting} defaultLabel="Update User" submittingLabel="Updating..." />
      </div>
    </form>
  );
}
