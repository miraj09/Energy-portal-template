"use client";
import SubmittedSalesDetails from "@/components/SubmittedSalesDetails";
import { useParams } from "next/navigation";

export default function SubmittedSalesDetailsPage() {
  const { id } = useParams();
  
  return <SubmittedSalesDetails id={id as string} />;
}
