import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { authenticatedFetch } from '../../services/api';

interface ExportButtonProps {
  sqlUsed?: string[];
  chartContainerRef?: React.RefObject<HTMLDivElement>;
  cardRef?: React.RefObject<HTMLDivElement>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ sqlUsed, chartContainerRef, cardRef }) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportPng = async () => {
    // Prefer dedicated chart container, fall back to full card
    const target = chartContainerRef?.current ?? cardRef?.current;
    if (!target) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(target, {
        backgroundColor: '#1c110b',
        scale: 2,
        useCORS: true,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `querymind-export-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    const target = chartContainerRef?.current ?? cardRef?.current;
    if (!target) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(target, {
        backgroundColor: '#1c110b',
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      
      // Dynamic page dimensions based on the element size
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`querymind-export-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!sqlUsed || sqlUsed.length === 0) return;
    try {
      setIsExporting(true);
      const lastSql = sqlUsed[sqlUsed.length - 1];
      const res = await authenticatedFetch('/api/export/csv', {
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

  const hasExportTarget = !!(chartContainerRef?.current || cardRef?.current);
  const hasCsv = !!(sqlUsed && sqlUsed.length > 0);

  if (!hasExportTarget && !hasCsv) return null;

  return (
    <div className="flex items-center gap-1.5">
      {hasExportTarget && (
        <>
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high dark:bg-[#1b1c1c] border border-outline-variant dark:border-[#2f3131] text-[10px] font-semibold text-on-surface-variant hover:text-primary dark:hover:text-secondary-fixed hover:border-primary/50 transition-all cursor-pointer disabled:opacity-40 uppercase tracking-wider"
            title="Export as PNG image"
          >
            <span className="material-symbols-outlined text-sm text-secondary dark:text-secondary-fixed">image</span>
            PNG
          </button>
          
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high dark:bg-[#1b1c1c] border border-outline-variant dark:border-[#2f3131] text-[10px] font-semibold text-on-surface-variant hover:text-primary dark:hover:text-secondary-fixed hover:border-primary/50 transition-all cursor-pointer disabled:opacity-40 uppercase tracking-wider"
            title="Export as PDF document"
          >
            <span className="material-symbols-outlined text-sm text-secondary dark:text-secondary-fixed">picture_as_pdf</span>
            PDF
          </button>
        </>
      )}

      {hasCsv && (
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high dark:bg-[#1b1c1c] border border-outline-variant dark:border-[#2f3131] text-[10px] font-semibold text-on-surface-variant hover:text-primary dark:hover:text-secondary-fixed hover:border-primary/50 transition-all cursor-pointer disabled:opacity-40 uppercase tracking-wider"
          title="Download query dataset as CSV"
        >
          <span className="material-symbols-outlined text-sm text-secondary dark:text-secondary-fixed">csv</span>
          CSV
        </button>
      )}
    </div>
  );
};
