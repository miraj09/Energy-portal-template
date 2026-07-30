"use client";

import React, { JSX, useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, MenuIcon, XIcon, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import Image from "next/image";
import { NavigationMenu } from "@/components/NavigationMenu/NavigationMenu";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLogoutForm } from "@/components/LogoutForm";
import { LogoutConfirmationModal } from "@/components/LogoutConfirmationModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/modal";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { patchMethod } from "@/lib/actions/patchMethod";
import { uploadImageAction } from "@/lib/actions/uploadImage";
import { toast } from "sonner";
import { getRoleDisplayNames } from "@/lib/user/mapLoginUserData";
import type { UserRecord } from "@/lib/types/user";
import { branding } from "@/lib/config/branding";

const USER_STORAGE_KEY = "energy_user_Data";

export const Header = (): JSX.Element => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useSidebar();
  const { handleLogout, isPending } = useLogoutForm();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    imageUrl: string | null;
    imagePreview: string | null;
  }>({ name: "", email: "", phone: "", imageUrl: null, imagePreview: null });
  const [saveSuccess, setSaveSuccess] = useState<string>("");
  const [saveError, setSaveError] = useState<string>("");
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserRecord & { username?: string };
        setUser(parsed);
        setForm({
          name: parsed?.name || parsed?.username || "",
          email: parsed?.email || "",
          phone: parsed?.phone || "",
          imageUrl: parsed?.image_url ?? null,
          imagePreview: parsed?.image_url ?? null,
        });
      }
    } catch (e) {
      console.log("Failed to read energy_user_Data:", e);
    }
  }, []);

  const roleNames = useMemo(() => getRoleDisplayNames(user), [user]);
  const roleLabel = roleNames || "No role assigned";
  const displayName = user?.name || (user as UserRecord & { username?: string })?.username || "User";

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImageUploading(true);
    const result = await uploadImageAction(file as unknown as File);
    if (result.success && result.file_url) {
      setForm((prev) => ({
        ...prev,
        imageUrl: result.file_url!,
        imagePreview: result.file_url!,
      }));
    }
    setIsImageUploading(false);
  };

  const onSubmitProfile: React.FormEventHandler<HTMLFormElement> = async (
    ev
  ) => {
    ev.preventDefault();
    setSaveSuccess("");
    setSaveError("");
    if (!form.name?.trim() || !form.email?.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    if (!user?.slug) {
      console.log("No user slug found");
      return;
    }
    setIsSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
    };
    // Always send image_url: if user removed, this will be null to clear server-side
    payload.image_url = form.imageUrl === null ? null : form.imageUrl;
    const endpoint = `/api/v1/auth/web/user/${user.slug}/`;
    const res = await patchMethod(payload, endpoint);
    console.log("Profile update response:", res);
    if (res.success && res.data) {
      const apiUser = res.data as UserRecord;
      const mergedUser: UserRecord = {
        ...user,
        ...apiUser,
        role_details: apiUser.role_details?.length ? apiUser.role_details : user.role_details,
        image_url:
          form.imageUrl === null
            ? null
            : apiUser.image_url ?? form.imageUrl ?? null,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mergedUser));
      setUser(mergedUser);
      toast.success("Profile updated successfully");
      setIsProfileOpen(false);
    } else if (!res.success) {
      const err = res as { message?: string };
      toast.error(err?.message || "Update failed");
    }
    setIsSaving(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirmation(false);
    localStorage.removeItem(USER_STORAGE_KEY);
    handleLogout();
  };

  return (
    <>
      <header className="w-full h-16 sm:h-20 border-b border-[#e8eaed]">
        <div className="h-16 sm:h-20">
          <div className="flex h-16 sm:h-20 items-center justify-between p-3 sm:p-4 bg-white">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] bg-[#f6f6f6] rounded-[32px] p-1 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </Button>

            {/* Desktop Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] bg-[#f6f6f6] rounded-[32px] p-1 hidden lg:flex"
              onClick={toggleSidebar}
            >
              {isSidebarCollapsed ? (
                <Image
                  src="/icons/sidebar-collapse.svg"
                  alt="Sidebar Open"
                  width={20}
                  height={20}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              ) : (
                <Image
                  src="/icons/sidebar-collapse.svg"
                  alt="Sidebar Close"
                  width={20}
                  height={20}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              )}
            </Button>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f6f6f6] rounded-[32px] p-1"
              >
                <Image
                  src="/icons/notification.svg"
                  alt="Bell"
                  width={20}
                  height={20}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 sm:h-12 pl-2 pr-8 sm:pr-12 py-1 bg-neutral-100 rounded-[32px] flex items-center gap-2 sm:gap-4 relative"
                  >
                    <Avatar className="w-7 h-7 sm:w-9 sm:h-9 bg-[#346fb6]">
                      {user?.image_url ? (
                        <Image
                          src={user.image_url}
                          alt={user.name || "User"}
                          width={36}
                          height={36}
                          className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover"
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="hidden sm:flex flex-col items-start justify-center gap-1">
                      <div className="flex items-center justify-center gap-2.5">
                        <span className="font-['Lato'] font-[800] text-gray-500 text-xs sm:text-[14px]">
                          {displayName}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute right-2 sm:right-3 text-gray-500" />
                      </div>

                      <div className="flex items-center justify-center gap-2.5">
                        <span
                          className="max-w-[140px] truncate font-['Lato'] font-[500] text-gray-500 text-[10px] sm:text-[12px]"
                          title={roleNames || undefined}
                        >
                          {roleLabel}
                        </span>
                      </div>
                    </div>

                    {/* Mobile: Show only avatar and dropdown icon */}
                    <div className="sm:hidden">
                      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white text-black"
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setIsProfileOpen(true)}
                  >
                    Profile
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem> */}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleLogoutClick}
                    disabled={isPending}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <Image
                width={139}
                height={52}
                className="w-[139px] h-[52px] object-contain"
                alt={branding.logoAlt}
                src={branding.logoSrc}
                unoptimized
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8"
              >
                <XIcon className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavigationMenu />
            </div>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 text-[#346fb6] font-['Noto_Sans_Lao'] text-[14px] tracking-[0px] leading-[140%]"
                onClick={handleLogoutClick}
                disabled={isPending}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Log out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={confirmLogout}
        isLoggingOut={isPending}
      />
      <ProfileEditModal
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        form={form}
        setForm={setForm}
        onSubmit={onSubmitProfile}
        onPickImage={onPickImage}
        saveSuccess={saveSuccess}
        saveError={saveError}
        isImageUploading={isImageUploading}
        isSaving={isSaving}
      />
    </>
  );
};

