"use client";
import React, { useState } from "react";
import { CustomMultiSelect, SelectOption } from "@/ui/multiSelect";

const MultiSelectExample: React.FC = () => {
  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([]);

  // Example options
  const options: SelectOption[] = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
    { value: "option4", label: "Option 4" },
    { value: "option5", label: "Option 5" },
  ];

  const handleSelectionChange = (newSelectedOptions: SelectOption[]) => {
    setSelectedOptions(newSelectedOptions);
    console.log("Selected options:", newSelectedOptions);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Multi-Select Example</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Multiple Options
        </label>
        <CustomMultiSelect
          options={options}
          value={selectedOptions}
          onChange={handleSelectionChange}
          placeholder="Choose multiple options..."
          isClearable={true}
          isSearchable={true}
          maxValues={3} // Optional: limit to 3 selections
          className="w-full max-w-md"
        />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Selected Options:</h3>
        {selectedOptions.length === 0 ? (
          <p className="text-gray-500">No options selected</p>
        ) : (
          <ul className="space-y-1">
            {selectedOptions.map((option) => (
              <li key={option.value} className="text-sm text-gray-700">
                <span className="font-medium">{option.label}</span>
                <span className="text-gray-500 ml-2">({option.value})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Raw Data:</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(selectedOptions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MultiSelectExample;
