"use server";

import { revalidatePath } from "next/cache";
import { deleteResource } from "@/lib/actions/baseMutations";

export async function deleteRole(id: number) {
  try {
    await deleteResource(`api/v1/auth/web/role/${id}/`);
    revalidatePath("/users/role-list");
    revalidatePath("/users/add-new-role");
    return { success: true, message: "Role deleted successfully!" };
  } catch (error) {
    const typedError = error as { message?: string };
    return {
      success: false,
      message: typedError.message || "Failed to delete role",
    };
  }
}
