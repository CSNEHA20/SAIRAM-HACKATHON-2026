import { useState, useEffect, useCallback, useMemo } from 'react';

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  isFavorite?: boolean;
  favoritedAt?: string;
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

  const persist = useCallback((updated: HistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save query history:', err);
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
      persist(updated);
      return updated;
    });
  }, [persist]);

  const removeQuery = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const toggleFavorite = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const isFavorite = !item.isFavorite;
        return {
          ...item,
          isFavorite,
          favoritedAt: isFavorite ? new Date().toISOString() : undefined,
        };
      });
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear query history:', err);
    }
  }, []);

  const favorites = useMemo(
    () => history.filter((item) => item.isFavorite).sort((a, b) => (b.favoritedAt || '').localeCompare(a.favoritedAt || '')),
    [history]
  );

  return { history, favorites, addQuery, removeQuery, toggleFavorite, clearHistory };
}
