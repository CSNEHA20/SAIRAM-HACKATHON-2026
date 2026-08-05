import React, { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSend(prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-800/60 hover:bg-cyan-950/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'DataFlow AI is generating stream...' : 'Ask a database question (e.g. "Show revenue trends")...'}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {status === 'streaming' || status === 'connecting' ? (
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
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        )}
      </form>
    </div>
  );
};
