import { loadUserPermissions } from "@/lib/permissions/permissionUtils";
import { isSessionExpired } from "@/lib/constants/authErrors";

export async function GET() {
  try {
    const permissions = await loadUserPermissions();
    const serializedPermissions: Record<string, string[]> = {};

    Object.entries(permissions).forEach(([section, permissionSet]) => {
      serializedPermissions[section] = Array.from(permissionSet);
    });

    return Response.json({
      success: true,
      data: serializedPermissions,
    });
  } catch (error) {
    if (isSessionExpired(error)) {
      return Response.json(
        {
          success: false,
          code: "SESSION_EXPIRED",
          error: "Your session has expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    return Response.json(
      {
        success: false,
        error: "Failed to load user permissions",
      },
      { status: 500 }
    );
  }
}
