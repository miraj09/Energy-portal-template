"use client";

import { getActionPermission } from "@/lib/permissions/actionPermissions";
import usePermissionStore from "@/lib/permissions/permissionStore";

export default function useAllowedActions(moduleKey?: string) {
  const hasPermission = usePermissionStore((state) => state.hasPermission);

  return (actionKeys: string[]) => {
    if (!moduleKey) return actionKeys;

    return actionKeys.filter((actionKey) => {
      const permission = getActionPermission(moduleKey, actionKey);
      if (!permission) return true;
      return hasPermission(permission.section, permission.action);
    });
  };
}
