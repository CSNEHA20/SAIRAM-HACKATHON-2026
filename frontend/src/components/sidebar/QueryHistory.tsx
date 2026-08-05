import React from 'react';
import { HistoryItem } from '../../hooks/useQueryHistory';
import { History, Trash2, MessageSquare } from 'lucide-react';

interface QueryHistoryProps {
  history: HistoryItem[];
  onSelectQuery: (query: string) => void;
  onRemoveQuery: (id: string) => void;
  onClearHistory: () => void;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  onSelectQuery,
  onRemoveQuery,
  onClearHistory,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          <History className="w-4 h-4 text-cyan-400" />
          <span>Query History</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[10px] text-slate-500 hover:text-red-400 transition-colors font-mono"
            title="Clear all history"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {history.length === 0 ? (
          <p className="text-xs text-slate-600 font-mono italic">No recent queries</p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              onClick={() => onSelectQuery(item.query)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">{item.query}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveQuery(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                title="Delete item"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
