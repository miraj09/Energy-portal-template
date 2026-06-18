export type RoleSummary = {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
};

export type UserRecord = {
  id: number | string;
  slug: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  gender?: number | string;
  image_url?: string | null;
  is_active: boolean;
  role_details?: RoleSummary[];
};
