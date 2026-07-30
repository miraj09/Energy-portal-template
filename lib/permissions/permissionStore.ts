"use client";

import { create } from "zustand";
import { checkPermission } from "@/lib/permissions/checkPermission";

type PermissionState = {
  permissions: Record<string, Set<string>>;
  isLoaded: boolean;
  setInitialPermissions: (serverPermissions: Record<string, Set<string>>) => void;
  load: () => Promise<void>;
  hasPermission: (section: string, action: string) => boolean;
  hasAnyPermission: (section: string, actions: string[]) => boolean;
};

const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: {},
  isLoaded: false,

  setInitialPermissions(serverPermissions) {
    set({ permissions: serverPermissions, isLoaded: true });
  },

  async load() {
    if (get().isLoaded) return;

    try {
      const response = await fetch("/api/user-permissions");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { data } = (await response.json()) as {
        data: Record<string, string[]>;
      };

      const optimized: Record<string, Set<string>> = {};
      Object.entries(data).forEach(([section, actions]) => {
        optimized[section] = new Set(actions);
      });

      set({ permissions: optimized, isLoaded: true });
    } catch {
      set({ permissions: {}, isLoaded: true });
    }
  },

  hasPermission(section, action) {
    return checkPermission(get().permissions, section, action);
  },

  hasAnyPermission(section, actions) {
    return actions.some((action) => get().hasPermission(section, action));
  },
}));

export default usePermissionStore;
