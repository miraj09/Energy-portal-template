import AddUser from "@/components/account/AddUser";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { getResource } from "@/lib/baseQueries";
import { isSessionExpired } from "@/lib/constants/authErrors";

export default async function AddUserPage() {
  let rolesData: Array<{ id: number; name: string }> = [];
  let errorMessage: string | null = null;

  try {
    const response = await getResource("api/v1/auth/web/role-list/");
    const payload = (response.data || response) as { results?: Array<{ id: number; name: string }> };
    rolesData = payload.results || [];
  } catch (error) {
    if (isSessionExpired(error)) throw error;
    const typedError = error as { message?: string };
    errorMessage = typedError.message || "An unexpected error occurred. Please try refreshing the page.";
  }

  if (errorMessage) {
    return <ErrorMessage title="Failed to load roles" message={errorMessage} type="error" />;
  }

  return (
    <div className="account-light-surface mx-auto max-w-7xl rounded-xl bg-[#F9F9F9] p-6 shadow-[0px_4px_20px_0px_#00000040]">
      <AddUser rolesData={rolesData} />
    </div>
  );
}
