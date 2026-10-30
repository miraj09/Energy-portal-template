import React, { JSX } from "react";
import { branding } from "@/lib/config/branding";

/**
 * Footer shown on public (unauthenticated) pages such as login and password reset.
 * All company details come from the central branding config.
 */
export default function PublicPageFooter(): JSX.Element {
  return (
    <footer className="w-full shrink-0 px-4 py-6 sm:px-6 lg:px-8">
      <p className="mx-auto max-w-[749px] text-center font-inter text-xs sm:text-sm font-normal text-gray-500 leading-5 tracking-normal">
        {branding.portalName} is operated by <b>{branding.companyName}</b>. Registered
        in England &amp; Wales,{" "}
        <span className="whitespace-nowrap">company number {branding.companyNumber}</span>.
      </p>
    </footer>
  );
}
