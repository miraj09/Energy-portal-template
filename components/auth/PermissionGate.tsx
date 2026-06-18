"use client";

import usePermissionStore from "@/lib/permissions/permissionStore";

type PermissionGateProps = {
  section: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function PermissionGate({
  section,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const hasPermission = usePermissionStore((state) => state.hasPermission(section, action));
  return <>{hasPermission ? children : fallback}</>;
}
