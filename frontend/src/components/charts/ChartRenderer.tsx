import React from 'react';
import { SSEChartEvent } from '../../types';
import { BarChartComponent } from './BarChart';
import { LineChartComponent } from './LineChart';
import { PieChartComponent } from './PieChart';
import { ScatterChartComponent } from './ScatterChart';
import { BarChart2, LineChart as LineIcon, PieChart as PieIcon, ScatterChart as ScatterIcon, AlertCircle } from 'lucide-react';

interface ChartRendererProps {
  chart: SSEChartEvent;
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  bar: { label: 'BAR CHART', icon: <BarChart2 className="w-4 h-4" /> },
  line: { label: 'LINE CHART', icon: <LineIcon className="w-4 h-4" /> },
  pie: { label: 'PIE CHART', icon: <PieIcon className="w-4 h-4" /> },
  scatter: { label: 'SCATTER', icon: <ScatterIcon className="w-4 h-4" /> },
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  if (!chart || !chart.data || chart.data.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-body-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-primary" />
        <span>No data available to render this chart</span>
     </div>
    );
  }

  const meta = TYPE_META[chart.chart_type] ?? TYPE_META.bar;

  const renderChartBody = () => {
    switch (chart.chart_type) {
      case 'line':
        return <LineChartComponent chart={chart} />;
      case 'pie':
        return <PieChartComponent chart={chart} />;
      case 'scatter':
        return <ScatterChartComponent chart={chart} />;
      case 'bar':
      default:
        return <BarChartComponent chart={chart} />;
    }
  };

  return (
    <div className="my-3 p-4 rounded-lg bg-surface-container-lowest border border-outline-variant shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant">
        <div className="flex items-center gap-2 text-primary">
          {meta.icon}
          <span className="font-label-md text-label-md uppercase tracking-wider font-semibold">
            {chart.title || meta.label}
         </span>
       </div>
        <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant">
          {chart.data.length} ROWS
       </span>
     </div>
      <div className="pt-1">{renderChartBody()</div>
   </div>
  );
};
