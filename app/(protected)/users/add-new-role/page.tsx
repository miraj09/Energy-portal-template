import AddRole from "@/components/account/AddRole";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { getResource } from "@/lib/baseQueries";
import { SIDEBAR_NAVIGATION_SECTION } from "@/lib/permissions/constants";
import { isSessionExpired } from "@/lib/constants/authErrors";

export default async function AddNewRolePage() {
  let permissionsData: Array<{
    name: string;
    permissions: Array<{ id: number; name: string; code: string }>;
  }> = [];
  let errorMessage: string | null = null;

  try {
    const response = await getResource(
      "api/v1/auth/web/all-permissions-section-wise/",
      {},
      { section: SIDEBAR_NAVIGATION_SECTION, action: "add_role" }
    );
    const payload = (response.data || response) as Array<{
      name: string;
      permissions: Array<{ id: number; name: string; code: string }>;
    }>;
    permissionsData = payload || [];
  } catch (error) {
    if (isSessionExpired(error)) throw error;
    const typedError = error as { message?: string };
    errorMessage = typedError.message || "An unexpected error occurred. Please try refreshing the page.";
  }

  if (errorMessage) {
    return <ErrorMessage title="Failed to load permissions" message={errorMessage} type="error" />;
  }

  return (
    <div className="account-light-surface mx-auto max-w-7xl rounded-xl bg-[#F9F9F9] p-6 shadow-[0px_4px_20px_0px_#00000040]">
      <AddRole permissionsData={permissionsData} />
    </div>
  );
}
