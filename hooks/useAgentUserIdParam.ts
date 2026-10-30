"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserRecord } from "@/lib/types/user";
import { userHasAnyRole } from "@/lib/user/mapLoginUserData";
import { AGENT_HIERARCHY_ROLE_NAMES } from "@/lib/constants/roles";

const USER_STORAGE_KEY = "energy_user_Data";

function readStoredUser(): UserRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserRecord;
  } catch {
    return null;
  }
}

function resolveUserId(user: UserRecord | null): number | null {
  if (user?.id == null) return null;
  const parsed = Number(user.id);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * `agent_user_id` for agent-scoped list APIs — only for Agent / Sub-agent users.
 * Other roles get an empty filter so they see the full unscoped list.
 * `isReady` is true after the first client read of localStorage.
 */
export function useAgentUserIdParam(): {
  agentUserId: number | null;
  isReady: boolean;
  /** Merge into table filters when the user is Agent/Sub-agent. */
  agentUserIdFilter: { agent_user_id?: number };
} {
  const [agentUserId, setAgentUserId] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const user = readStoredUser();
    const isAgentHierarchy = userHasAnyRole(user, AGENT_HIERARCHY_ROLE_NAMES);
    setAgentUserId(isAgentHierarchy ? resolveUserId(user) : null);
    setIsReady(true);
  }, []);

  const agentUserIdFilter = useMemo(
    () =>
      agentUserId != null
        ? { agent_user_id: agentUserId }
        : ({} as { agent_user_id?: number }),
    [agentUserId]
  );

  return { agentUserId, isReady, agentUserIdFilter };
}
