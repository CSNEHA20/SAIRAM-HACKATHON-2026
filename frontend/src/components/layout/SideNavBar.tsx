import React from 'react';
import { HistoryItem } from '../../hooks/useQueryHistory';

interface SideNavBarProps {
  history: HistoryItem[];
  favorites: HistoryItem[];
  onSelectQuery: (q: string) => void;
  onRemoveQuery: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
  onNewQuery: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  history,
  favorites,
  onSelectQuery,
  onRemoveQuery,
  onToggleFavorite,
  onClearHistory,
  onNewQuery,
}) => {
  return (
    <nav className="hidden md:flex bg-surface-container-low dark:bg-[#0d0d0d] font-label-md text-label-md uppercase tracking-wider fixed left-0 top-0 h-full w-64 border-r border-outline-variant dark:border-[#2f3131] z-40 pt-16 flex-col transition-colors duration-300">
      <div className="flex flex-col h-full py-4 overflow-y-auto custom-scrollbar">

        {/* Glassmorphic Status Card */}
        <div className="px-4 mb-4 mt-2">
          <div className="rounded-xl bg-gradient-to-br from-surface-container dark:from-[#1a1a1a] to-surface-container-high dark:to-[#111] border border-outline-variant/60 dark:border-[#2f3131] p-3 flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-secondary/30 dark:to-primary/20 border border-primary/20 dark:border-secondary/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary dark:text-secondary-fixed text-[18px]">psychology</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary dark:bg-secondary-fixed shadow-[0_0_8px_rgba(0,200,100,0.8)] animate-pulse border border-surface dark:border-[#0d0d0d]"></span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[11px] text-on-surface dark:text-tertiary-fixed truncate">QueryMind Core</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary dark:bg-secondary-fixed"></span>
                <span className="text-[10px] text-secondary dark:text-secondary-fixed font-bold tracking-widest">ONLINE · ACTIVE</span>
              </div>
            </div>
          </div>

          {/* NEW QUERY Button */}
          <button
            onClick={onNewQuery}
            className="w-full mt-3 bg-primary dark:bg-secondary text-on-primary dark:text-on-secondary-container font-bold text-[11px] py-2.5 px-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer tracking-widest shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            NEW QUERY
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-0.5 px-2 mb-4">
          <a className="group flex items-center gap-3 px-3 py-2 text-primary dark:text-secondary-fixed font-bold border-r-2 border-primary dark:border-secondary-fixed bg-primary/5 dark:bg-secondary/10 rounded-lg cursor-pointer text-[11px]">
            <span className="material-symbols-outlined text-[18px] text-secondary dark:text-secondary-fixed">terminal</span>
            Query Lab
          </a>
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="px-3 mb-3">
            <div className="text-[9px] font-bold tracking-widest text-on-surface-variant dark:text-on-tertiary-container mb-2 px-1">FAVORITES</div>
            <div className="flex flex-col gap-0.5">
              {favorites.map((item) => (
                <div
                  key={`fav-${item.id}`}
                  className="group flex items-center gap-2 px-3 py-2 text-on-surface dark:text-tertiary-fixed hover:bg-surface-container dark:hover:bg-[#1b1c1c] transition-all rounded-lg cursor-pointer"
                  onClick={() => onSelectQuery(item.query)}
                >
                  <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed text-[14px]">star</span>
                  <span className="flex-1 truncate text-[10px] font-medium normal-case">{item.query}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="flex-1 px-3 overflow-hidden flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[9px] font-bold tracking-widest text-on-surface-variant dark:text-on-tertiary-container">HISTORY</span>
            {history.length > 0 && (
              <button onClick={onClearHistory} className="text-[9px] text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors font-bold tracking-widest">
                CLEAR
              </button>
            )}
          </div>

          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
            {history.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant dark:text-on-tertiary-container text-[10px] normal-case tracking-normal">
                No previous queries
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 px-3 py-2 text-on-surface-variant dark:text-on-tertiary-container hover:bg-surface-container dark:hover:bg-[#1b1c1c] transition-all rounded-lg cursor-pointer hover:text-on-surface dark:hover:text-tertiary-fixed"
                  onClick={() => onSelectQuery(item.query)}
                >
                  <span className="material-symbols-outlined text-primary/60 dark:text-secondary/60 text-[14px]">terminal</span>
                  <span className="flex-1 truncate text-[10px] font-medium normal-case">{item.query}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                    className={`p-1 transition-all ${item.isFavorite ? 'text-secondary dark:text-secondary-fixed opacity-100' : 'opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-secondary'}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">{item.isFavorite ? 'star' : 'star_border'}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-3 pt-4 border-t border-outline-variant dark:border-[#2f3131]">
          <div className="flex flex-col gap-0.5">
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant dark:text-on-tertiary-container hover:bg-surface-container dark:hover:bg-[#1b1c1c] transition-all rounded-lg cursor-pointer text-[11px]">
              <span className="material-symbols-outlined text-[18px]">description</span>
              Documentation
            </a>
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant dark:text-on-tertiary-container hover:bg-surface-container dark:hover:bg-[#1b1c1c] transition-all rounded-lg cursor-pointer text-[11px]">
              <span className="material-symbols-outlined text-[18px]">contact_support</span>
              Support
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};
