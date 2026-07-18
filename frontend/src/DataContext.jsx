import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

// -----------------------------------------------------------------------
// Fetches /api/settings once when the app loads and keeps it in memory.
// Dashboard and Settings both read from this instead of each calling the
// API on every mount - so switching between pages is instant and doesn't
// hit the backend repeatedly. Call refresh() after a save/delete to pull
// the latest data.
// -----------------------------------------------------------------------

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const result = await api.getSettings();
      setData(result);
      return result;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <DataContext.Provider value={{ data, loading, error, refresh, setData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useAppData must be used inside DataProvider");
  return ctx;
}
