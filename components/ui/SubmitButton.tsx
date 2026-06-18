"use client";

import { Button } from "@/ui/button";

type SubmitButtonProps = {
  isSubmitting?: boolean;
  defaultLabel: string;
  submittingLabel?: string;
  className?: string;
};

export default function SubmitButton({
  isSubmitting = false,
  defaultLabel,
  submittingLabel = "Saving...",
  className,
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isSubmitting} className={className}>
      {isSubmitting ? submittingLabel : defaultLabel}
    </Button>
  );
}
