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
  { label: 'Show top 5 products by price', icon: 'bar_chart', query: 'Show me top 5 products by price as a bar chart' },
  { label: 'Draw database ER diagram', icon: 'account_tree', query: 'Generate an ER diagram for the database tables' },
  { label: 'Summarize customer orders', icon: 'shopping_bag', query: 'Show summary of customer orders with total revenue' },
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

  const handleRetry = (messageId: string) => {
    const assistantIndex = messages.findIndex((m) => m.id === messageId);
    if (assistantIndex <= 0) return;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        onSend(messages[i].content);
        return;
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative flex-1">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {showWelcomeChips && (
          <div className="my-6 p-6 rounded bg-surface-container border border-outline-variant text-center max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <h2 className="text-headline-md font-bold text-on-surface">Welcome to QueryMind AI</h2>
            <p className="text-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">
              Ask natural language questions to inspect tables, run validated SQL, and stream interactive charts and diagrams.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSend(prompt.query)}
                    className="p-3 rounded bg-surface-container-low border border-outline-variant hover:border-primary hover:bg-surface-container-highest text-label-md font-label-md text-on-surface-variant hover:text-on-surface transition-all flex flex-col justify-between gap-2 group"
                  >
                    <span className="material-symbols-outlined text-primary">{prompt.icon}</span>
                    <span>{prompt.label}</span>
                  </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRetry={msg.role === 'assistant' && msg.error ? () => handleRetry(msg.id) : undefined}
          />
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
