export type PermissionRecord = {
  id: number;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
};

export type RoleRecord = {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  role_permissions?: PermissionRecord[];
  permissions_details?: PermissionRecord[];
};
