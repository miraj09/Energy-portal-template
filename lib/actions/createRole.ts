"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createResource } from "@/lib/actions/baseMutations";
import { SIDEBAR_NAVIGATION_SECTION } from "@/lib/permissions/constants";

const roleSchema = z.object({
  role: z.object({
    name: z.string().min(1, { error: "Role name is required" }),
    description: z.string().optional(),
    is_active: z.boolean().default(true),
  }),
  permissions: z.array(z.number()).min(1, { error: "At least one permission is required" }),
});

export async function createRole(data: unknown) {
  const parsed = roleSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Validation failed. Please check your inputs.",
    };
  }

  try {
    const response = await createResource(
      "api/v1/auth/web/role/",
      parsed.data,
      { section: SIDEBAR_NAVIGATION_SECTION, action: "add_role" }
    );
    revalidatePath("/users/role-list");
    revalidatePath("/users/add-new-role");
    return {
      success: true,
      data: response.data || response,
      message: "Role created successfully!",
    };
  } catch (error) {
    const typedError = error as { status?: number; message?: string; errors?: unknown };
    return {
      success: false,
      message: typedError.message || "Failed to save role to the server.",
      errors: typedError.errors || {},
      status: typedError.status,
    };
  }
}
