"use client";
import React, { useState, useEffect } from "react";
import Select, { Props as SelectProps, MultiValue } from "react-select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomMultiSelectProps
  extends Omit<
    SelectProps<SelectOption, true>,
    "className" | "isMulti" | "onChange"
  > {
  className?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: SelectOption[];
  onChange?: (selectedOptions: SelectOption[]) => void;
  isClearable?: boolean;
  isSearchable?: boolean;
  maxValues?: number;
}

const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
  className,
  placeholder = "Select options",
  options,
  value,
  onChange,
  isClearable = true,
  isSearchable = true,
  maxValues,
  ...props
}) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>(
    value || []
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedOptions(value);
    }
  }, [value]);

  const handleChange = (newValue: MultiValue<SelectOption>) => {
    const options = Array.from(newValue);

    // Check if max values limit is reached
    if (maxValues && options.length > maxValues) {
      return; // Don't update if limit exceeded
    }

    setSelectedOptions(options);
    onChange?.(options);
  };

  if (!isClient) {
    return (
      <div
        className={cn(
          "w-full min-h-[35px] border border-neutral-500 rounded-md bg-transparent px-3 py-2",
          className
        )}
      >
        <span className="text-neutral-500">{placeholder}</span>
      </div>
    );
  }

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable={isClearable}
      isSearchable={isSearchable}
      className={cn(
        "w-full min-h-[35px] border-neutral-500 shadow-shadow-xs",
        className
      )}
      classNames={{
        control: (state) =>
          cn(
            "!min-h-[35px] !border-neutral-500 !shadow-shadow-xs !bg-white !text-gray-900 !border !rounded-md",
            state.isFocused && "!ring-1 !ring-blue-500 !border-blue-500",
            state.isDisabled && "!opacity-50 !cursor-not-allowed"
          ),
        valueContainer: () => "!py-1 !px-3 !gap-1",
        input: () => "!m-0 !p-0",
        indicatorSeparator: () => "!hidden",
        dropdownIndicator: () => "!text-neutral-500 !p-0 !pr-2",
        menu: () =>
          "!bg-white !border !border-neutral-200 !rounded-md !shadow-lg !z-50",
        menuList: () => "!py-1",
        option: (state) =>
          cn(
            "!px-3 !py-2 !cursor-pointer !text-[#48505e]",
            state.isFocused && "!bg-blue-50",
            state.isSelected && "!bg-blue-500 !text-white"
          ),
        multiValue: () =>
          "!bg-blue-100 !border !border-blue-200 !rounded-md !mr-1",
        multiValueLabel: () => "!text-blue-800 !px-2 !py-1",
        multiValueRemove: () =>
          "!text-blue-600 !hover:!bg-blue-200 !rounded-r-md !px-1",
        placeholder: () => "!text-neutral-500",
      }}
      {...props}
    />
  );
};

CustomMultiSelect.displayName = "CustomMultiSelect";

export { CustomMultiSelect };
export type { CustomMultiSelectProps };
