import AllRolesTable from "@/components/account/AllRolesTable";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FilterAwarePagination } from "@/components/ui/FilterAwarePagination";
import { getResource } from "@/lib/baseQueries";
import { isSessionExpired } from "@/lib/constants/authErrors";
import type { RoleRecord } from "@/lib/types/role";

export default async function RoleListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const pageParam = params?.page;
  const searchParam = params?.search || "";
  let currentPage = parseInt(pageParam || "1", 10);
  currentPage = currentPage < 1 || Number.isNaN(currentPage) ? 1 : currentPage;

  let roles: RoleRecord[] = [];
  let permissionsData: Array<{
    name: string;
    permissions: Array<{ id: number; name: string; code: string }>;
  }> = [];
  let totalItems = 0;
  let itemsPerPage = 10;
  let totalPages = 1;
  let activePage = currentPage;
  let errorMessage: string | null = null;

  try {
    let apiUrl = `api/v1/auth/web/role/?page=${currentPage}`;
    if (searchParam.trim()) {
      apiUrl += `&search=${encodeURIComponent(searchParam.trim())}`;
    }

    const [rolesRes, permissionsRes] = await Promise.all([
      getResource(apiUrl, {}, { section: "authentication", action: "view_role_list" }),
      getResource("api/v1/auth/web/all-permissions-section-wise/"),
    ]);

    const payload = (rolesRes.data || rolesRes) as {
      results?: RoleRecord[];
      total_items?: number;
      total_pages?: number;
      active_page?: number;
      page_size?: number;
      count?: number;
    };

    roles = payload.results || [];
    totalItems = payload.total_items ?? payload.count ?? roles.length;
    itemsPerPage = payload.page_size ?? 10;
    totalPages = payload.total_pages ?? Math.max(1, Math.ceil(totalItems / itemsPerPage));
    activePage = payload.active_page ?? currentPage;

    const permissionsPayload = (permissionsRes.data || permissionsRes) as Array<{
      name: string;
      permissions: Array<{ id: number; name: string; code: string }>;
    }>;
    permissionsData = permissionsPayload || [];
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
      <div className="space-y-5">
        <AllRolesTable
          roles={roles}
          tableTitle="All Roles"
          searchQuery={searchParam}
          permissionsData={permissionsData}
        />
        <FilterAwarePagination
          currentPage={activePage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}