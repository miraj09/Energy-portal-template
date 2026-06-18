"use client";

import { useEffect } from "react";
import usePermissionStore from "@/lib/permissions/permissionStore";

function DefaultSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/60">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
    </div>
  );
}

type PermissionProviderProps = {
  children: React.ReactNode;
  initialPermissions?: Record<string, Set<string>> | null;
};

export default function PermissionProvider({
  children,
  initialPermissions = null,
}: PermissionProviderProps) {
  const { load, isLoaded, setInitialPermissions } = usePermissionStore();

  useEffect(() => {
    if (initialPermissions && Object.keys(initialPermissions).length > 0) {
      setInitialPermissions(initialPermissions);
    } else {
      void load();
    }
  }, [initialPermissions, load, setInitialPermissions]);

  if (!isLoaded) return <DefaultSpinner />;
  return <>{children}</>;
}
