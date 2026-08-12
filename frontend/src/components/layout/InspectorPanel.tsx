import React, { useState } from 'react';
import { SchemaPanel } from '../schema/SchemaPanel';
import { useDashboard } from '../../hooks/useDashboard';
import { ChartRenderer } from '../charts/ChartRenderer';
import { DiagramRenderer } from '../diagrams/DiagramRenderer';

interface InspectorPanelProps {
  status: string;
  activeTool: string | null;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ status, activeTool }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'dashboard'>('schema');
  const { pinnedItems, unpinItem, clearDashboard } = useDashboard();
  
  const isBusy = status === 'connecting' || status === 'streaming';

  return (
    <aside className="hidden xl:flex w-80 bg-surface dark:bg-[#0d0d0d] border-l border-outline-variant dark:border-[#2f3131] flex-col overflow-y-auto transition-colors duration-300 custom-scrollbar">
      <div className="p-md border-b border-outline-variant dark:border-[#2f3131] sticky top-0 bg-surface/90 dark:bg-[#0d0d0d]/90 backdrop-blur z-10 transition-colors duration-300">
        <h3 className="font-headline-lg text-lg text-primary dark:text-on-tertiary-container flex items-center gap-sm">
          <span className="material-symbols-outlined text-[16px]">speed</span> System Telemetry
        </h3>
      </div>
      
      {/* Header Tabs */}
      <div className="flex bg-surface-container-low dark:bg-[#111111] border-b border-outline-variant dark:border-[#2f3131]">
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex-1 py-2 px-3 text-label-md font-label-md uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'schema'
              ? 'border-primary dark:border-primary-fixed text-primary dark:text-primary-fixed bg-surface-container-highest dark:bg-[#1b1c1c]'
              : 'border-transparent text-on-surface-variant dark:text-on-tertiary-container hover:text-on-surface dark:hover:text-tertiary-fixed'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">database</span>
          <span>Schema</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 px-3 text-label-md font-label-md uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-primary dark:border-primary-fixed text-primary dark:text-primary-fixed bg-surface-container-highest dark:bg-[#1b1c1c]'
              : 'border-transparent text-on-surface-variant dark:text-on-tertiary-container hover:text-on-surface dark:hover:text-tertiary-fixed'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">dashboard</span>
          <span>Dashboard</span>
          {pinnedItems.length > 0 && (
            <span className="ml-1 bg-primary dark:bg-primary-fixed text-on-primary dark:text-on-primary-fixed text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pinnedItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-md flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Tab Content */}
        <div className="h-full flex flex-col min-h-0 pb-4">
          {activeTab === 'schema' ? (
            <div className="flex-1 min-h-[300px] flex flex-col">
              <h4 className="font-headline-lg text-lg text-primary dark:text-on-tertiary-container mb-md">Active Schema Context</h4>
              <div className="flex-1 border border-outline-variant dark:border-[#2f3131] rounded bg-surface-container-lowest dark:bg-[#111111] overflow-hidden shadow-sm">
                <SchemaPanel />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[300px] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-label-sm uppercase tracking-wider text-primary dark:text-on-tertiary-container font-semibold">
                  PINNED VISUALIZATIONS
                </span>
                {pinnedItems.length > 0 && (
                  <button
                    onClick={clearDashboard}
                    className="text-label-caps text-error hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
                {pinnedItems.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-outline-variant dark:border-[#2f3131] rounded-lg bg-surface-container-lowest dark:bg-[#111111] text-on-surface-variant dark:text-on-tertiary-container text-body-sm">
                    <span className="material-symbols-outlined text-[24px] mb-2 opacity-50 block">push_pin</span>
                    <p className="font-medium mb-1 text-on-surface dark:text-tertiary-fixed">No Pinned Visualizations</p>
                    <p className="text-label-sm">
                      Click the pin icon on any generated chart or diagram to save it here.
                    </p>
                  </div>
                ) : (
                  pinnedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-surface-container-lowest dark:bg-[#111111] border border-outline-variant dark:border-[#2f3131] shadow-sm relative group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-label-md font-semibold text-primary dark:text-tertiary-fixed truncate max-w-[200px]">
                          {item.title}
                        </span>
                        <button
                          onClick={() => unpinItem(item.id)}
                          className="p-1 rounded text-on-surface-variant hover:text-error transition-colors"
                          title="Unpin from dashboard"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                      <div className="overflow-hidden bg-[#121212] p-2 rounded">
                        {item.type === 'chart' ? (
                          <ChartRenderer chart={item.data as any} />
                        ) : (
                          <DiagramRenderer diagram={item.data as any} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
