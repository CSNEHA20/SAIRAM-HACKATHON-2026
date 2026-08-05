import React, { useEffect, useState } from 'react';
import { useChat } from './hooks/useChat';
import { ChatContainer } from './components/chat/ChatContainer';
import { Database, Cpu, Activity, DatabaseZap, Table2, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { messages, status, activeTool, sendMessage, stopStreaming } = useChat('main-session');
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', database: 'disconnected' }));
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 px-4 md:px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <DatabaseZap className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              DataFlow AI
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">Conversational Database Analytics</p>
          </div>
        </div>

        {/* System Health Badge */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            {health?.database === 'connected' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span className="text-slate-300">SQLite:</span>
            <span className={health?.database === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {health?.database || 'checking...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">FastAPI:</span>
            <span className="text-cyan-400 font-semibold">:8000</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Skeleton (Query History / Navigation) */}
        <aside className="hidden lg:flex w-64 border-r border-slate-800/80 bg-slate-950/60 p-4 flex-col gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Workspace</span>
          </div>

          <div className="flex-1 rounded-xl glass-panel p-3 border border-slate-800/80 space-y-2">
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>ecommerce.sqlite</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-200 font-mono">5 tables</span>
            </div>

            <div className="pt-2 text-xs text-slate-500">
              <p className="font-semibold text-slate-400 mb-1 font-mono">Sample Tables:</p>
              <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Table2 className="w-3 h-3 text-cyan-500" /> customers (5 rows)
                </li>
                <li className="flex items-center gap-1.5">
                  <Table2 className="w-3 h-3 text-cyan-500" /> products (6 rows)
                </li>
                <li className="flex items-center gap-1.5">
                  <Table2 className="w-3 h-3 text-cyan-500" /> orders (6 rows)
                </li>
                <li className="flex items-center gap-1.5">
                  <Table2 className="w-3 h-3 text-cyan-500" /> order_items (9 rows)
                </li>
                <li className="flex items-center gap-1.5">
                  <Table2 className="w-3 h-3 text-cyan-500" /> inventory (7 rows)
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Center Main Chat Column */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/40">
          <ChatContainer
            messages={messages}
            status={status}
            activeTool={activeTool}
            onSend={sendMessage}
            onStop={stopStreaming}
          />
        </main>

        {/* Right Inspection Column Skeleton */}
        <aside className="hidden xl:flex w-72 border-l border-slate-800/80 bg-slate-950/60 p-4 flex-col gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Live Inspector</span>
          </div>

          <div className="flex-1 rounded-xl glass-panel p-4 border border-slate-800/80 text-xs text-slate-400 space-y-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">Stream Status:</span>
              <span className="font-semibold text-cyan-400 capitalize text-sm">{status}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-mono text-[11px]">Active Tool:</span>
              <span className="font-semibold text-emerald-400 font-mono">{activeTool || 'None (Idle)'}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] leading-relaxed text-slate-400">
              <p className="font-semibold text-slate-300 mb-1 font-mono">CP1 Milestone Active:</p>
              <p>FastAPI backend stream emitting 8 frozen SSE event contract types over POST /api/chat.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
