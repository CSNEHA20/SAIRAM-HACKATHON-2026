import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { SSEDiagramEvent } from '../../types';
import { Network } from 'lucide-react';

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
    <div className="w-full bg-[#1a1a24]/90 border border-[#2a2a3a] rounded-xl p-4 my-3 overflow-x-auto">
      {diagram.title && (
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#f1f0ff] font-mono">
          <Network className="w-4 h-4 text-indigo-400" />
          <span>{diagram.title}</span>
        </div>
      )}

      {error ? (
        <div className="bg-[#0f0f13] p-3 rounded-lg border border-red-900/50 text-red-400 font-mono text-xs overflow-x-auto">
          <p className="font-semibold mb-1">Diagram Syntax Rendering Error:</p>
          <pre className="text-[11px] text-[#8b8ba7]">{diagram.mermaid}</pre>
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
