import PermissionProvider from "@/components/auth/PermissionProvider";
import ProtectedLayoutShell from "@/app/(protected)/ProtectedLayoutShell";
import QueryProvider from "@/components/providers/QueryProvider";
import { MenuProvider } from "@/contexts/MenuContext";
import { toMenuNodes } from "@/lib/navigation/menuUtils";
import { sidebarMenuConfig } from "@/lib/navigation/sidebarMenuConfig";

/**
 * Protected shell renders immediately — permissions load via React Query
 * on the client so navigations are not blocked by a permissions round-trip.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fullSidebarMenu = toMenuNodes(sidebarMenuConfig);

  return (
    <QueryProvider>
      <PermissionProvider initialPermissions={null}>
        <MenuProvider menu={fullSidebarMenu}>
          <ProtectedLayoutShell>{children}</ProtectedLayoutShell>
        </MenuProvider>
      </PermissionProvider>
    </QueryProvider>
  );
}
