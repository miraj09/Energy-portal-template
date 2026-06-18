"use server";

import { revalidatePath } from "next/cache";
import { deleteResource } from "@/lib/actions/baseMutations";

export async function deleteUser(slug: string) {
  try {
    await deleteResource(`api/v1/auth/web/user/${slug}/`);
    revalidatePath("/users/user-list");
    revalidatePath("/users/add-user");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    const typedError = error as { message?: string; errors?: unknown };
    return {
      success: false,
      message: typedError.message || "Failed to delete user",
      errors: typedError.errors || {},
    };
  }
}
