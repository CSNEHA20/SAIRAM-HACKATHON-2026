import React, { useState } from 'react';
import { HistoryItem } from '../../hooks/useQueryHistory';
import { History, Trash2, MessageSquare, Star } from 'lucide-react';

interface QueryHistoryProps {
  history: HistoryItem[];
  favorites: HistoryItem[];
  onSelectQuery: (query: string) => void;
  onRemoveQuery: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  favorites,
  onSelectQuery,
  onRemoveQuery,
  onToggleFavorite,
  onClearHistory,
}) => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const displayed = filter === 'favorites' ? favorites : history;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8b8ba7] uppercase tracking-wider font-mono">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Query History</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[10px] text-[#8b8ba7] hover:text-red-400 transition-colors font-mono"
            title="Clear all history"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 text-[10px] py-1 rounded font-mono transition-colors ${
            filter === 'all' ? 'bg-indigo-500/20 text-indigo-300' : 'text-[#8b8ba7] hover:bg-[#2a2a3a]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('favorites')}
          className={`flex-1 text-[10px] py-1 rounded font-mono transition-colors ${
            filter === 'favorites' ? 'bg-indigo-500/20 text-indigo-300' : 'text-[#8b8ba7] hover:bg-[#2a2a3a]'
          }`}
        >
          Favorites ({favorites.length})
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {displayed.length === 0 ? (
          <p className="text-xs text-[#8b8ba7]/60 font-mono italic">
            {filter === 'favorites' ? 'No favorite queries' : 'No recent queries'}
          </p>
        ) : (
          displayed.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-2 rounded-lg bg-[#1a1a24]/80 border border-[#2a2a3a]/80 hover:border-[#2a2a3a] text-xs text-[#8b8ba7] hover:text-[#f1f0ff] transition-all cursor-pointer"
              onClick={() => onSelectQuery(item.query)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{item.query}</span>
              </div>
              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className={`p-1 transition-opacity ${
                    item.isFavorite ? 'text-yellow-400 opacity-100' : 'opacity-0 group-hover:opacity-100 text-[#8b8ba7] hover:text-yellow-400'
                  }`}
                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-3 h-3 ${item.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveQuery(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#8b8ba7] hover:text-red-400 transition-opacity"
                  title="Delete item"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
