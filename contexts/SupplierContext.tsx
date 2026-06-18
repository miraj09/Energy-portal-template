"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useSuppliers, Supplier, SupplierOption } from "@/hooks/useSuppliers";

interface SupplierContextType {
  suppliers: Supplier[];
  supplierOptions: SupplierOption[];
  loading: boolean;
  error: string | null;
  findSupplierById: (id: number | string) => Supplier | undefined;
  findSupplierByName: (name: string) => Supplier | undefined;
  refreshSuppliers: () => Promise<void>;
  loadSuppliers: () => Promise<void>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

interface SupplierProviderProps {
  children: ReactNode;
}

export function SupplierProvider({ children }: SupplierProviderProps) {
  const supplierData = useSuppliers();

  return (
    <SupplierContext.Provider value={supplierData}>
      {children}
    </SupplierContext.Provider>
  );
}

export function useSupplierContext(): SupplierContextType {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error("useSupplierContext must be used within a SupplierProvider");
  }
  return context;
}
