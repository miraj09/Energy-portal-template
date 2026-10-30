import React, { JSX } from "react";
import { PublicPageFooter } from "@/components/PublicPageFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7faff]">
      <main className="flex-1 flex flex-col">{children}</main>
      <PublicPageFooter />
    </div>
  );
}
