import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { IMessage } from '../../types';
import { Bot, User, Code2, ChevronDown, ChevronUp, Copy, Check, AlertCircle } from 'lucide-react';
import { ChartRenderer } from '../charts/ChartRenderer';
import { DiagramRenderer } from '../diagrams/DiagramRenderer';
import { ExportButton } from './ExportButton';

interface MessageBubbleProps {
  message: IMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showSql, setShowSql] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

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
      <div
        ref={bubbleRef}
        className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
          isUser ? 'glass-bubble-user text-slate-100' : 'glass-bubble-assistant text-slate-200'
        }`}
      >
        {/* SQL Transparency Badge */}
        {message.sql_used && message.sql_used.length > 0 && (
          <div className="mb-3 border-b border-slate-800/80 pb-2.5">
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

        {/* Charts */}
        {message.charts && message.charts.length > 0 && (
          <div className="space-y-3">
            {message.charts.map((chart, idx) => (
              <ChartRenderer key={idx} chart={chart} />
            ))}
          </div>
        )}

        {/* Diagrams */}
        {message.diagrams && message.diagrams.length > 0 && (
          <div className="space-y-3">
            {message.diagrams.map((diag, idx) => (
              <DiagramRenderer key={idx} diagram={diag} />
            ))}
          </div>
        )}

        {/* Markdown Content */}
        <div className="markdown-content font-normal text-slate-200">
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse rounded-sm align-middle" />
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

        {/* Export Options */}
        {!isUser && !message.isStreaming && (
          <ExportButton sqlUsed={message.sql_used} containerRef={bubbleRef} />
        )}

        {/* Timestamp */}
        <div className={`mt-2 text-[10px] text-slate-500 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
