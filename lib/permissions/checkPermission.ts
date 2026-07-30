import { SIDEBAR_NAVIGATION_SECTION } from "@/lib/permissions/constants";

export const AUTHENTICATION_SECTION = "authentication";

/** User-management actions that may still be issued under authentication. */
export const USER_MANAGEMENT_ACTIONS = new Set([
  "add_role",
  "view_role_list",
  "view_user_list",
]);

/**
 * Checks whether a permission is granted.
 * User-management actions configured under sidebar-navigation also match
 * the same action codes in the authentication section (backend compatibility).
 */
export function checkPermission(
  permissions: Record<string, Set<string>>,
  section: string,
  action: string
): boolean {
  if (permissions[section]?.has(action)) return true;

  if (
    section === SIDEBAR_NAVIGATION_SECTION &&
    USER_MANAGEMENT_ACTIONS.has(action) &&
    permissions[AUTHENTICATION_SECTION]?.has(action)
  ) {
    return true;
  }

  return false;
}
