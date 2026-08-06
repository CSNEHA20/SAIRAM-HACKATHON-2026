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
    <div className="flex flex-col h-full bg-[#0f0f13]/40 relative">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {showWelcomeChips && (
          <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-[#1a1a24] to-[#0f0f13] border border-[#2a2a3a] text-center max-w-xl mx-auto shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#f1f0ff]">Welcome to DataFlow AI</h2>
            <p className="text-xs text-[#8b8ba7] mt-1 max-w-md mx-auto">
              Ask natural language questions to inspect tables, run validated SQL, and stream interactive charts and Mermaid diagrams.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              {EXAMPLE_PROMPTS.map((prompt, idx) => {
                const IconComponent = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSend(prompt.query)}
                    className="p-3 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] hover:border-indigo-500/50 hover:bg-[#1a1a24]/80 text-xs text-[#8b8ba7] hover:text-[#f1f0ff] transition-all flex flex-col justify-between gap-2 group"
                  >
                    <IconComponent className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
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
