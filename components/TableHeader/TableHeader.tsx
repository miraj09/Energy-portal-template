import React from "react";
import DateRangePicker from "@/ui/dateRangePicker";

interface TableHeaderProps {
  title: string;
  showCSVButton?: boolean;
  showExcelButton?: boolean;
  showSearchInput?: boolean;
  showDateRangePicker?: boolean;
  showFilterButton?: boolean;
  onCSVExport?: () => void;
  onExcelExport?: () => void;
  exportLoading?: boolean;
  onSearchChange?: (value: string) => void;
  onDateRangeChange?: (
    formattedRange: string,
    startDate: Date,
    endDate: Date
  ) => void;
  onFilterChange?: (filters: { condition: boolean; status: boolean }) => void;
  searchPlaceholder?: string;
  className?: string;
  // New controlled state props
  searchValue?: string;
  filterByCondition?: boolean;
  filterByStatus?: boolean;
  filterMenuOpen?: boolean;
  onSearchValueChange?: (value: string) => void;
  onFilterMenuToggle?: (open: boolean) => void;
  showAddButton?: boolean;
  addButtonTitle?: string;
  addButtonAction?: () => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  showCSVButton = true,
  showExcelButton = true,
  showSearchInput = true,
  showDateRangePicker = true,
  showFilterButton = true,
  onCSVExport,
  onExcelExport,
  exportLoading = false,
  onSearchChange,
  onDateRangeChange,
  onFilterChange,
  searchPlaceholder = "Search",
  className = "",
  // Controlled state props
  searchValue: controlledSearchValue,
  filterByCondition: controlledFilterByCondition,
  filterByStatus: controlledFilterByStatus,
  filterMenuOpen: controlledFilterMenuOpen,
  onSearchValueChange,
  onFilterMenuToggle,
  showAddButton = false,
  addButtonTitle = "Add",
  addButtonAction = () => console.log("Add User clicked"),
}) => {
  // Use controlled state if provided, otherwise use internal state
  const [internalFilterMenuOpen, setInternalFilterMenuOpen] =
    React.useState(false);
  const [internalFilterByCondition, setInternalFilterByCondition] =
    React.useState(false);
  const [internalFilterByStatus, setInternalFilterByStatus] =
    React.useState(false);
  const [internalSearchValue, setInternalSearchValue] = React.useState("");

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Determine which state to use (controlled vs internal)
  const isControlled = controlledSearchValue !== undefined;
  const filterMenuOpen = controlledFilterMenuOpen ?? internalFilterMenuOpen;
  const filterByCondition =
    controlledFilterByCondition ?? internalFilterByCondition;
  const filterByStatus = controlledFilterByStatus ?? internalFilterByStatus;
  const searchValue = controlledSearchValue ?? internalSearchValue;

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (isControlled) {
      onSearchValueChange?.(value);
    } else {
      setInternalSearchValue(value);
    }

    onSearchChange?.(value);
  };

  // Handle filter changes
  const handleFilterChange = (
    type: "condition" | "status",
    checked: boolean
  ) => {
    if (isControlled) {
      // Let parent handle the state
      onFilterChange?.({
        condition: type === "condition" ? checked : filterByCondition,
        status: type === "status" ? checked : filterByStatus,
      });
    } else {
      // Update internal state
      if (type === "condition") {
        setInternalFilterByCondition(checked);
      } else {
        setInternalFilterByStatus(checked);
      }

      onFilterChange?.({
        condition: type === "condition" ? checked : filterByCondition,
        status: type === "status" ? checked : filterByStatus,
      });
    }
  };

  // Handle filter menu toggle
  const handleFilterMenuToggle = () => {
    const newState = !filterMenuOpen;

    if (isControlled) {
      onFilterMenuToggle?.(newState);
    } else {
      setInternalFilterMenuOpen(newState);
    }
  };

  // Close filter menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (isControlled) {
          onFilterMenuToggle?.(false);
        } else {
          setInternalFilterMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isControlled, onFilterMenuToggle]);

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between w-full mb-2 gap-3 ${className}`}
    >
      <div className="text-[16px] font-medium text-[#222]">{title}</div>

      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Buttons row */}
        <div className="flex items-center gap-3">
          {showCSVButton && (
            <button
              onClick={onCSVExport}
              disabled={exportLoading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              CSV
            </button>
          )}
          {showExcelButton && (
            <button
              onClick={onExcelExport}
              disabled={exportLoading}
              className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Excel
            </button>
          )}
        </div>

        {/* Search input - full width */}
        {showSearchInput && (
          <div className="relative w-full">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full text-sm text-[#737373] pl-3 pr-10 py-2 border border-[#A0A0A0] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-search"
                viewBox="0 0 16 16"
              >
                <path
                  d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 
                  1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 
                  5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Date range picker - full width */}
        {showDateRangePicker && (
          <div className="w-full">
            <DateRangePicker
              onRangeChange={(formattedRange, startDate, endDate) => {
                onDateRangeChange?.(formattedRange, startDate, endDate);
              }}
            />
          </div>
        )}

        {/* Filter button - full width */}
        {showFilterButton && (
          <div className="relative w-full" ref={dropdownRef}>
            <button
              onClick={handleFilterMenuToggle}
              className="w-full p-2 cursor-pointer rounded bg-primary hover:bg-primary/90 text-primary-foreground focus:outline-none flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 
                  01-.293.707l-6.414 6.414A1 1 0 0114 
                  13.414V20a1 1 0 01-1.447.894l-4-2A1 
                  1 0 018 18.118V13.414a1 1 0 
                  01-.293-.707L1.293 6.707A1 1 0 011 6V4z"
                />
              </svg>
            </button>
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 z-10 w-48 bg-white border-md rounded shadow-2xl p-3 text-sm text-gray-800">
                <div className="font-medium text-primary mb-2">
                  Filter Options
                </div>
                <label className="flex items-center gap-2 cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    className="text-primary"
                    checked={filterByCondition}
                    onChange={(e) =>
                      handleFilterChange("condition", e.target.checked)
                    }
                  />
                  Product Condition
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="text-primary"
                    checked={filterByStatus}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.checked)
                    }
                  />
                  New Only
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-3">
        {showCSVButton && (
          <button
            onClick={onCSVExport}
            disabled={exportLoading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            CSV
          </button>
        )}
        {showExcelButton && (
          <button
            onClick={onExcelExport}
            disabled={exportLoading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Excel
          </button>
        )}
        {showSearchInput && (
          <div className="relative w-56">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full text-sm text-[#737373] pl-3 pr-10 py-2 border border-[#A0A0A0] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-search"
                viewBox="0 0 16 16"
              >
                <path
                  d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 
                  1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 
                  5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
                />
              </svg>
            </div>
          </div>
        )}
        {showDateRangePicker && (
          <div className="">
            <DateRangePicker
              onRangeChange={(formattedRange, startDate, endDate) => {
                onDateRangeChange?.(formattedRange, startDate, endDate);
              }}
            />
          </div>
        )}
        {showAddButton && (
          <button
            onClick={addButtonAction}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            {addButtonTitle}
          </button>
        )}

        {showFilterButton && (
          <div className="relative hidden" ref={dropdownRef}>
            <button
              onClick={handleFilterMenuToggle}
                className="p-2 cursor-pointer rounded bg-primary hover:bg-primary/90 text-primary-foreground focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 
                  01-.293.707l-6.414 6.414A1 1 0 0114 
                  13.414V20a1 1 0 01-1.447.894l-4-2A1 
                  1 0 018 18.118V13.414a1 1 0 
                  01-.293-.707L1.293 6.707A1 1 0 011 6V4z"
                />
              </svg>
            </button>
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 z-10 w-48 bg-white border-md rounded shadow-2xl p-3 text-sm text-gray-800">
                <div className="font-medium text-primary mb-2">
                  Filter Options
                </div>
                <label className="flex items-center gap-2 cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    className="text-primary"
                    checked={filterByCondition}
                    onChange={(e) =>
                      handleFilterChange("condition", e.target.checked)
                    }
                  />
                  Product Condition
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="text-primary"
                    checked={filterByStatus}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.checked)
                    }
                  />
                  New Only
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableHeader;
