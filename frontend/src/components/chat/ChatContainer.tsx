import React, { useEffect, useRef } from 'react';
import { IMessage } from '../../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';

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
    <section className="flex-1 flex flex-col border-r border-outline-variant dark:border-[#2f3131] bg-surface dark:bg-[#0d0d0d] overflow-hidden transition-colors duration-300">
      <div className="px-lg py-md border-b border-outline-variant dark:border-[#2f3131] flex justify-between items-center bg-surface/80 dark:bg-[#0d0d0d]/80 backdrop-blur-sm z-10 transition-colors duration-300">
        <h1 className="font-headline-lg text-headline-lg text-primary dark:text-tertiary-fixed">Session: Analysis Workspace</h1>
        <div className="flex gap-sm">
          <span className="font-label-md text-label-md bg-surface-container-low dark:bg-[#1b1c1c] text-on-surface-variant dark:text-on-tertiary-container px-sm py-unit rounded border border-outline-variant dark:border-[#2f3131]">
            MODEL: CLAUDE
          </span>
          <span className={`font-label-md text-label-md px-sm py-unit rounded border flex items-center gap-xs ${isBusy ? 'bg-secondary-container/20 dark:bg-secondary-container/10 text-secondary dark:text-secondary-fixed border-secondary/30' : 'bg-surface-container-high dark:bg-[#1b1c1c] text-on-surface-variant dark:text-on-tertiary-container border-outline-variant dark:border-[#2f3131]'}`}>
            <span className="material-symbols-outlined text-[14px]">bolt</span> {isBusy ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-lg lg:px-xxl space-y-xl pb-32 custom-scrollbar">
        {showWelcomeChips && (
          <div className="my-6 p-6 rounded border border-outline-variant dark:border-[#2f3131] text-center max-w-xl mx-auto shadow-sm bg-surface-container-low dark:bg-[#111111] transition-colors">
            <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant dark:border-[#2f3131] flex items-center justify-center text-primary mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <h2 className="text-headline-md font-bold text-on-surface dark:text-tertiary-fixed">Welcome to QueryMind AI</h2>
            <p className="text-body-sm text-on-surface-variant dark:text-on-tertiary-container mt-1 max-w-md mx-auto">
              Ask natural language questions to inspect tables, run validated SQL, and stream interactive charts and diagrams.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSend(prompt.query)}
                    className="p-3 rounded bg-surface-container-high dark:bg-[#1b1c1c] border border-outline-variant dark:border-[#2f3131] hover:border-primary hover:bg-surface-container-highest dark:hover:bg-[#252626] text-label-md font-label-md text-on-surface-variant dark:text-on-tertiary-container hover:text-on-surface dark:hover:text-tertiary-fixed transition-all flex flex-col justify-between gap-2 group"
                  >
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed">{prompt.icon}</span>
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
          <div className="max-w-3xl mr-auto">
            <TypingIndicator activeTool={activeTool} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={onSend}
        onStop={onStop}
        disabled={isBusy}
        status={status}
      />
    </section>
  );
};
