import React, { JSX } from "react";
import { Button } from "@/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/tooltip";
import { SubMenuItem } from "./NavigationMenuItem";

interface SubmenuTooltipProps {
  children: React.ReactNode;
  subItems: SubMenuItem[];
  label: string;
}

export const SubmenuTooltip = ({
  children,
  subItems,
  label,
}: SubmenuTooltipProps): JSX.Element => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          align="start"
          sideOffset={8}
          className="p-2 min-w-[200px] bg-white border-gray-200 shadow-xl z-[9999]"
          style={{
            backgroundColor: 'white',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            opacity: 1,
            zIndex: 9999
          }}
        >
          <div className="space-y-1">
            <div className="font-semibold text-sm text-[#346fb6] mb-2 px-2">
              {label}
            </div>
            {subItems.map((subItem, index) => (
              <Button
                key={`tooltip-sub-item-${index}`}
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm h-auto py-2 px-2 ${
                  subItem.active
                    ? "text-[#346fb6] bg-[#2db9eb13] font-medium"
                    : "text-neutral-600 font-normal hover:text-[#346fb6] hover:bg-[#2db9eb13]"
                }`}
                onClick={subItem.onClick}
              >
                <span className="mr-2">
                  <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                </span>
                <span className="font-['Inter'] text-sm">{subItem.label}</span>
              </Button>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};