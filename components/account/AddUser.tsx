"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUser } from "@/lib/actions/createUser";
import SubmitButton from "@/components/ui/SubmitButton";
import { uploadImageAction } from "@/lib/actions/uploadImage";
import { CustomMultiSelect, type SelectOption } from "@/ui/multiSelect";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
);

type AddUserProps = {
  rolesData: Array<{ id: number; name: string }>;
};

export default function AddUser({ rolesData }: AddUserProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<SelectOption[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: 0,
  });

  const roleOptions = rolesData.map((role) => ({ value: String(role.id), label: role.name }));

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
    if (selectedRoles.length === 0) {
      toast.error("At least one role is required");
      return;
    }

    setIsSubmitting(true);
    const result = await createUser({
      ...formState,
      role: selectedRoles.map((role) => Number(role.value)),
      image_url: imageUrl,
      is_active: true,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "User created successfully");
      router.push("/users/user-list");
      router.refresh();
    } else {
      toast.error(result.message || "Failed to create user");
    }
  };

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
            className="mt-1"
            value={formState.phone}
            onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
          />
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
          onChange={setSelectedRoles}
          placeholder="Select roles"
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton isSubmitting={isSubmitting} defaultLabel="Create User" submittingLabel="Creating..." />
      </div>
    </form>
  );
}
