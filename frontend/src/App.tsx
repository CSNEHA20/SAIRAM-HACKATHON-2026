import React, { useEffect, useState } from 'react';
import { useChat } from './hooks/useChat';
import { useQueryHistory } from './hooks/useQueryHistory';
import { ChatContainer } from './components/chat/ChatContainer';
import { QueryHistory } from './components/sidebar/QueryHistory';
import { SchemaPanel } from './components/schema/SchemaPanel';
import { Cpu, Activity, DatabaseZap, CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { messages, status, activeTool, sendMessage, stopStreaming } = useChat('main-session');
  const { history, addQuery, removeQuery, clearHistory } = useQueryHistory();
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', database: 'disconnected' }));
  }, []);

  const handleSendMessage = (msg: string) => {
    addQuery(msg);
    sendMessage(msg);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f0f13] text-[#f1f0ff] overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-[#2a2a3a] bg-[#0f0f13]/90 px-4 md:px-6 flex items-center justify-between shrink-0 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <DatabaseZap className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-[#f1f0ff] to-indigo-400 bg-clip-text text-transparent">
              DataFlow AI
            </h1>
            <p className="text-[10px] text-[#8b8ba7] font-mono">Conversational Database Analytics</p>
          </div>
        </div>

        {/* System Health Badge */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a24] border border-[#2a2a3a]">
            {health?.database === 'connected' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span className="text-[#8b8ba7]">SQLite:</span>
            <span className={health?.database === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {health?.database || 'checking...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a24] border border-[#2a2a3a]">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[#8b8ba7]">FastAPI:</span>
            <span className="text-indigo-400 font-semibold">:8000</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Query History & Navigation) */}
        <aside className="hidden lg:flex w-64 border-r border-[#2a2a3a] bg-[#0f0f13]/60 p-4 flex-col gap-4 shrink-0">
          <QueryHistory
            history={history}
            onSelectQuery={handleSendMessage}
            onRemoveQuery={removeQuery}
            onClearHistory={clearHistory}
          />
        </aside>

        {/* Center Main Chat Column */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0f0f13]/40">
          <ChatContainer
            messages={messages}
            status={status}
            activeTool={activeTool}
            onSend={handleSendMessage}
            onStop={stopStreaming}
          />
        </main>

        {/* Right Inspection & Schema Panel */}
        <aside className="hidden xl:flex w-72 border-l border-[#2a2a3a] bg-[#0f0f13]/60 p-4 flex-col gap-4 shrink-0 overflow-hidden">
          {/* Stream Status Inspector */}
          <div className="rounded-xl glass-panel p-3 border border-[#2a2a3a] text-xs text-[#8b8ba7] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8b8ba7] uppercase tracking-wider font-mono">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Status</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] pt-1">
              <span className="text-[#8b8ba7]">Status:</span>
              <span className="font-semibold text-indigo-400 capitalize">{status}</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-[#8b8ba7]">Active Tool:</span>
              <span className="font-semibold text-emerald-400 font-mono">{activeTool || 'None'}</span>
            </div>
          </div>

          {/* Schema Explorer */}
          <div className="flex-1 min-h-0">
            <SchemaPanel />
          </div>
        </aside>
      </div>
    </div>
  );
};
