import React, { useState, useRef, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  disabled: boolean;
  status: string;
}

const SUGGESTIONS = [
  { icon: '📊', label: 'Top 5 products by revenue' },
  { icon: '🗺️', label: 'Draw database ER diagram' },
  { icon: '🛒', label: 'Customer order summary' },
  { icon: '📈', label: 'Monthly revenue trend' },
  { icon: '🍩', label: 'Order status donut chart' },
  { icon: '🌊', label: 'Sales area chart by category' },
];

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, onStop, disabled, status }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="mt-auto pb-4 pt-2 px-4 border-t border-outline-variant dark:border-[#2f3131] bg-surface dark:bg-[#0d0d0d] transition-colors duration-300">
      <div className="max-w-4xl mx-auto">

        {/* Horizontal scrollable suggestion chips */}
        <div className="overflow-x-auto shrink-0 whitespace-nowrap mb-3 pb-1 scrollbar-hide">
          <div className="flex gap-2 inline-flex">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => { if (!disabled) { onSend(`${s.label} as a chart`); } }}
                disabled={disabled}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low dark:bg-[#1b1c1c] border border-outline-variant dark:border-[#2f3131] text-[11px] font-semibold text-on-surface-variant dark:text-on-tertiary-container hover:text-primary dark:hover:text-secondary-fixed hover:border-primary/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Integrated pill input bar */}
        <div className="flex items-end gap-3 bg-surface-container-low dark:bg-[#111] border border-outline-variant dark:border-[#2f3131] rounded-2xl px-4 py-3 focus-within:border-primary/60 dark:focus-within:border-secondary/50 transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={status === 'connecting'}
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-on-surface dark:text-tertiary-fixed placeholder-on-surface-variant dark:placeholder-on-tertiary-container resize-none min-h-[24px] max-h-[200px] leading-relaxed"
            placeholder={status === 'connecting' ? 'Connecting to backend...' : 'Ask anything about your data...  (Shift+Enter for new line)'}
          />

          <div className="flex items-center gap-2 pb-0.5 flex-shrink-0">
            {disabled && status === 'streaming' ? (
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-error-container/80 text-error border border-error-container/60 hover:brightness-110 transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                title="Stop Generation"
              >
                <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                Stop
              </button>
            ) : (
              <>
                <button
                  disabled={disabled}
                  className="p-2 text-on-surface-variant dark:text-on-tertiary-container hover:text-secondary dark:hover:text-secondary-fixed transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-surface-container dark:hover:bg-[#1b1c1c]"
                  title="Attach file"
                >
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || disabled}
                  className="p-2.5 bg-primary dark:bg-secondary text-on-primary dark:text-on-secondary-fixed rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-sm cursor-pointer"
                  title="Send message"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-2 font-mono text-[9px] text-on-surface-variant dark:text-on-tertiary-container uppercase tracking-widest">
          QueryMind Engine · Secure Connection · All 14 Chart Types Supported
        </div>
      </div>
    </div>
  );
};
