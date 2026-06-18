import AllUsersTable from "@/components/account/AllUsersTable";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FilterAwarePagination } from "@/components/ui/FilterAwarePagination";
import { getResource } from "@/lib/baseQueries";
import { isSessionExpired } from "@/lib/constants/authErrors";
import type { UserRecord } from "@/lib/types/user";

export default async function UserListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const pageParam = params?.page;
  const searchParam = params?.search || "";
  let currentPage = parseInt(pageParam || "1", 10);
  currentPage = currentPage < 1 || Number.isNaN(currentPage) ? 1 : currentPage;

  let users: UserRecord[] = [];
  let rolesData: Array<{ id: number; name: string }> = [];
  let totalItems = 0;
  let itemsPerPage = 10;
  let totalPages = 1;
  let activePage = currentPage;
  let errorMessage: string | null = null;

  try {
    let apiUrl = `api/v1/auth/web/user/?page=${currentPage}`;
    if (searchParam.trim()) {
      apiUrl += `&search=${encodeURIComponent(searchParam.trim())}`;
    }

    const [usersRes, rolesRes] = await Promise.all([
      getResource(apiUrl, {}, { section: "authentication", action: "view_user_list" }),
      getResource("api/v1/auth/web/role-list/"),
    ]);

    const payload = (usersRes.data || usersRes) as {
      results?: UserRecord[];
      total_items?: number;
      total_pages?: number;
      active_page?: number;
      page_size?: number;
      count?: number;
    };

    users = payload.results || [];
    totalItems = payload.total_items ?? payload.count ?? users.length;
    itemsPerPage = payload.page_size ?? 10;
    totalPages = payload.total_pages ?? Math.max(1, Math.ceil(totalItems / itemsPerPage));
    activePage = payload.active_page ?? currentPage;

    const rolePayload = (rolesRes.data || rolesRes) as { results?: Array<{ id: number; name: string }> };
    rolesData = rolePayload.results || [];
  } catch (error) {
    if (isSessionExpired(error)) throw error;
    const typedError = error as { message?: string };
    errorMessage = typedError.message || "An unexpected error occurred. Please try refreshing the page.";
  }

  if (errorMessage) {
    return <ErrorMessage title="Failed to load users" message={errorMessage} type="error" />;
  }

  return (
    <div className="account-light-surface mx-auto max-w-7xl rounded-xl bg-[#F9F9F9] p-6 shadow-[0px_4px_20px_0px_#00000040]">
      <div className="space-y-5">
        <AllUsersTable
          users={users}
          tableTitle="All Users"
          searchQuery={searchParam}
          rolesData={rolesData}
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
