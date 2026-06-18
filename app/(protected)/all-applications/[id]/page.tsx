"use client";
import ApplicationDetails from "@/components/ApplicationDetails";
import { useParams } from "next/navigation";

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  
  return <ApplicationDetails id={id as string} />;
}