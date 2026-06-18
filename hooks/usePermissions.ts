"use client";

import usePermissionStore from "@/lib/permissions/permissionStore";

export default function usePermissions() {
  const permissions = usePermissionStore((state) => state.permissions);
  const hasPermission = usePermissionStore((state) => state.hasPermission);
  const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);
  const isLoaded = usePermissionStore((state) => state.isLoaded);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    isLoaded,
  };
}
