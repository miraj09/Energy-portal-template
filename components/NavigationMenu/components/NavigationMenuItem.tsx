import React, { useState, JSX, useCallback, memo } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/ui/button";
import { SubmenuTooltip } from "./SubmenuTooltip";

export interface SubMenuItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface NavigationMenuItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  subItems?: SubMenuItem[];
  onClick?: () => void;
  isCollapsed?: boolean;
  /** Optional count badge shown next to the label (e.g. new enquiries). */
  badge?: number;
}

export const NavigationMenuItem = memo(({
  icon,
  label,
  active = false,
  subItems,
  onClick,
  isCollapsed = false,
  badge,
}: NavigationMenuItemProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubItems = subItems && subItems.length > 0;
  const showBadge = typeof badge === "number" && badge > 0;

  // Auto-expand submenu if any submenu item is active
  React.useEffect(() => {
    if (hasSubItems && subItems.some(subItem => subItem.active)) {
      setIsExpanded(true);
    }
  }, [hasSubItems, subItems]);

  const handleMainItemClick = useCallback(() => {
    if (hasSubItems && !isCollapsed) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  }, [hasSubItems, isExpanded, onClick, isCollapsed]);

  // Create the main button
  const mainButton = (
    <Button
      variant="ghost"
      className={`w-full justify-start mb-2 ${
        active
          ? "bg-[#2db9eb26] text-[#346fb6] font-semibold"
          : "text-neutral-500 font-medium"
      } ${isCollapsed ? 'justify-center px-0' : ''}`}
      onClick={handleMainItemClick}
      title={isCollapsed && !hasSubItems ? label : undefined}
    >
      <span className={isCollapsed ? '' : 'mr-3'}>{icon}</span>
      {!isCollapsed && (
        <>
          <span className="font-['Arial',Helvetica,sans-serif] text-sm flex-1 text-left flex items-center gap-2 min-w-0">
            <span className="truncate">{label}</span>
            {showBadge && (
              <span
                className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold leading-none shrink-0"
                aria-label={`${badge} new`}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </span>
          {hasSubItems && (
            <span className="ml-auto">
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </span>
          )}
        </>
      )}
    </Button>
  );

  return (
    <div className="w-full">
      {/* Render with tooltip if collapsed and has submenus */}
      {isCollapsed && hasSubItems ? (
        <SubmenuTooltip subItems={subItems} label={label}>
          {mainButton}
        </SubmenuTooltip>
      ) : (
        mainButton
      )}

      {/* Submenu items - only show when not collapsed */}
      {hasSubItems && isExpanded && !isCollapsed && (
        <div className="ml-6 mb-2 space-y-1">
          {subItems.map((subItem, index) => (
            <Button
              key={`sub-item-${index}`}
              variant="ghost"
              className={`w-full justify-start text-sm py-2 h-auto ${
                subItem.active
                  ? "text-[#346fb6] bg-[#2db9eb13] font-medium"
                  : "text-neutral-400 font-normal hover:text-[#346fb6] hover:bg-[#2db9eb13]"
              }`}
              onClick={subItem.onClick}
            >
              <span className="mr-3">
                <div className="w-2 h-2 rounded-full bg-current opacity-50" />
              </span>
              <span className="font-['Arial',Helvetica,sans-serif] text-sm">{subItem.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
});

NavigationMenuItem.displayName = 'NavigationMenuItem';