import React, { useState } from 'react';

interface TopAppBarProps {
  health?: { status: string; database: string } | null;
  rightActions?: React.ReactNode;
  onOpenDataset?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ health, rightActions, onOpenDataset }) => {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('dataflow_theme') !== 'light';
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      localStorage.setItem('dataflow_theme', nextDark ? 'dark' : 'light');
      if (nextDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore storage error
    }
  };

  const isConnected = health?.database === 'connected';

  return (
    <header className="bg-background dark:bg-[#0d0d0d] border-b border-outline-variant dark:border-[#2f3131] z-50 transition-colors duration-300 sticky top-0">
      <div className="flex items-center w-full px-4 md:px-6 h-16 gap-3">

        {/* Left — Brand */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-secondary/20 flex items-center justify-center border border-primary/20 dark:border-secondary/30">
            <span className="material-symbols-outlined text-primary dark:text-secondary-fixed text-[18px]">schema</span>
          </div>
          <span className="font-bold text-base text-primary dark:text-primary-fixed tracking-tight whitespace-nowrap">QueryMind</span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary-fixed border border-secondary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary dark:bg-secondary-fixed animate-pulse"></span>
            ANALYTICS AI
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Right — Controls */}
        <div className="flex items-center gap-2 min-w-fit">

          {/* Dataset Upload Button */}
          <button
            onClick={onOpenDataset}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low dark:bg-[#1b1c1c] border border-outline-variant dark:border-[#2f3131] text-on-surface-variant dark:text-on-tertiary-container hover:text-primary dark:hover:text-secondary-fixed hover:border-primary/50 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">dataset</span>
            DATASET
          </button>

          {/* DB Connection Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${isConnected ? 'bg-secondary/10 dark:bg-secondary/20 border-secondary/30 text-secondary dark:text-secondary-fixed' : 'bg-error-container/10 border-error/30 text-error dark:text-error'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-secondary dark:bg-secondary-fixed' : 'bg-error'}`}></span>
            {isConnected ? 'SQLite: CONNECTED' : 'DB: OFFLINE'}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors cursor-pointer flex items-center justify-center p-2 rounded-lg hover:bg-surface-container dark:hover:bg-[#1b1c1c]"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Settings */}
          <button className="text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors cursor-pointer flex items-center justify-center p-2 rounded-lg hover:bg-surface-container dark:hover:bg-[#1b1c1c]">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>

          {/* Auth (LoginModal) */}
          {rightActions}

          {/* Avatar */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/80 to-secondary/80 dark:from-primary-fixed/80 dark:to-secondary-fixed/80 flex items-center justify-center text-white dark:text-on-primary font-bold text-xs border border-primary/30 cursor-pointer">
            DA
          </div>
        </div>
      </div>
    </header>
  );
};
