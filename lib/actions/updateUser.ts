"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { patchResource } from "@/lib/actions/baseMutations";

const updateUserSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  role: z.array(z.number()).optional(),
  gender: z.union([z.number(), z.string()]).optional(),
  user_id: z.string().optional(),
  image_url: z.string().optional().nullable(),
  password: z.string().optional(),
  is_active: z.boolean().optional(),
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
