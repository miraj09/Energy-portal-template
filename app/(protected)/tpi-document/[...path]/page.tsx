"use client";
import React from "react";
import TpiDocument from "@/components/TpiDocument/TpiDocument";
import { useParams } from "next/navigation";

export default function TpiDocumentPage() {
  const params = useParams();
  const pathSegments = params.path as string[] || [];
  
  return <TpiDocument folderPath={pathSegments} />;
}
