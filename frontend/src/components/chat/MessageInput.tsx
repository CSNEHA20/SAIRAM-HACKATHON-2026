import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles } from 'lucide-react';

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
    <div className="p-4 border-t border-[#2a2a3a] bg-[#0f0f13]/90 backdrop-blur-md">
      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSend(prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1a1a24] border border-[#2a2a3a] text-[#8b8ba7] hover:text-[#f1f0ff] hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
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
          className="flex-1 min-h-[48px] max-h-[120px] bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-[#f1f0ff] placeholder-[#8b8ba7] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-none overflow-y-auto"
        />

        {isBusy ? (
          <button
            type="button"
            onClick={onStop}
            className="px-4 py-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20"
            title="Stop generation"
          >
            <Square className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        )}
      </form>
    </div>
  );
};
