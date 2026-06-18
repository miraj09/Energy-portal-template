"use client";

import { useParams } from "next/navigation";
import ExportContractDetails from "@/components/ExportContractDetails";

export default function ExportContractDetailsPage() {
  const { id } = useParams();

  return <ExportContractDetails id={id as string} />;
}
