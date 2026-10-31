"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUser } from "@/lib/actions/createUser";
import SubmitButton from "@/components/ui/SubmitButton";
import { uploadImageAction } from "@/lib/actions/uploadImage";
import { CustomMultiSelect, type SelectOption } from "@/ui/multiSelect";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import ParentAgentSelect from "@/components/account/ParentAgentSelect";
import { getFieldError } from "@/lib/utils/fieldErrors";
import type { ParentAgentOption, UserRecord } from "@/lib/types/user";
import { isSubAgentUser, userHasAnyRole } from "@/lib/user/mapLoginUserData";
import { AGENT_ROLE_NAMES } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import {
  getUkPhoneFormatError,
  UK_PHONE_PLACEHOLDER,
} from "@/lib/validation/ukPhone";

const USER_STORAGE_KEY = "energy_user_Data";

const selectClassName = cn(
  "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
);

type RoleOption = { id: number; name: string };

type AddUserProps = {
  rolesData: RoleOption[];
  parentAgentOptions?: ParentAgentOption[];
  /** Resolved from role-list?search=sub-agent on the server. */
  subAgentRole?: RoleOption | null;
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

function resolveCurrentUserId(user: UserRecord | null): number | null {
  if (user?.id == null) return null;
  const parsed = Number(user.id);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AddUser({
  rolesData,
  parentAgentOptions = [],
  subAgentRole = null,
}: AddUserProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<SelectOption[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [parentAgent, setParentAgent] = useState<number | null>(null);
  const [parentAgentError, setParentAgentError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: 0,
  });

  useEffect(() => {
    setCurrentUser(readCurrentUserFromStorage());
  }, []);

  const isCurrentUserSubAgent = isSubAgentUser(currentUser);
  const isCurrentUserAgent = userHasAnyRole(currentUser, AGENT_ROLE_NAMES);
  const currentUserId = resolveCurrentUserId(currentUser);

  // Sub-agents cannot create users — send them back to the list.
  useEffect(() => {
    if (!currentUser || !isCurrentUserSubAgent) return;
    toast.error("Sub-agents are not allowed to create users.");
    router.replace("/users/user-list");
  }, [currentUser, isCurrentUserSubAgent, router]);

  const subAgentRoleOption: SelectOption | null = useMemo(() => {
    if (!subAgentRole) return null;
    return { value: String(subAgentRole.id), label: subAgentRole.name };
  }, [subAgentRole]);

  // Agents may only assign the Sub-agent role under themselves.
  const roleOptions: SelectOption[] = useMemo(() => {
    if (isCurrentUserAgent) {
      return subAgentRoleOption ? [subAgentRoleOption] : [];
    }
    return rolesData.map((role) => ({
      value: String(role.id),
      label: role.name,
    }));
  }, [isCurrentUserAgent, subAgentRoleOption, rolesData]);

  // Lock role + parent when the logged-in user is an Agent.
  useEffect(() => {
    if (!isCurrentUserAgent) return;

    if (subAgentRoleOption) {
      setSelectedRoles([subAgentRoleOption]);
    }

    if (currentUserId != null) {
      setParentAgent(currentUserId);
    }
  }, [isCurrentUserAgent, subAgentRoleOption, currentUserId]);

  const handleImageUpload = async (file: File) => {
    const result = await uploadImageAction(file);
    if (result.success && result.file_url) {
      setImageUrl(result.file_url);
      toast.success("Image uploaded successfully");
    } else {
      toast.error(result.message || "Image upload failed");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isCurrentUserSubAgent) {
      toast.error("Sub-agents are not allowed to create users.");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("At least one role is required");
      return;
    }

    if (isCurrentUserAgent && currentUserId == null) {
      toast.error("Could not determine your user id. Please log in again.");
      return;
    }

    if (isCurrentUserAgent && !subAgentRole) {
      toast.error("Sub-agent role could not be resolved. Contact an administrator.");
      return;
    }

    const phoneFormatError = getUkPhoneFormatError(formState.phone);
    if (phoneFormatError) {
      setPhoneError(phoneFormatError);
      toast.error(phoneFormatError);
      return;
    }
    setPhoneError(undefined);

    setIsSubmitting(true);
    setParentAgentError(undefined);

    // Agents always create users with Sub-agent role reporting to themselves.
    const resolvedParentAgent = isCurrentUserAgent ? currentUserId : parentAgent;
    const resolvedRoles =
      isCurrentUserAgent && subAgentRole
        ? [subAgentRole.id]
        : selectedRoles.map((role) => Number(role.value));

    const result = await createUser({
      ...formState,
      role: resolvedRoles,
      image_url: imageUrl,
      is_active: true,
      parent_agent: resolvedParentAgent,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "User created successfully");
      router.push("/users/user-list");
      router.refresh();
    } else {
      setParentAgentError(getFieldError(result.errors, "parent_agent"));
      toast.error(result.message || "Failed to create user");
    }
  };

  if (isCurrentUserSubAgent) {
    return (
      <div className="account-card space-y-3 rounded-xl p-5 shadow">
        <h2 className="text-xl font-semibold text-[#383E49]">Add User</h2>
        <p className="text-sm text-red-600">
          Sub-agents are not allowed to create users.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="account-card space-y-5 rounded-xl p-5 shadow">
      <h2 className="text-xl font-semibold text-[#383E49]">Add User</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            className="mt-1"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="mt-1"
            value={formState.email}
            onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder={UK_PHONE_PLACEHOLDER}
            className="mt-1"
            value={formState.phone}
            onChange={(event) => {
              const nextPhone = event.target.value;
              setFormState((prev) => ({ ...prev, phone: nextPhone }));
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            className="mt-1"
            value={formState.password}
            onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            className={cn(selectClassName, "mt-1")}
            value={String(formState.gender)}
            onChange={(event) => setFormState((prev) => ({ ...prev, gender: Number(event.target.value) }))}
          >
            <option value="0">Male</option>
            <option value="1">Female</option>
            <option value="2">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="profile-image">Profile Image</Label>
          <Input
            id="profile-image"
            className="mt-1 py-1"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImageUpload(file);
            }}
          />
        </div>
      </div>
      <div>
        <Label>Roles</Label>
        <CustomMultiSelect
          className="mt-1"
          options={roleOptions}
          value={selectedRoles}
          onChange={(nextRoles) => {
            // Agents cannot pick other roles — keep Sub-agent role locked.
            if (isCurrentUserAgent) return;
            setSelectedRoles(nextRoles);
          }}
          placeholder="Select roles"
          isDisabled={isCurrentUserAgent}
          isClearable={!isCurrentUserAgent}
        />
        {isCurrentUserAgent ? (
          <p className="mt-1 text-xs text-gray-500">
            As an Agent you can only create a user with the Sub-agent role under your account.
          </p>
        ) : null}
        {isCurrentUserAgent && !subAgentRoleOption ? (
          <p className="mt-1 text-xs text-red-600">
            Sub-agent role was not found via role search. Contact an administrator.
          </p>
        ) : null}
      </div>
      {!isCurrentUserAgent ? (
        <ParentAgentSelect
          id="parent-agent"
          options={parentAgentOptions}
          value={parentAgent}
          onChange={setParentAgent}
          error={parentAgentError}
        />
      ) : parentAgentError ? (
        <p className="text-xs text-red-600">{parentAgentError}</p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton
          isSubmitting={isSubmitting}
          defaultLabel="Create User"
          submittingLabel="Creating..."
        />
      </div>
    </form>
  );
}
