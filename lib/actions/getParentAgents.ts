"use server";

import { getResource } from "@/lib/baseQueries";
import { AGENT_ROLE_ID } from "@/lib/constants/roles";
import { isSessionExpired } from "@/lib/constants/authErrors";
import type { ParentAgentOption, UserRecord } from "@/lib/types/user";

type UserListPayload = {
  results?: UserRecord[];
  next?: string | null;
  total_pages?: number;
};

/** Safety net so a bad `next` link can never spin forever. */
const MAX_PAGES = 20;

/**
 * Active agents eligible to be a parent.
 *
 * Only top-level agents qualify — the API supports exactly one level of hierarchy,
 * so anyone who already has a `parent_agent` cannot become one. Paged through in
 * full because the picker needs every candidate, not just the first page.
 */
export async function getParentAgentOptions(): Promise<ParentAgentOption[]> {
  const options: ParentAgentOption[] = [];
  const seenIds = new Set<number>();

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await getResource(
        `api/v1/auth/web/user/?role=${AGENT_ROLE_ID}&is_active=true&page=${page}`
      );
      const payload = (response.data || response) as UserListPayload;
      const results = Array.isArray(payload.results) ? payload.results : [];

      for (const user of results) {
        const id = Number(user.id);
        // `parent_agent` set means this agent is already a sub-agent.
        if (user.parent_agent != null) continue;
        if (!Number.isFinite(id) || seenIds.has(id)) continue;
        const name = (user.name || "").trim();
        if (!name) continue;
        seenIds.add(id);
        options.push({ id, name });
      }

      const hasNextPage = payload.next
        ? true
        : payload.total_pages != null
          ? page < payload.total_pages
          : false;
      if (!hasNextPage || results.length === 0) break;
    }
  } catch (error) {
    if (isSessionExpired(error)) throw error;
    // A missing picker is better than a dead page — the field is optional.
    return options;
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
