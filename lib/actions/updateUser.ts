"use server";

import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { patchResource } from "@/lib/actions/baseMutations";
import { CURRENT_USER_PERMISSIONS_REVALIDATE_TAG } from "@/lib/constants/revalidateTags";
import {
  getUkPhoneFormatError,
  UK_PHONE_FORMAT_ERROR,
} from "@/lib/validation/ukPhone";

const updateUserSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value?.trim() || getUkPhoneFormatError(value) == null, {
      message: UK_PHONE_FORMAT_ERROR,
    }),
  role: z.array(z.number()).optional(),
  gender: z.union([z.number(), z.string()]).optional(),
  user_id: z.string().optional(),
  image_url: z.string().optional().nullable(),
  password: z.string().optional(),
  is_active: z.boolean().optional(),
  parent_agent: z.number().nullable().optional(),
});

export async function updateUser(data: unknown) {
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed. Please check your inputs.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { slug, ...payload } = parsed.data;

  try {
    const result = await patchResource(`api/v1/auth/web/user/${slug}/`, payload);
    revalidatePath("/users/user-list");
    revalidatePath("/users/add-user");
    // Reassigning or detaching parent_agent changes the user's inherited
    // permissions; without this the sidebar keeps the cached set until next login.
    updateTag(CURRENT_USER_PERMISSIONS_REVALIDATE_TAG);
    return {
      success: true,
      data: result.data || result,
      message: "User updated successfully",
    };
  } catch (error) {
    const typedError = error as { message?: string; errors?: unknown };
    return {
      success: false,
      message: typedError.message || "Failed to update user",
      errors: typedError.errors || {},
    };
  }
}
