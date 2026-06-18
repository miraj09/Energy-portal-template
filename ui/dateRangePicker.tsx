"use client";

import { useState, useEffect, useRef } from "react";
import { DateRange, Range, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { CalendarRange } from "lucide-react";

interface DateRangePickerProps {
  onRangeChange: (
    formattedRange: string,
    startDate: Date,
    endDate: Date
  ) => void;
}

export default function DateRangePicker({
  onRangeChange,
}: DateRangePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState<Range[]>([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [selectedRangeText, setSelectedRangeText] = useState<string>(""); // Initially empty
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    if (!selection.startDate || !selection.endDate) return;

    setRange([selection]);

    const formatted = `${format(selection.startDate, "dd/MM/yyyy")} - ${format(
      selection.endDate,
      "dd/MM/yyyy"
    )}`;
    setSelectedRangeText(formatted); // Set visual text

    // Only close the picker and trigger onChange when both dates are different
    // This ensures picker stays open while selecting the range
    if (selection.startDate.getTime() !== selection.endDate.getTime()) {
      onRangeChange(formatted, selection.startDate, selection.endDate);
      setShowPicker(false);
    }
  };

  const handleClear = () => {
    const today = new Date();
    setRange([
      {
        startDate: today,
        endDate: today,
        key: "selection",
      },
    ]);
    setSelectedRangeText("");
    // Signal clear to parent via empty formatted string
    onRangeChange("", today, today);
    setShowPicker(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="relative w-full border border-[#A0A0A0] rounded-sm"
      ref={pickerRef}
    >
      <input
        type="text"
        readOnly
        value={selectedRangeText}
        placeholder="Select date range"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full text-sm text-[#737373] pl-3 pr-10 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer placeholder:text-gray-400"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none">
        <CalendarRange color="#A0A0A0" size={18} />
      </div>

      {showPicker && (
        <div className="absolute z-50 mt-2 shadow-lg bg-white rounded right-[-26] p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-[#222]">Select range</div>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-600 hover:text-red-700 underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <DateRange
            editableDateInputs={true}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            ranges={range}
            rangeColors={["#1366D9"]}
            months={1}
            direction="vertical"
          />
        </div>
      )}
    </div>
  );
}
