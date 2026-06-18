"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/auth";
import { useTransition } from "react";

export const useLogout = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const logout = async () => {
    startTransition(async () => {
      try {
        // Call the server action to clear cookies
        const result = await logoutAction();
        
        if (result.success) {
          // Redirect to login page
          router.push("/login");
          // Force a hard refresh to ensure all client-side state is cleared
          router.refresh();
        } else {
          console.error("Logout failed:", result.message);
          // Even if server logout fails, redirect to login for security
          router.push("/login");
          router.refresh();
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Even if there's an error, redirect to login for security
        router.push("/login");
        router.refresh();
      }
    });
  };

  return { logout, isLoggingOut: isPending };
}; 