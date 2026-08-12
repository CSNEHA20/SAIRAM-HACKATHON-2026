import React from 'react';

interface TypingIndicatorProps {
  activeTool?: string | null;
}

const TOOL_LABELS: Record<string, string> = {
  get_schema: 'Reading schema…',
  execute_query: 'Running query…',
  generate_chart: 'Building chart…',
  generate_flowchart: 'Drawing diagram…',
  explain_data: 'Computing insights…',
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ activeTool }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded bg-surface-container border border-surface-container-high border-l-2 border-l-secondary text-on-surface shadow-sm max-w-fit animate-pulse-subtle">
      <div className="flex items-center gap-1.5 text-primary">
        {activeTool ? (
          <span className="material-symbols-outlined text-sm animate-bounce">terminal</span>
        ) : (
          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
        )}
      </div>
      <div className="text-label-md font-label-md text-on-surface-variant flex items-center gap-2">
        {activeTool ? (
          <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-secondary font-bold">
            {TOOL_LABELS[activeTool] || `Executing tool: ${activeTool}`}
          </span>
        ) : (
          <span>Analyzing data & generating stream...</span>
        )}
      </div>
    </div>
  );
};
