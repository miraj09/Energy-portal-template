import React from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ProtectedLoading() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <LoadingSpinner label="Loading secure content" size={36} />
    </div>
  );
}


