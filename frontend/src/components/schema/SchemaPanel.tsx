import React, { useEffect, useState } from 'react';
import { authenticatedFetch } from '../../services/api';
import { SchemaTable, SchemaColumn, SchemaForeignKey } from '../../types';

export const SchemaPanel: React.FC = () => {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch('/api/schema');
      if (!res.ok) throw new Error('Failed to fetch schema');
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error('Schema panel fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest dark:bg-[#0d0d0d] transition-colors duration-300">
      <div className="flex items-center justify-between p-3 border-b border-outline-variant dark:border-[#2f3131] bg-surface-container-low dark:bg-[#161616] transition-colors">
        <div className="flex items-center gap-2 text-label-md font-label-md text-primary dark:text-secondary-fixed uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">schema</span>
          <span>Schema Preview</span>
        </div>
        <button
          onClick={fetchSchema}
          disabled={loading}
          className="p-1 rounded bg-surface-container dark:bg-[#1b1c1c] border border-outline-variant dark:border-[#2f3131] text-on-surface-variant dark:text-on-tertiary-container hover:text-primary dark:hover:text-secondary-fixed transition-colors cursor-pointer"
          title="Refresh schema"
        >
          <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {tables.length === 0 ? (
          <p className="text-label-sm text-on-surface-variant dark:text-on-tertiary-container font-label-sm italic p-2 text-center">
            {loading ? 'Loading schema...' : 'No tables available'}
          </p>
        ) : (
          tables.map((table) => {
            const isExpanded = expandedTable === table.name;
            return (
              <div
                key={table.name}
                className="rounded-lg bg-surface-container dark:bg-[#161616] border border-outline-variant dark:border-[#2f3131] overflow-hidden transition-colors"
              >
                <div
                  onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-container-high dark:hover:bg-[#252626] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary dark:text-secondary-fixed shrink-0">table</span>
                    <span className="font-label-md text-label-md text-on-surface dark:text-tertiary-fixed">{table.name}</span>
                  </div>
                  <span className="text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest dark:bg-[#2c2c2c] text-on-surface-variant dark:text-on-tertiary-container font-label-caps tracking-widest">
                    {table.row_count} ROWS
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-2.5 pt-0 border-t border-outline-variant dark:border-[#2f3131] bg-surface-container-lowest dark:bg-[#111] text-label-sm font-label-md space-y-2">
                    <div className="text-label-caps text-on-surface-variant dark:text-on-tertiary-container uppercase tracking-widest mt-2">Columns</div>
                    <div className="space-y-1 pl-1">
                      {table.columns.map((col: SchemaColumn) => (
                        <div key={col.name} className="flex items-center justify-between text-on-surface dark:text-[#e2e2e2]">
                          <span className="flex items-center gap-1">
                            {col.pk && <span className="material-symbols-outlined text-xs text-primary dark:text-secondary-fixed shrink-0">key</span>}
                            <span>{col.name}</span>
                          </span>
                          <span className="text-on-surface-variant dark:text-on-tertiary-container text-label-sm">{col.type}</span>
                        </div>
                      ))}
                    </div>

                    {table.foreign_keys && table.foreign_keys.length > 0 && (
                      <>
                        <div className="text-label-caps text-on-surface-variant dark:text-on-tertiary-container uppercase tracking-widest pt-2">Relationships</div>
                        <div className="space-y-1 pl-1 text-label-sm text-secondary dark:text-secondary-fixed">
                          {table.foreign_keys.map((fk: SchemaForeignKey, idx: number) => (
                            <div key={idx} className="truncate">
                              {fk.from_column || fk.from} → {fk.target_table || fk.table}({fk.target_column || fk.to})
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
