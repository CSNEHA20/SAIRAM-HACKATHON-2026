import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { SSEDiagramEvent } from '../../types';

interface DiagramRendererProps {
  diagram: SSEDiagramEvent;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
});

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ diagram }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!diagram.mermaid) return;
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, diagram.mermaid);
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Mermaid render error:', err);
          setError(err?.message || 'Failed to render diagram');
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [diagram.mermaid]);

  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant rounded p-4 my-3 overflow-x-auto shadow-sm">
      {diagram.title && (
        <div className="flex items-center gap-2 mb-3 text-label-md font-label-md text-on-surface uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm text-primary">account_tree</span>
          <span>{diagram.title}</span>
        </div>
      )}

      {error ? (
        <div className="bg-surface p-3 rounded border border-error/50 text-error font-label-md text-label-sm overflow-x-auto">
          <p className="font-bold mb-1">Diagram Syntax Rendering Error:</p>
          <pre className="text-on-surface-variant font-label-caps">{diagram.mermaid}</pre>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex justify-center items-center svg-container overflow-x-auto py-2"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};
