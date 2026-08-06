import { renderHook, act } from '@testing-library/react';
import { useQueryHistory, HistoryItem } from './useQueryHistory';

const STORAGE_KEY = 'dataflow_query_history';

describe('useQueryHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads empty history when localStorage is empty', () => {
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history).toEqual([]);
  });

  it('loads persisted history from localStorage', () => {
    const stored: HistoryItem[] = [
      { id: '1', query: 'show orders', timestamp: '2024-01-01T00:00:00.000Z' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history).toEqual(stored);
  });

  it('adds a query and stores it in localStorage', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => result.current.addQuery('top customers'));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].query).toBe('top customers');

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].query).toBe('top customers');
  });

  it('does not add empty queries', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => result.current.addQuery('   '));
    expect(result.current.history).toHaveLength(0);
  });

  it('deduplicates queries case-insensitively and keeps most recent first', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => result.current.addQuery('Sales by region'));
    act(() => result.current.addQuery('sales by region'));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].query).toBe('sales by region');
  });

  it('limits history to 20 items', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addQuery(`query ${i}`);
      }
    });
    expect(result.current.history).toHaveLength(20);
  });

  it('removes a query by id', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => result.current.addQuery('orders'));
    const id = result.current.history[0].id;
    act(() => result.current.removeQuery(id));
    expect(result.current.history).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  it('clears history', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => result.current.addQuery('orders'));
    act(() => result.current.clearHistory());
    expect(result.current.history).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('toggles a favorite', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => result.current.addQuery('top customers'));
    const id = result.current.history[0].id;
    act(() => result.current.toggleFavorite(id));
    expect(result.current.history[0].isFavorite).toBe(true);
    expect(result.current.favorites).toHaveLength(1);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored[0].isFavorite).toBe(true);
    act(() => result.current.toggleFavorite(id));
    expect(result.current.history[0].isFavorite).toBe(false);
    expect(result.current.favorites).toHaveLength(0);
  });

  it('loads persisted favorites from localStorage', () => {
    const stored: HistoryItem[] = [
      { id: '1', query: 'show orders', timestamp: '2024-01-01T00:00:00.000Z', isFavorite: true, favoritedAt: '2024-01-01T00:00:01.000Z' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].query).toBe('show orders');
  });
});
