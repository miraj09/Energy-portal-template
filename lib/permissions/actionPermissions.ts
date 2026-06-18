export const ACTION_PERMISSIONS = {
  authentication: {
    view: { section: "authentication", action: "view_user_details" },
    edit: { section: "authentication", action: "edit_user" },
    delete: { section: "authentication", action: "delete_user" },
  },
} as const;

export function getActionPermission(
  module: keyof typeof ACTION_PERMISSIONS | string,
  actionKey: "view" | "edit" | "delete" | string
) {
  const map = ACTION_PERMISSIONS as Record<string, Record<string, { section: string; action: string }>>;
  return map?.[module]?.[actionKey];
}
