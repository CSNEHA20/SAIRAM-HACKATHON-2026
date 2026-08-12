import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IMessage } from '../../types';
import { ChartRenderer } from '../charts/ChartRenderer';
import { DiagramRenderer } from '../diagrams/DiagramRenderer';
import { ExportButton } from './ExportButton';

interface MessageBubbleProps {
  message: IMessage;
  onRetry?: () => void;
}

const markdownComponents: any = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-outline-variant dark:border-[#2f3131]">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-surface-container-high dark:bg-[#1b1c1c] text-on-surface dark:text-tertiary-fixed uppercase tracking-widest">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-outline-variant/30 dark:divide-[#2f3131]">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-surface-container dark:hover:bg-[#1b1c1c] transition-colors">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-2 text-left font-bold text-[10px] tracking-widest text-on-surface-variant dark:text-on-tertiary-container whitespace-nowrap">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-2 font-mono text-[11px] text-on-surface dark:text-[#e3e2e2] whitespace-nowrap">{children}</td>
  ),
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="bg-surface-container-high dark:bg-[#1b1c1c] px-1.5 py-0.5 rounded text-primary dark:text-secondary-fixed font-mono text-xs">{children}</code>
    ) : (
      <pre className="bg-surface-container-high dark:bg-[#111] rounded-xl p-4 overflow-x-auto border border-outline-variant dark:border-[#2f3131] my-3">
        <code className="font-mono text-xs text-on-surface dark:text-[#e3e2e2]">{children}</code>
      </pre>
    ),
  p: ({ children }: any) => <p className="mb-2 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
  li: ({ children }: any) => <li className="text-on-surface dark:text-[#c8c6c5]">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-lg font-bold text-on-surface dark:text-tertiary-fixed mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-bold text-on-surface dark:text-tertiary-fixed mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-bold text-on-surface dark:text-tertiary-fixed mb-1">{children}</h3>,
  strong: ({ children }: any) => <strong className="font-bold text-on-surface dark:text-tertiary-fixed">{children}</strong>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-primary dark:border-secondary-fixed pl-4 my-2 text-on-surface-variant italic">{children}</blockquote>
  ),
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const [showSql, setShowSql] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const firstChartRef = useRef<HTMLDivElement>(null);

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="max-w-3xl ml-auto mb-6 flex items-end gap-2">
        <div className="flex-1 bg-surface-container-high/90 dark:bg-[#1b1c1c] border border-outline-variant/80 dark:border-[#2f3131] rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-on-surface dark:text-tertiary-fixed leading-relaxed">{message.content}</p>
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-on-surface-variant dark:text-on-tertiary-container font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        {/* User Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/60 to-secondary/60 dark:from-primary-fixed/60 dark:to-secondary-fixed/60 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white dark:text-on-primary text-[16px]">person</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mr-auto mb-6 flex items-start gap-2" ref={bubbleRef}>
      {/* AI Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary/30 to-primary/30 dark:from-secondary/40 dark:to-primary/40 border border-secondary/20 dark:border-secondary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed text-[16px]">psychology</span>
      </div>

      <div className="flex-1 rounded-2xl rounded-tl-sm p-4 bg-surface-container-low dark:bg-[#111] border border-outline-variant/70 dark:border-[#2f3131] shadow-md">

        {/* SQL Transparency Badge */}
        {message.sql_used && message.sql_used.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-2 text-xs font-bold text-secondary dark:text-secondary-fixed hover:opacity-80 transition-opacity uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-sm">database</span>
              SQL Executed ({message.sql_used.length})
              <span className="material-symbols-outlined text-sm">{showSql ? 'expand_less' : 'expand_more'}</span>
            </button>

            {showSql && (
              <div className="mt-3 space-y-3">
                {message.sql_used.map((sql, idx) => (
                  <div key={idx} className="rounded-xl border border-outline-variant dark:border-[#2f3131] overflow-hidden bg-[#0a0a0a]">
                    <div className="flex justify-between items-center px-4 py-2 bg-surface-container-high dark:bg-[#161616] border-b border-outline-variant dark:border-[#2f3131]">
                      <span className="font-mono text-[10px] text-secondary dark:text-secondary-fixed uppercase tracking-widest">SQL #{idx + 1}</span>
                      <button
                        onClick={() => handleCopySql(sql)}
                        className="text-on-surface-variant hover:text-primary flex items-center gap-1 text-[10px] uppercase tracking-wider transition-colors"
                      >
                        {copied ? <span className="material-symbols-outlined text-[14px] text-secondary">check</span> : <span className="material-symbols-outlined text-[14px]">content_copy</span>}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs text-[#e3e2e2] overflow-x-auto">
                      <code>{sql}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Charts */}
        {message.charts && message.charts.length > 0 && (
          <div className="space-y-4 my-4">
            {message.charts.map((chart, idx) => (
              <div key={idx} ref={idx === 0 ? firstChartRef : undefined} className="bg-[#0d0d0d] dark:bg-[#0a0a0a] p-4 rounded-xl border border-[#2D2D2D]">
                <ChartRenderer chart={chart} />
              </div>
            ))}
          </div>
        )}

        {/* Diagrams */}
        {message.diagrams && message.diagrams.length > 0 && (
          <div className="space-y-4 my-4">
            {message.diagrams.map((diag, idx) => (
              <div key={idx} className="bg-[#0d0d0d] dark:bg-[#0a0a0a] p-4 rounded-xl border border-[#2D2D2D]">
                <DiagramRenderer diagram={diag} />
              </div>
            ))}
          </div>
        )}

        {/* Markdown Content */}
        <div className="text-sm text-on-surface-variant dark:text-[#c8c6c5] leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-secondary dark:bg-secondary-fixed animate-pulse rounded-sm align-middle" />
          )}
        </div>

        {/* Error Callout */}
        {message.error && (
          <div className="mt-4 p-4 rounded-xl border-l-4 border-error bg-error-container/10">
            <div className="flex items-start gap-3 text-error">
              <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
              <div className="flex-1">
                <p className="font-bold text-xs uppercase tracking-widest">Execution Error</p>
                <p className="mt-1 text-sm text-on-surface dark:text-tertiary-fixed">{message.error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-error text-on-error hover:bg-error/90 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Retry Analysis
              </button>
            )}
          </div>
        )}

        {/* Export Options Footer */}
        {!message.isStreaming && (
          <div className="mt-4 pt-3 border-t border-outline-variant/40 dark:border-[#2f3131]/60 flex items-center justify-between">
            <span className="font-mono text-[10px] text-on-surface-variant dark:text-on-tertiary-container">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <ExportButton sqlUsed={message.sql_used} chartContainerRef={firstChartRef} cardRef={bubbleRef} />
          </div>
        )}
      </div>
    </div>
  );
};
