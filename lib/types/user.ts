export type RoleSummary = {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
};

/** Minimal shape the API returns for a user's parent agent. */
export type ParentAgentSummary = {
  id: number;
  name: string;
  email?: string;
  slug?: string;
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
  /** Writable FK — the agent this user reports to, or null for a top-level user. */
  parent_agent?: number | null;
  /** Read-only expansion of `parent_agent`. */
  parent_agent_details?: ParentAgentSummary | null;
  /** Read-only — direct reports. The API allows exactly one level, so these are always leaves. */
  sub_agents?: ParentAgentSummary[];
};

/** An agent eligible to be picked as someone's parent. */
export type ParentAgentOption = {
  id: number;
  name: string;
};
