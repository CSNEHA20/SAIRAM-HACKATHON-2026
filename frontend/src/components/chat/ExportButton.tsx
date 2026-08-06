import React, { useState } from 'react';
import html2canvas from 'html2canvas';

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
        backgroundColor: '#131313',
        scale: 2,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `querymind-chart-${Date.now()}.png`;
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
        body: JSON.stringify({ sql: lastSql, filename: 'querymind_export' }),
      });
      if (!res.ok) throw new Error('CSV Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `querymind-export-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {chartContainerRef && (
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
          title="Export visualization as PNG"
        >
          <span className="material-symbols-outlined text-sm text-secondary">image</span>
          <span>Export PNG</span>
        </button>
      )}

      {sqlUsed && sqlUsed.length > 0 && (
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
          title="Download query dataset as CSV"
        >
          <span className="material-symbols-outlined text-sm text-secondary">csv</span>
          <span>Export CSV</span>
        </button>
      )}
    </div>
  );
};
