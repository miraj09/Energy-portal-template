/** Role primary keys as allocated by the API. */
export const AGENT_ROLE_ID = 11;

/** Search term for resolving the Sub-agent role via role-list. */
export const SUB_AGENT_ROLE_SEARCH = "sub-agent";

/** Role display names that identify an Agent user (case-insensitive match). */
export const AGENT_ROLE_NAMES = ["Agent"] as const;

/**
 * Role display names that identify a Sub-agent user.
 * Include common API spellings so matching stays resilient.
 */
export const SUB_AGENT_ROLE_NAMES = ["Sub Agent", "Sub-agent", "Subagent"] as const;

/** Agent + Sub-agent — roles that should scope list APIs with agent_user_id. */
export const AGENT_HIERARCHY_ROLE_NAMES = [
  ...AGENT_ROLE_NAMES,
  ...SUB_AGENT_ROLE_NAMES,
] as const;
