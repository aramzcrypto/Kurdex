import React, { createContext, useContext } from "react";
import type { AllPrices } from "../types/prices";
import { usePrices } from "../hooks/usePrices";

interface PricesContextValue {
  data: AllPrices | null;
  lastFetched: Date | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  refresh: () => Promise<void> | void;
}

const PricesContext = createContext<PricesContextValue | undefined>(undefined);

export function PricesProvider({ children }: { children: React.ReactNode }) {
  const { data, lastFetched, loading, error, offline, refresh } = usePrices();

  return (
    <PricesContext.Provider value={{ data, lastFetched, loading, error, offline, refresh }}>
      {children}
    </PricesContext.Provider>
  );
}

export function usePricesContext() {
  const ctx = useContext(PricesContext);
  if (!ctx) {
    throw new Error("usePricesContext must be used within PricesProvider");
  }
  return ctx;
}
