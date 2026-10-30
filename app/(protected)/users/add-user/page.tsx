import AddUser from "@/components/account/AddUser";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { getResource } from "@/lib/baseQueries";
import { isSessionExpired } from "@/lib/constants/authErrors";
import { getParentAgentOptions } from "@/lib/actions/getParentAgents";
import { SUB_AGENT_ROLE_SEARCH } from "@/lib/constants/roles";
import type { ParentAgentOption } from "@/lib/types/user";

type RoleOption = { id: number; name: string };

/** Normalize role-list payloads that may be `{ results }` or a bare array. */
function parseRoleListPayload(payload: unknown): RoleOption[] {
  if (Array.isArray(payload)) {
    const roles: RoleOption[] = [];
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const record = item as { id?: unknown; name?: unknown };
      const id = Number(record.id);
      const name =
        typeof record.name === "string" ? record.name.trim() : "";
      if (!Number.isFinite(id) || !name) continue;
      roles.push({ id, name });
    }
    return roles;
  }

  if (payload && typeof payload === "object" && "results" in payload) {
    return parseRoleListPayload((payload as { results?: unknown }).results);
  }

  return [];
}

/** Collapse name to alphanumeric for loose matching (e.g. "Sub Agent" → "subagent"). */
function normalizeRoleName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Pick Sub-agent from search results: prefer name matching "subagent", else first hit.
 */
function pickSubAgentRole(roles: RoleOption[]): RoleOption | null {
  if (roles.length === 0) return null;

  const target = normalizeRoleName(SUB_AGENT_ROLE_SEARCH);
  const exact = roles.find((role) => normalizeRoleName(role.name) === target);
  if (exact) return exact;

  const partial = roles.find((role) =>
    normalizeRoleName(role.name).includes(target)
  );
  if (partial) return partial;

  return roles[0] ?? null;
}

/** Resolve Sub-agent via role-list?search=sub-agent (no hardcoded role id). */
async function fetchSubAgentRole(): Promise<RoleOption | null> {
  const response = await getResource(
    `api/v1/auth/web/role-list/?search=${encodeURIComponent(SUB_AGENT_ROLE_SEARCH)}`
  );
  const roles = parseRoleListPayload(response.data || response);
  return pickSubAgentRole(roles);
}

export default async function AddUserPage() {
  let rolesData: RoleOption[] = [];
  let subAgentRole: RoleOption | null = null;
  let parentAgentOptions: ParentAgentOption[] = [];
  let errorMessage: string | null = null;

  try {
    const [rolesResponse, parentAgents, resolvedSubAgent] = await Promise.all([
      getResource("api/v1/auth/web/role-list/"),
      getParentAgentOptions(),
      fetchSubAgentRole(),
    ]);
    rolesData = parseRoleListPayload(rolesResponse.data || rolesResponse);
    subAgentRole = resolvedSubAgent;
    parentAgentOptions = parentAgents;
  } catch (error) {
    if (isSessionExpired(error)) throw error;
    const typedError = error as { message?: string };
    errorMessage =
      typedError.message ||
      "An unexpected error occurred. Please try refreshing the page.";
  }

  if (errorMessage) {
    return (
      <ErrorMessage title="Failed to load roles" message={errorMessage} type="error" />
    );
  }

  return (
    <div className="account-light-surface mx-auto max-w-7xl rounded-xl bg-[#F9F9F9] p-6 shadow-[0px_4px_20px_0px_#00000040]">
      <AddUser
        rolesData={rolesData}
        parentAgentOptions={parentAgentOptions}
        subAgentRole={subAgentRole}
      />
    </div>
  );
}
