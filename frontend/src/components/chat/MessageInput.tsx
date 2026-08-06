import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  disabled: boolean;
  status: string;
}

const QUICK_PROMPTS = [
  'Show top 5 products by revenue this quarter',
  'What is our order status breakdown?',
  'List customers from Mumbai with their total spend',
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onStop,
  disabled,
  status,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to content (1-5 rows)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(Math.max(el.scrollHeight, 48), 120);
    el.style.height = `${newHeight}px`;
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isBusy = status === 'streaming' || status === 'connecting';

  return (
    <div className="p-4 border-t border-outline-variant bg-surface-container/90 backdrop-blur-md">
      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSend(prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-label-md font-label-md bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-primary/40 hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? 'DataFlow AI is generating stream...' : 'Ask a database question (e.g. "Show revenue trends")...'}
          className="flex-1 min-h-[48px] max-h-[120px] bg-surface-container-low border border-outline-variant rounded px-4 py-3 text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-none custom-scrollbar"
        />

        {isBusy ? (
          <button
            type="button"
            onClick={onStop}
            className="px-4 py-3 rounded bg-error/80 hover:bg-error text-on-error font-medium text-body-sm flex items-center gap-2 transition-colors shadow-sm"
            title="Stop generation"
          >
            <span className="material-symbols-outlined text-sm font-bold">stop</span>
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="px-5 py-3 rounded bg-primary hover:bg-primary-fixed text-on-primary font-bold font-label-md tracking-wider uppercase text-label-md flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm font-bold">send</span>
            <span className="hidden sm:inline">Send</span>
          </button>
        )}
      </form>
    </div>
  );
};
