"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { useBreadcrumbs, BreadcrumbItem as BreadcrumbItemType } from "@/hooks/useBreadcrumbs";

interface DynamicBreadcrumbProps {
  className?: string;
  customBreadcrumbs?: BreadcrumbItemType[];
}

export const DynamicBreadcrumb: React.FC<DynamicBreadcrumbProps> = ({
  className = "",
  customBreadcrumbs,
}) => {
  const router = useRouter();
  const breadcrumbs = useBreadcrumbs(customBreadcrumbs);

  const handleBreadcrumbClick = (href: string, isCurrentPage?: boolean, disabled?: boolean) => {
    if (!isCurrentPage && !disabled) {
      router.push(href);
    }
  };

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage className="font-medium text-gray-500 text-sm lg:text-base">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={item.href}
                  className={`font-medium text-sm lg:text-base ${
                    item.disabled 
                      ? 'text-gray-400 cursor-default' 
                      : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick(item.href, item.isCurrentPage, item.disabled);
                  }}
                >
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}; 