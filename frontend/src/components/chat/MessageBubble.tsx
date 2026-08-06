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
  // Track the first chart container for PNG export
  const firstChartRef = useRef<HTMLDivElement>(null);

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-surface-container-high border border-outline-variant text-on-surface'
            : 'bg-primary-container text-on-primary-container'
        }`}
      >
        {isUser ? (
          <span className="material-symbols-outlined text-sm">person</span>
        ) : (
          <span className="material-symbols-outlined text-sm">smart_toy</span>
        )}
      </div>

      {/* Bubble Container */}
      <div
        ref={bubbleRef}
        className={`max-w-[90%] md:max-w-[80%] rounded p-4 text-body-md leading-relaxed ${
          isUser 
            ? 'bg-transparent border border-outline-variant text-on-surface-variant' 
            : 'bg-surface-container border border-surface-container-high border-l-2 border-l-secondary text-on-surface shadow-sm'
        }`}
      >
        {/* SQL Transparency Badge */}
        {message.sql_used && message.sql_used.length > 0 && (
          <div className="mb-3 border-b border-outline-variant pb-2.5">
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center justify-between w-full text-label-md font-label-md text-primary hover:text-primary-fixed transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">database</span>
                <span>SQL Executed ({message.sql_used.length})</span>
              </span>
              <span className="material-symbols-outlined text-sm">{showSql ? 'expand_less' : 'expand_more'}</span>
            </button>

            {showSql && (
              <div className="mt-2 space-y-2">
                {message.sql_used.map((sql, idx) => (
                  <div key={idx} className="relative group rounded bg-surface-container-lowest p-3 border border-outline-variant font-label-md text-secondary">
                    <pre className="overflow-x-auto whitespace-pre-wrap pr-8">{sql}</pre>
                    <button
                      onClick={() => handleCopySql(sql)}
                      className="absolute top-2 right-2 p-1.5 rounded bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
                      title="Copy SQL"
                    >
                      {copied ? <span className="material-symbols-outlined text-sm text-secondary">check</span> : <span className="material-symbols-outlined text-sm">content_copy</span>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Charts */}
        {message.charts && message.charts.length > 0 && (
          <div className="space-y-3 mt-3">
            {message.charts.map((chart, idx) => (
              <div key={idx} ref={idx === 0 ? firstChartRef : undefined} className="bg-surface-container-lowest p-2 rounded border border-outline-variant">
                <ChartRenderer chart={chart} />
              </div>
            ))}
          </div>
        )}

        {/* Diagrams */}
        {message.diagrams && message.diagrams.length > 0 && (
          <div className="space-y-3 mt-3">
            {message.diagrams.map((diag, idx) => (
              <DiagramRenderer key={idx} diagram={diag} />
            ))}
          </div>
        )}

        {/* Markdown Content */}
        <div className="markdown-content font-normal mt-2">
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm align-middle" />
          )}
        </div>

        {/* Error Callout */}
        {message.error && (
          <div className="mt-3 p-3 rounded bg-error-container/20 border border-error-container text-error text-body-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">error</span>
            <div>
              <p className="font-bold font-label-md tracking-wider uppercase">Execution Error</p>
              <p className="mt-0.5 opacity-90">{message.error}</p>
            </div>
          </div>
        )}

        {/* Export Options */}
        {!isUser && !message.isStreaming && (
          <div className="mt-3 pt-3 border-t border-outline-variant flex justify-between items-center">
             <div className={`text-label-sm text-on-surface-variant font-label-sm ${isUser ? 'text-right' : 'text-left'}`}>
               {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
             <ExportButton sqlUsed={message.sql_used} chartContainerRef={firstChartRef} />
          </div>
        )}
        
        {isUser && (
           <div className={`mt-2 text-label-sm text-on-surface-variant font-label-sm text-right`}>
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </div>
        )}
      </div>
    </div>
  );
};
