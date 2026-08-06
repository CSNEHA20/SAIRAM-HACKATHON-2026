import React, { useEffect, useState } from 'react';
import { SchemaTable, SchemaColumn, SchemaForeignKey } from '../../types';

export const SchemaPanel: React.FC = () => {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schema');
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
    <div className="flex flex-col h-full bg-surface-container-lowest">
      <div className="flex items-center justify-between p-3 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-center gap-2 text-label-md font-label-md text-primary uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">schema</span>
          <span>Schema Preview</span>
        </div>
        <button
          onClick={fetchSchema}
          disabled={loading}
          className="p-1 rounded bg-surface-container border border-outline-variant text-on-surface-variant hover:text-primary transition-colors"
          title="Refresh schema"
        >
          <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {tables.length === 0 ? (
          <p className="text-label-sm text-on-surface-variant font-label-sm italic p-2 text-center">
            {loading ? 'Loading schema...' : 'No tables available'}
          </p>
        ) : (
          tables.map((table) => {
            const isExpanded = expandedTable === table.name;
            return (
              <div
                key={table.name}
                className="rounded bg-surface-container border border-outline-variant overflow-hidden transition-colors"
              >
                <div
                  onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary shrink-0">table</span>
                    <span className="font-label-md text-label-md text-on-surface">{table.name}</span>
                  </div>
                  <span className="text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-caps tracking-widest">
                    {table.row_count} ROWS
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-2.5 pt-0 border-t border-outline-variant bg-surface-container-lowest text-label-sm font-label-md space-y-2">
                    <div className="text-label-caps text-on-surface-variant uppercase tracking-widest mt-2">Columns</div>
                    <div className="space-y-1 pl-1">
                      {table.columns.map((col: SchemaColumn) => (
                        <div key={col.name} className="flex items-center justify-between text-on-surface">
                          <span className="flex items-center gap-1">
                            {col.pk && <span className="material-symbols-outlined text-xs text-primary shrink-0">key</span>}
                            <span>{col.name}</span>
                          </span>
                          <span className="text-on-surface-variant text-label-sm">{col.type}</span>
                        </div>
                      ))}
                    </div>

                    {table.foreign_keys && table.foreign_keys.length > 0 && (
                      <>
                        <div className="text-label-caps text-on-surface-variant uppercase tracking-widest pt-2">Relationships</div>
                        <div className="space-y-1 pl-1 text-label-sm text-secondary">
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
