"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Interface for supplier data
export interface Supplier {
  id: number;
  name: string;
}

// Interface for supplier option in react-select
export interface SupplierOption {
  value: string;
  label: string;
}

// Cache for suppliers to avoid multiple API calls
let suppliersCache: Supplier[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Normalize supplier data from API response
  const normalizeSuppliers = useCallback((data: any): Supplier[] => {
    let items: Array<{ id: number | string; name?: string; title?: string; description?: string }> = [];
    
    // Handle different response structures
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === "object" && Array.isArray(data.results)) {
      items = data.results;
    } else if (data && typeof data === "object" && Array.isArray(data.data)) {
      items = data.data;
    } else if (
      data &&
      typeof data === "object" &&
      data.data &&
      typeof data.data === "object" &&
      Array.isArray(data.data.results)
    ) {
      items = data.data.results;
    } else {
      // Try to extract items from any nested structure
      const allKeys = Object.keys(data || {});
      for (const key of allKeys) {
        const value = data[key];
        if (Array.isArray(value) && value.length > 0) {
          const firstItem = value[0];
          if (firstItem && (firstItem.id !== undefined || firstItem.name !== undefined || firstItem.title !== undefined)) {
            items = value;
            break;
          }
        }
      }
    }

    if (items.length === 0) {
      throw new Error("No suppliers found in response");
    }

    return items.map((item) => ({
      id: Number(item.id),
      name: String(item.name ?? item.title ?? item.description ?? item.id),
    }));
  }, []);

  // Fetch suppliers from API
  const fetchSuppliers = useCallback(async (): Promise<Supplier[]> => {
    try {
      const response = await fetch("/api/supplier", { cache: "no-store" });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.message || "API returned error");
      }
      
      return normalizeSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      throw err;
    }
  }, [normalizeSuppliers]);

  // Get suppliers with caching
  const getSuppliers = useCallback(async (): Promise<Supplier[]> => {
    // Check if cache is valid
    if (suppliersCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return suppliersCache;
    }

    // Fetch fresh data
    const freshSuppliers = await fetchSuppliers();
    
    // Update cache
    suppliersCache = freshSuppliers;
    cacheTimestamp = Date.now();
    
    return freshSuppliers;
  }, [fetchSuppliers]);

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    if (fetchedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch suppliers";
      setError(errorMessage);
      
      // No fallback data - show empty state
      setSuppliers([]);
    } finally {
      setLoading(false);
      fetchedRef.current = true;
    }
  }, [getSuppliers]);

  // Refresh suppliers (force fresh fetch)
  const refreshSuppliers = useCallback(async () => {
    // Clear cache
    suppliersCache = null;
    cacheTimestamp = 0;
    fetchedRef.current = false;
    
    await loadSuppliers();
  }, [loadSuppliers]);

  // Convert suppliers to options for react-select
  const supplierOptions: SupplierOption[] = suppliers.map(supplier => ({
    value: supplier.id.toString(),
    label: supplier.name
  }));

  // Find supplier by ID
  const findSupplierById = useCallback((id: number | string): Supplier | undefined => {
    return suppliers.find(s => s.id === Number(id));
  }, [suppliers]);

  // Find supplier by name
  const findSupplierByName = useCallback((name: string): Supplier | undefined => {
    return suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
  }, [suppliers]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return {
    suppliers,
    supplierOptions,
    loading,
    error,
    findSupplierById,
    findSupplierByName,
    refreshSuppliers,
    loadSuppliers
  };
}
