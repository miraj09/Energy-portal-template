"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { createResource } from "@/lib/actions/baseMutations";
import { CURRENT_USER_PERMISSIONS_REVALIDATE_TAG } from "@/lib/constants/revalidateTags";
import { getUserProfile } from "@/lib/auth/actions";
import {
  isSubAgentUser,
  mapLoginUserData,
  type TokenUserPayload,
} from "@/lib/user/mapLoginUserData";
import {
  getUkPhoneFormatError,
  UK_PHONE_FORMAT_ERROR,
} from "@/lib/validation/ukPhone";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value?.trim() || getUkPhoneFormatError(value) == null, {
      message: UK_PHONE_FORMAT_ERROR,
    }),
  password: z.string().min(8),
  role: z.array(z.number()).min(1),
  gender: z.number().optional(),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  parent_agent: z.number().nullable().optional(),
});

/**
 * Reject create-user when the authenticated caller is a Sub-agent.
 * If profile cannot be loaded, allow the request through so backend auth still applies.
 */
async function assertCallerMayCreateUser(): Promise<{
  allowed: boolean;
  message?: string;
}> {
  try {
    const profile = await getUserProfile();
    if (!profile.success || !profile.data) {
      return { allowed: true };
    }

    const caller = mapLoginUserData(profile.data as TokenUserPayload);
    if (isSubAgentUser(caller)) {
      return {
        allowed: false,
        message: "Sub-agents are not allowed to create users.",
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export async function createUser(data: unknown) {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed. Please check your inputs.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const callerCheck = await assertCallerMayCreateUser();
  if (!callerCheck.allowed) {
    return {
      success: false,
      message: callerCheck.message || "You are not allowed to create users.",
      errors: {},
    };
  }

  try {
    const result = await createResource("api/v1/auth/web/user/", parsed.data);
    revalidatePath("/users/user-list");
    revalidatePath("/users/add-user");
    // A sub-agent inherits its parent's permissions, so the cached permission set
    // is stale the moment parent_agent is set.
    updateTag(CURRENT_USER_PERMISSIONS_REVALIDATE_TAG);
    return {
      success: true,
      data: result.data || result,
      message: "User created successfully",
    };
  } catch (error) {
    const typedError = error as { message?: string; errors?: unknown };
    return {
      success: false,
      message: typedError.message || "Failed to create user",
      errors: typedError.errors || {},
    };
  }
}
