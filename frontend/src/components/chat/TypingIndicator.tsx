import React from 'react';
import { Terminal, Loader2 } from 'lucide-react';

interface TypingIndicatorProps {
  activeTool?: string | null;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ activeTool }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass-bubble-assistant max-w-fit animate-pulse-subtle">
      <div className="flex items-center gap-1.5 text-cyan-400">
        {activeTool ? (
          <Terminal className="w-4 h-4 animate-bounce" />
        ) : (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
      </div>
      <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
        {activeTool ? (
          <>
            <span>Executing tool:</span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-semibold">
              {activeTool}
            </span>
          </>
        ) : (
          <span>Analyzing data & generating stream...</span>
        )}
      </div>
    </div>
  );
};
