import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
}

const STORAGE_KEY = 'dataflow_query_history';

export function useQueryHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to parse query history:', err);
    }
  }, []);

  const addQuery = useCallback((query: string) => {
    if (!query.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
      const newItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        query: query.trim(),
        timestamp: new Date().toISOString(),
      };
      const updated = [newItem, ...filtered].slice(0, 20); // Limit to 20 recent queries
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save query history:', err);
      }
      return updated;
    });
  }, []);

  const removeQuery = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update query history:', err);
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear query history:', err);
    }
  }, []);

  return { history, addQuery, removeQuery, clearHistory };
}
