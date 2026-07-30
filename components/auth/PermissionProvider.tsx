"use client";

import { useEffect } from "react";
import usePermissionStore from "@/lib/permissions/permissionStore";
import { usePermissionsQuery } from "@/hooks/usePermissionsQuery";

type PermissionProviderProps = {
  children: React.ReactNode;
  /** Optional SSR seed; normally null so layout does not block on permissions. */
  initialPermissions?: Record<string, Set<string>> | null;
};

/**
 * Hydrates the Zustand permission store from React Query (and optional SSR seed).
 * Does not block the full app with a spinner — route guards wait on `isLoaded`.
 */
export default function PermissionProvider({
  children,
  initialPermissions = null,
}: PermissionProviderProps) {
  const setInitialPermissions = usePermissionStore(
    (state) => state.setInitialPermissions
  );
  const { data, isSuccess, isError } = usePermissionsQuery();

  // Optional one-time seed if the server ever passes permissions.
  useEffect(() => {
    if (initialPermissions && Object.keys(initialPermissions).length > 0) {
      setInitialPermissions(initialPermissions);
    }
  }, [initialPermissions, setInitialPermissions]);

  // Sync React Query cache into the Zustand store used by hasPermission helpers.
  useEffect(() => {
    if (isSuccess && data) {
      const asSets: Record<string, Set<string>> = {};
      Object.entries(data).forEach(([section, actions]) => {
        asSets[section] = new Set(actions);
      });
      setInitialPermissions(asSets);
      return;
    }

    if (isError) {
      setInitialPermissions({});
    }
  }, [data, isSuccess, isError, setInitialPermissions]);

  return <>{children}</>;
}
