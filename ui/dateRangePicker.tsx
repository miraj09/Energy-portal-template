"use client";

import { useState, useEffect, useRef } from "react";
import { DateRange, Range, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { CalendarRange } from "lucide-react";

/** A completed date range as reported by / passed into the picker. */
export interface SelectedDateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  onRangeChange: (
    formattedRange: string,
    startDate: Date,
    endDate: Date
  ) => void;
  /**
   * Optional controlled value.
   * - Omit it and the picker manages its own state (legacy behaviour).
   * - Pass a range to show it, or `null` to reset the picker to empty — this is
   *   how a parent-level "Clear" button can wipe the displayed text.
   */
  value?: SelectedDateRange | null;
}

/** Text shown in the read-only input once a full range has been picked. */
const formatRangeText = (startDate: Date, endDate: Date): string =>
  `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;

/** Shape `react-date-range` expects for its `ranges` prop. */
const buildCalendarRange = (startDate: Date, endDate: Date): Range[] => [
  { startDate, endDate, key: "selection" },
];

export default function DateRangePicker({
  onRangeChange,
  value,
}: DateRangePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  // Seed from the controlled value when given so there is no empty→filled flash on mount
  const [range, setRange] = useState<Range[]>(() =>
    value
      ? buildCalendarRange(value.startDate, value.endDate)
      : buildCalendarRange(new Date(), new Date())
  );
  const [selectedRangeText, setSelectedRangeText] = useState<string>(() =>
    value ? formatRangeText(value.startDate, value.endDate) : ""
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  // Keep internal display state in sync with the controlled `value` prop.
  // Depending on timestamps (not the object) means a parent re-render that passes
  // a structurally-equal range does not wipe an in-progress selection.
  const isControlled = value !== undefined;
  const controlledStartTime = value?.startDate.getTime();
  const controlledEndTime = value?.endDate.getTime();

  useEffect(() => {
    if (!isControlled) return;

    if (controlledStartTime === undefined || controlledEndTime === undefined) {
      // Parent cleared the range (value === null)
      const today = new Date();
      setRange(buildCalendarRange(today, today));
      setSelectedRangeText("");
      return;
    }

    const startDate = new Date(controlledStartTime);
    const endDate = new Date(controlledEndTime);
    setRange(buildCalendarRange(startDate, endDate));
    setSelectedRangeText(formatRangeText(startDate, endDate));
  }, [isControlled, controlledStartTime, controlledEndTime]);

  const handleSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    if (!selection.startDate || !selection.endDate) return;

    setRange([selection]);

    const formatted = formatRangeText(selection.startDate, selection.endDate);
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
    setRange(buildCalendarRange(today, today));
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
