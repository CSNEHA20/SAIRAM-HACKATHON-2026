import { useState, useEffect, useCallback } from 'react';
import { SSEChartEvent, SSEDiagramEvent } from '../types';

export interface PinnedItem {
  id: string;
  type: 'chart' | 'diagram';
  title: string;
  timestamp: string;
  data: SSEChartEvent | SSEDiagramEvent;
}

const DASHBOARD_STORAGE_KEY = 'dataflow_pinned_dashboard';

export function useDashboard() {
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>(() => {
    try {
      const stored = localStorage.getItem(DASHBOARD_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(pinnedItems));
    } catch (err) {
      console.warn('Failed to save dashboard pins:', err);
    }
  }, [pinnedItems]);

  const pinItem = useCallback((type: 'chart' | 'diagram', title: string, itemData: SSEChartEvent | SSEDiagramEvent) => {
    const id = `pin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem: PinnedItem = {
      id,
      type,
      title: title || (type === 'chart' ? 'Chart Visualization' : 'Diagram'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      data: itemData,
    };
    setPinnedItems((prev) => [newItem, ...prev]);
  }, []);

  const unpinItem = useCallback((id: string) => {
    setPinnedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isPinned = useCallback((title: string) => {
    return pinnedItems.some((item) => item.title === title);
  }, [pinnedItems]);

  const clearDashboard = useCallback(() => {
    setPinnedItems([]);
  }, []);

  return {
    pinnedItems,
    pinItem,
    unpinItem,
    isPinned,
    clearDashboard,
  };
}
