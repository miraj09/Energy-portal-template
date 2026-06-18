"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header/Header";
import { NavigationMenu } from "@/components/NavigationMenu/NavigationMenu";
import { DynamicBreadcrumb } from "@/ui/dynamic-breadcrumb";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/ui/button";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import RouteChangeOverlay from "@/components/RouteChangeOverlay";
import { RouteLoadingProvider } from "@/contexts/RouteLoadingContext";
import { SupplierProvider } from "@/contexts/SupplierContext";
import { useLogoutForm } from "@/components/LogoutForm";
import { LogoutConfirmationModal } from "@/components/LogoutConfirmationModal";
import { usePathname } from "next/navigation";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

const ProtectedLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { isSidebarCollapsed } = useSidebar();
  const { handleLogout, isPending } = useLogoutForm();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const pathname = usePathname();

  const { startTokenRefresh, stopTokenRefresh } = useTokenRefresh({
    refreshInterval: 10 * 60 * 1000,
  });

  React.useEffect(() => {
    startTokenRefresh();
    return () => stopTokenRefresh();
  }, [startTokenRefresh, stopTokenRefresh]);

  React.useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7faff]">
      <aside
        className={`hidden h-full flex-col justify-between bg-white shadow-[0px_4px_20px_#00000040] transition-all duration-300 ease-in-out lg:flex ${
          isSidebarCollapsed ? "w-16" : "w-48 xl:w-64"
        }`}
      >
        <NavigationMenu />

        <div className="p-6">
          <Button
            variant="ghost"
            className={`w-full justify-start gap-4 text-[14px] leading-[140%] tracking-[0px] text-[#346fb6] font-['Noto_Sans_Lao'] ${
              isSidebarCollapsed ? "justify-center px-0" : ""
            }`}
            onClick={() => setShowLogoutConfirmation(true)}
            disabled={isPending}
          >
            <LogOutIcon className="h-6 w-6" />
            {!isSidebarCollapsed && <span>{isPending ? "Logging out..." : "Log out"}</span>}
          </Button>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Header />
        {!isDashboard ? (
          <div className="px-4 py-2 lg:px-6">
            <DynamicBreadcrumb />
          </div>
        ) : null}
        {children}
      </main>

      <LogoutConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogout}
        isLoggingOut={isPending}
      />
    </div>
  );
};

export default function ProtectedLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SupplierProvider>
        <RouteLoadingProvider>
          <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
          <RouteChangeOverlay />
        </RouteLoadingProvider>
      </SupplierProvider>
    </SidebarProvider>
  );
}
