"use client";

import { useMemo } from "react";
import { CustomSelect, type SelectOption } from "@/ui/select";
import { Label } from "@/ui/label";
import type { ParentAgentOption } from "@/lib/types/user";

type ParentAgentSelectProps = {
  id: string;
  /** Top-level agents returned by the API — already filtered to `parent_agent === null`. */
  options: ParentAgentOption[];
  value: number | null;
  onChange: (parentAgentId: number | null) => void;
  /** The user being edited, so they can't be their own parent. */
  excludeUserId?: number | string;
  /** Server-side message from `errors.parent_agent`. */
  error?: string;
};

/**
 * Picks the agent a user reports to. Clearing it detaches the user
 * (the caller sends `parent_agent: null`), making them top-level again.
 */
export default function ParentAgentSelect({
  id,
  options,
  value,
  onChange,
  excludeUserId,
  error,
}: ParentAgentSelectProps) {
  const selectOptions = useMemo<SelectOption[]>(
    () =>
      options
        .filter((agent) => String(agent.id) !== String(excludeUserId))
        .map((agent) => ({ value: String(agent.id), label: agent.name })),
    [options, excludeUserId]
  );

  const selectedOption =
    selectOptions.find((option) => option.value === String(value)) ?? null;

  return (
    <div>
      <Label htmlFor={id}>Reports To</Label>
      <CustomSelect
        inputId={id}
        className="mt-1 h-auto w-full"
        options={selectOptions}
        value={selectedOption}
        onChange={(option) =>
          onChange(option ? Number((option as SelectOption).value) : null)
        }
        isClearable
        placeholder="No parent agent"
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">
          Optional. A sub-agent inherits their parent agent&apos;s permissions and
          their sales become visible to that parent.
        </p>
      )}
    </div>
  );
}
