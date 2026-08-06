import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

interface ExportButtonProps {
  sqlUsed?: string[];
  chartContainerRef?: React.RefObject<HTMLDivElement>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ sqlUsed, chartContainerRef }) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportPng = async () => {
    // Prefer the dedicated chart container; otherwise fall back to no-op
    const target = chartContainerRef?.current;
    if (!target) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(target, {
        backgroundColor: '#1a1a24',
        scale: 2,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `dataflow-chart-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!sqlUsed || sqlUsed.length === 0) return;
    try {
      setIsExporting(true);
      const lastSql = sqlUsed[sqlUsed.length - 1];
      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: lastSql, filename: 'dataflow_export' }),
      });
      if (!res.ok) throw new Error('CSV Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataflow-export-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#2a2a3a]/60">
      {chartContainerRef && (
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] text-xs text-[#8b8ba7] hover:text-[#f1f0ff] hover:bg-[#2a2a3a] transition-colors"
          title="Export visualization as PNG"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export PNG</span>
        </button>
      )}

      {sqlUsed && sqlUsed.length > 0 && (
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] text-xs text-[#8b8ba7] hover:text-[#f1f0ff] hover:bg-[#2a2a3a] transition-colors"
          title="Download query dataset as CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      )}
    </div>
  );
};
