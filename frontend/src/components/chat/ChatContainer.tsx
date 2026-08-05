import React, { useEffect, useRef } from 'react';
import { IMessage } from '../../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';
import { Sparkles, BarChart2, GitFork, ShoppingBag } from 'lucide-react';

interface ChatContainerProps {
  messages: IMessage[];
  status: string;
  activeTool: string | null;
  onSend: (message: string) => void;
  onStop: () => void;
}

const EXAMPLE_PROMPTS = [
  { label: 'Show top 5 products by price', icon: BarChart2, query: 'Show me top 5 products by price as a bar chart' },
  { label: 'Draw database ER diagram', icon: GitFork, query: 'Generate an ER diagram for the database tables' },
  { label: 'Summarize customer orders', icon: ShoppingBag, query: 'Show summary of customer orders with total revenue' },
];

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  status,
  activeTool,
  onSend,
  onStop,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, activeTool]);

  const isBusy = status === 'connecting' || status === 'streaming';
  const showWelcomeChips = messages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-slate-950/40 relative">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {showWelcomeChips && (
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center max-w-xl mx-auto shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Welcome to DataFlow AI</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Ask natural language questions to inspect tables, run validated SQL, and stream interactive charts and Mermaid diagrams.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              {EXAMPLE_PROMPTS.map((prompt, idx) => {
                const IconComponent = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSend(prompt.query)}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-xs text-slate-300 hover:text-white transition-all flex flex-col justify-between gap-2 group"
                  >
                    <IconComponent className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>{prompt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing / Active Tool Indicator */}
        {isBusy && (
          <div className="my-2">
            <TypingIndicator activeTool={activeTool} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <MessageInput
        onSend={onSend}
        onStop={onStop}
        disabled={isBusy}
        status={status}
      />
    </div>
  );
};
