"use client";

import React from "react";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function RouteChangeOverlay() {
  const { isRouteLoading } = useRouteLoading();

  if (!isRouteLoading) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "saturate(180%) blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
      }}
    >
      <LoadingSpinner label="Navigating" size={40} />
    </div>
  );
}