// Profile Edit Modal
// Rendered at root of Header to stay within client component
export const ProfileEditModal = ({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  onPickImage,
  saveSuccess,
  saveError,
  isImageUploading,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: {
    name: string;
    email: string;
    phone: string;
    imageUrl: string | null;
    imagePreview: string | null;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      imageUrl: string | null;
      imagePreview: string | null;
    }>
  >;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onPickImage: React.ChangeEventHandler<HTMLInputElement>;
  saveSuccess?: string;
  saveError?: string;
  isImageUploading?: boolean;
  isSaving?: boolean;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg text-[#737373] font-bold">
            Edit Profile
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {saveError ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {saveError}
            </div>
          ) : null}
          {saveSuccess ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              {saveSuccess}
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="image">Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={onPickImage}
                  disabled={isImageUploading}
                />
                {isImageUploading ? (
                  <span className="text-xs text-primary">
                    Uploading...
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {!isImageUploading && form.imagePreview ? (
            <div className="flex items-center gap-3">
              <Image
                src={form.imagePreview}
                alt="Preview"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                className="bg-[#ff0000b9] text-white"
                onClick={() =>
                  setForm((p) => ({ ...p, imageUrl: null, imagePreview: null }))
                }
              >
                Remove
              </Button>
            </div>
          ) : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={isImageUploading || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
