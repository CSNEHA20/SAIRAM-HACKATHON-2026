import React, { useState } from 'react';
import { IMessage } from '../../types';
import { Bot, User, Code2, ChevronDown, ChevronUp, Copy, Check, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: IMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showSql, setShowSql] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-slate-800 border border-slate-700 text-cyan-400'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
        isUser ? 'glass-bubble-user text-slate-100' : 'glass-bubble-assistant text-slate-200'
      }`}>

        {/* Message Content */}
        <div className="whitespace-pre-wrap font-normal">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse rounded-sm vertical-middle" />
          )}
        </div>

        {/* Error Callout */}
        {message.error && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Execution Error</p>
              <p className="mt-0.5 opacity-90">{message.error}</p>
            </div>
          </div>
        )}

        {/* SQL Transparency Badge (08_APIArchitecture.md & 17_DeveloperB.md §3) */}
        {message.sql_used && message.sql_used.length > 0 && (
          <div className="mt-3.5 border-t border-slate-800/80 pt-2.5">
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center justify-between w-full text-xs font-mono text-cyan-400 hover:text-cyan-300 py-1 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <Code2 className="w-3.5 h-3.5" />
                <span>SQL Executed ({message.sql_used.length})</span>
              </span>
              {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSql && (
              <div className="mt-2 space-y-2">
                {message.sql_used.map((sql, idx) => (
                  <div key={idx} className="relative group rounded-lg bg-slate-950 p-3 border border-slate-800 font-mono text-xs text-emerald-400">
                    <pre className="overflow-x-auto whitespace-pre-wrap pr-8">{sql}</pre>
                    <button
                      onClick={() => handleCopySql(sql)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy SQL"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-2 text-[10px] text-slate-500 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
