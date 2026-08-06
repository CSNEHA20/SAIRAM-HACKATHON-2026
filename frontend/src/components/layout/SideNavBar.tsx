import React from 'react';

interface SideNavBarProps {
  history: any[];
  onSelectQuery: (q: string) => void;
  onRemoveQuery: (id: string) => void;
  onClearHistory: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ history, onSelectQuery, onRemoveQuery, onClearHistory }) => {
  return (
    <nav className="hidden md:flex flex-col bg-surface-container-low dark:bg-surface-container-low border-r border-outline-variant w-64 h-full flex-shrink-0">
      <div className="p-md border-b border-surface-container-high mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center border border-outline-variant">
            <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></div>
          </div>
          <div>
            <div className="font-label-md text-on-surface">QUERYMIND-STATION</div>
            <div className="font-label-sm text-primary tracking-widest mt-1 uppercase">CLEARANCE: OMEGA-7</div>
          </div>
        </div>
      </div>
      
      <div className="px-md mb-6">
        <button 
          onClick={() => onSelectQuery('')} // Just an example for 'new query'
          className="w-full bg-primary-container text-on-primary-container font-label-md h-[48px] rounded flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_0_8px_rgba(211,84,0,0.2)]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>NEW_QUERY</span>
        </button>
      </div>
      
      <div className="px-md mb-2 flex justify-between items-center">
        <div className="font-label-sm text-on-surface-variant uppercase tracking-widest">Query History</div>
        {history.length > 0 && (
          <button 
            onClick={onClearHistory}
            className="text-on-surface-variant hover:text-primary transition-colors text-xs font-label-md"
            title="Clear History"
          >
            CLEAR
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-md space-y-1 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant font-label-sm">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-50 block">history</span>
            NO_PREVIOUS_QUERIES
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 p-2 rounded hover:bg-surface-container-high cursor-pointer transition-colors border border-transparent hover:border-outline-variant"
              onClick={() => onSelectQuery(item.query)}
            >
              <span className="material-symbols-outlined text-on-surface-variant text-sm">terminal</span>
              <span className="flex-1 truncate text-on-surface font-label-sm">{item.query}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveQuery(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))
        )}
      </div>
    </nav>
  );
};
