"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createResource } from "@/lib/actions/baseMutations";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.array(z.number()).min(1),
  gender: z.number().optional(),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function createUser(data: unknown) {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed. Please check your inputs.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await createResource("api/v1/auth/web/user/", parsed.data);
    revalidatePath("/users/user-list");
    revalidatePath("/users/add-user");
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
