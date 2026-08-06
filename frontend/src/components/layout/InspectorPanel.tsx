import React from 'react';
import { SchemaPanel } from '../schema/SchemaPanel';

interface InspectorPanelProps {
  status: string;
  activeTool: string | null;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ status, activeTool }) => {
  return (
    <aside className="hidden xl:flex flex-col bg-surface border-l border-outline-variant w-80 h-full flex-shrink-0">
      <div className="px-md py-sm border-b border-surface-container-high flex justify-between items-center bg-surface-container-low">
        <div className="font-label-sm uppercase tracking-widest text-on-surface-variant">INSPECTOR</div>
        <button className="text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined text-sm">more_horiz</span>
        </button>
      </div>

      <div className="p-md flex-1 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
        {/* Stream Status Inspector */}
        <div className="bg-surface-container-low border border-outline-variant rounded p-3 text-xs space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-label-md text-primary uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">activity_zone</span>
            <span>Agent Status</span>
          </div>
          <div className="flex items-center justify-between font-label-md border-b border-outline-variant pb-2">
            <span className="text-on-surface-variant">Status:</span>
            <span className="font-semibold text-primary capitalize flex items-center gap-1">
              {status === 'streaming' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>}
              {status}
            </span>
          </div>
          <div className="flex items-center justify-between font-label-md">
            <span className="text-on-surface-variant">Active Tool:</span>
            <span className="font-semibold text-secondary font-label-md">{activeTool || 'None'}</span>
          </div>
        </div>

        {/* Schema Explorer */}
        <div className="flex-1 min-h-0 flex flex-col border border-outline-variant rounded bg-surface-container-lowest overflow-hidden shadow-sm">
          <SchemaPanel />
        </div>
      </div>
    </aside>
  );
};
