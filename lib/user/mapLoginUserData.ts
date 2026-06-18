import type { RoleSummary, UserRecord } from "@/lib/types/user";

type TokenRole =
  | RoleSummary
  | string
  | number
  | {
      id?: number;
      name?: string;
      role_name?: string;
    };

export type TokenUserPayload = {
  id?: number | string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  slug?: string;
  user_slug?: string;
  user_id?: string;
  image_url?: string | null;
  profile_image?: string | null;
  is_active?: boolean;
  role_details?: RoleSummary[];
  role?: TokenRole | TokenRole[];
  role_name?: string;
  role_names?: string[];
  roles?: TokenRole[];
};

function mapSingleRole(role: TokenRole): RoleSummary | null {
  if (typeof role === "number") {
    return { id: role, name: `Role ${role}` };
  }

  if (typeof role === "string") {
    const trimmedRole = role.trim();
    return trimmedRole ? { id: 0, name: trimmedRole } : null;
  }

  const roleName =
    role.name || ("role_name" in role ? role.role_name : undefined);
  if (!roleName) {
    return null;
  }

  return {
    id: role.id ?? 0,
    name: roleName,
  };
}

function mapRoleDetails(payload: TokenUserPayload): RoleSummary[] {
  if (Array.isArray(payload.role_details) && payload.role_details.length > 0) {
    return payload.role_details.filter((role) => Boolean(role?.name));
  }

  const roleSources: TokenRole[] = [];

  if (Array.isArray(payload.roles)) {
    roleSources.push(...payload.roles);
  }

  if (Array.isArray(payload.role)) {
    roleSources.push(...payload.role);
  } else if (payload.role) {
    roleSources.push(payload.role);
  }

  const mappedRoles = roleSources
    .map((role) => mapSingleRole(role))
    .filter((role): role is RoleSummary => Boolean(role));

  if (mappedRoles.length > 0) {
    return mappedRoles;
  }

  if (Array.isArray(payload.role_names) && payload.role_names.length > 0) {
    return payload.role_names
      .map((roleName) => mapSingleRole(roleName))
      .filter((role): role is RoleSummary => Boolean(role));
  }

  if (payload.role_name) {
    const singleRole = mapSingleRole(payload.role_name);
    return singleRole ? [singleRole] : [];
  }

  return [];
}

export function mapLoginUserData(payload: TokenUserPayload): UserRecord {
  return {
    id: payload.id ?? "",
    slug: payload.slug || payload.user_slug || "",
    user_id: payload.user_id,
    name: payload.name || payload.username || "",
    email: payload.email || "",
    phone: payload.phone || undefined,
    image_url: payload.image_url ?? payload.profile_image ?? null,
    is_active: payload.is_active ?? true,
    role_details: mapRoleDetails(payload),
  };
}

export function getRoleDisplayNames(user: UserRecord | null | undefined): string {
  return (user?.role_details || [])
    .map((role) => role.name?.trim())
    .filter((name): name is string => Boolean(name))
    .join(", ");
}
