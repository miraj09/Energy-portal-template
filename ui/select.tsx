"use client";
import React, { useState, useEffect } from "react";
import Select, { Props as SelectProps } from "react-select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps
  extends Omit<SelectProps<SelectOption, false>, "className"> {
  className?: string;
  placeholder?: string;
  options: SelectOption[];
  isDisabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  className,
  placeholder = "Select an option",
  options,
  isDisabled = false,
  ...props
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className={cn(
          "w-[155px] h-[35px] border border-neutral-500 rounded-md bg-transparent px-3 py-2",
          className
        )}
      >
        <span className="text-neutral-500">{placeholder}</span>
      </div>
    );
  }

  return (
    <Select
      {...props}
      options={options}
      placeholder={placeholder}
      isDisabled={isDisabled}
      className={cn(
        "w-[155px] h-[35px] border-neutral-500 shadow-shadow-xs",
        className
      )}
      classNames={{
        control: (state) =>
          cn(
            "!min-h-[35px] !h-[35px] !border-neutral-500 !shadow-shadow-xs !bg-transparent !border !rounded-md",
            state.isFocused && "!ring-1 !ring-blue-500 !border-blue-500",
            state.isDisabled && "!opacity-50 !cursor-not-allowed"
          ),
        valueContainer: () => "!py-0 !px-3",
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
            state.isSelected && "!bg-primary !text-primary-foreground"
          ),
        singleValue: () => "!text-neutral-700",
        placeholder: () => "!text-neutral-500",
      }}
    />
  );
};

CustomSelect.displayName = "CustomSelect";

export { CustomSelect };
export type { CustomSelectProps };
