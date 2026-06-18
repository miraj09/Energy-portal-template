import React from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <LoadingSpinner label="Preparing your experience" size={36} />
    </div>
  );
}


