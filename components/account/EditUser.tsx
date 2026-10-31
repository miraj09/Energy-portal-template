"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateUser } from "@/lib/actions/updateUser";
import SubmitButton from "@/components/ui/SubmitButton";
import type { ParentAgentOption, UserRecord } from "@/lib/types/user";
import { CustomMultiSelect, type SelectOption } from "@/ui/multiSelect";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import ParentAgentSelect from "@/components/account/ParentAgentSelect";
import { getFieldError } from "@/lib/utils/fieldErrors";
import { cn } from "@/lib/utils";
import {
  getUkPhoneFormatError,
  UK_PHONE_PLACEHOLDER,
} from "@/lib/validation/ukPhone";

const selectClassName = cn(
  "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
);

type EditUserProps = {
  user: UserRecord;
  rolesData: Array<{ id: number; name: string }>;
  parentAgentOptions?: ParentAgentOption[];
  onSave: () => void;
  onClose: () => void;
};

/** The link as the API currently has it — `null` when the user is top-level. */
function readParentAgentId(user: UserRecord): number | null {
  const raw = user.parent_agent ?? user.parent_agent_details?.id ?? null;
  return raw == null ? null : Number(raw);
}

export default function EditUser({
  user,
  rolesData,
  parentAgentOptions = [],
  onSave,
  onClose,
}: EditUserProps) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [isActive, setIsActive] = useState(user.is_active);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<SelectOption[]>(
    (user.role_details || []).map((role) => ({ value: String(role.id), label: role.name }))
  );
  const initialParentAgent = readParentAgentId(user);
  const [parentAgent, setParentAgent] = useState<number | null>(initialParentAgent);
  const [parentAgentError, setParentAgentError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const roleOptions: SelectOption[] = rolesData.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const phoneFormatError = getUkPhoneFormatError(phone);
    if (phoneFormatError) {
      setPhoneError(phoneFormatError);
      toast.error(phoneFormatError);
      return;
    }
    setPhoneError(undefined);
    setIsSubmitting(true);
    setParentAgentError(undefined);
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
      // Only sent when it actually changed — omitting the key leaves the link
      // untouched, so an unrelated edit can never detach a sub-agent.
      ...(parentAgent !== initialParentAgent ? { parent_agent: parentAgent } : {}),
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "User updated successfully");
      onSave();
      onClose();
    } else {
      setParentAgentError(getFieldError(result.errors, "parent_agent"));
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
          <Input
            id="edit-phone"
            type="tel"
            inputMode="tel"
            placeholder={UK_PHONE_PLACEHOLDER}
            className="mt-1"
            value={phone}
            onChange={(event) => {
              const nextPhone = event.target.value;
              setPhone(nextPhone);
              setPhoneError((currentError) =>
                currentError
                  ? getUkPhoneFormatError(nextPhone) ?? undefined
                  : currentError
              );
            }}
            onBlur={(event) =>
              setPhoneError(getUkPhoneFormatError(event.target.value) ?? undefined)
            }
            aria-invalid={phoneError ? true : undefined}
          />
          {phoneError ? (
            <p className="mt-1 text-xs text-red-600">{phoneError}</p>
          ) : null}
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
      <ParentAgentSelect
        id="edit-parent-agent"
        options={parentAgentOptions}
        value={parentAgent}
        onChange={setParentAgent}
        excludeUserId={user.id}
        error={parentAgentError}
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-900">
          Cancel
        </button>
        <SubmitButton isSubmitting={isSubmitting} defaultLabel="Update User" submittingLabel="Updating..." />
      </div>
    </form>
  );
}
