"use client";

import Link from "next/link";
import { Button } from "@/ui/button";
import { useMenu } from "@/contexts/MenuContext";
import { getFirstMenuHref } from "@/lib/navigation/menuUtils";

export default function UnauthorizedPage() {
  const menu = useMenu();
  const fallbackHref = getFirstMenuHref(menu);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-2xl font-semibold text-[#2b2f38]">Access denied</h1>
      <p className="mb-6 max-w-md text-sm text-neutral-500">
        You do not have permission to view this page. Contact your administrator if you believe
        this is a mistake.
      </p>
      {fallbackHref ? (
        <Button asChild className="bg-[#346fb6] hover:bg-[#2d5f9d]">
          <Link href={fallbackHref}>Go to an available page</Link>
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href="/login">Back to login</Link>
        </Button>
      )}
    </div>
  );
}
