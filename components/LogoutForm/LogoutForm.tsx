"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/auth";
import { useState, useTransition } from "react";

export const useLogoutForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await logoutAction();
        if (result.success) {
          router.push("/login");
          router.refresh();
        } else {
          setError(result.message || "Logout failed");
        }
      } catch (err) {
        setError("Logout failed. Please try again.");
        console.error("Logout error:", err);
      }
    });
  };

  return { handleLogout, isPending, error };
};


