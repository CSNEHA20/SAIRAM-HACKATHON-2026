import React from 'react';

interface TopAppBarProps {
  health?: { status: string; database: string } | null;
  rightActions?: React.ReactNode;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ health, rightActions }) => {
  return (
    <header className="bg-surface dark:bg-surface border-b border-outline-variant w-full top-0 z-50 shrink-0">
      <div className="flex justify-between items-center w-full px-margin-desktop py-md max-w-container-max mx-auto h-16">
        <div className="flex items-center gap-4">
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">QueryMind</span>
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-6">
          <div className="hidden md:flex items-center bg-surface-container-low border border-surface-container-high rounded px-3 py-1 h-[40px]">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2" data-icon="search">search</span>
            <input 
              className="bg-transparent border-none font-label-md text-on-surface focus:outline-none focus:ring-0 placeholder-on-surface-variant w-48" 
              placeholder="Global Search..." 
              type="text"
            />
            <div className="border border-outline-variant rounded px-1 ml-2 text-[10px] text-on-surface-variant">⌘K</div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* System Health Integration */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-surface-container-low border border-outline-variant h-[40px]">
              <span className="material-symbols-outlined text-sm text-primary">database</span>
              <span className="font-label-md text-on-surface-variant">SQLite:</span>
              <span className={`font-label-md ${health?.database === 'connected' ? 'text-secondary' : 'text-primary'}`}>
                {health?.database || 'checking...'}
              </span>
            </div>

            {rightActions}
            <button className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined" data-icon="bolt">bolt</span>
            </button>
            <button className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded cursor-pointer active:opacity-80 relative">
              <span className="material-symbols-outlined" data-icon="sensors">sensors</span>
              {health?.database !== 'connected' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error-container border border-surface"></span>
              )}
            </button>
            <div className="h-8 w-8 rounded bg-surface-container-high border border-outline-variant overflow-hidden ml-2 cursor-pointer">
              <div className="w-full h-full bg-primary flex items-center justify-center text-on-primary font-bold">
                DA
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
