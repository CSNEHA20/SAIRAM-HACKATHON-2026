import React, { useEffect, useState } from 'react';
import { Database, Table2, Key, RefreshCw, Layers } from 'lucide-react';
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
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Schema Preview</span>
        </div>
        <button
          onClick={fetchSchema}
          disabled={loading}
          className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh schema"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {tables.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono italic">
            {loading ? 'Loading schema...' : 'No tables available'}
          </p>
        ) : (
          tables.map((table) => {
            const isExpanded = expandedTable === table.name;
            return (
              <div
                key={table.name}
                className="rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-hidden transition-colors"
              >
                <div
                  onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-mono text-xs font-semibold text-slate-200">{table.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">
                    {table.row_count} rows
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-2.5 pt-0 border-t border-slate-800/60 bg-slate-950/50 text-[11px] font-mono space-y-1.5">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Columns:</div>
                    <div className="space-y-1 pl-1">
                      {table.columns.map((col: SchemaColumn) => (
                        <div key={col.name} className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1">
                            {col.pk && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span>{col.name}</span>
                          </span>
                          <span className="text-slate-500 text-[10px]">{col.type}</span>
                        </div>
                      ))}
                    </div>

                    {table.foreign_keys && table.foreign_keys.length > 0 && (
                      <>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase pt-1">Relationships:</div>
                        <div className="space-y-1 pl-1 text-[10px] text-cyan-400/90">
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
