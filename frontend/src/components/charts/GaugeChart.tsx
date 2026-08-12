import React from 'react';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

export const GaugeChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const firstItem = data[0] || {};
  const val = Number(firstItem[config.y_key] || firstItem.value || 75);
  const max = Number(config.y_label || 100);
  const percentage = Math.min(Math.max(Math.round((val / max) * 100), 0), 100);
  const title = firstItem[config.x_key] || chart.title || 'KPI Metric';

  return (
    <div className="w-full p-4 flex flex-col items-center justify-center">
      <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
        {/* Gauge Track */}
        <div className="w-44 h-44 rounded-full border-[14px] border-surface-container-high border-t-primary border-r-secondary border-b-transparent border-l-primary/40 transform -rotate-45"></div>
        {/* Value Display */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-3xl font-bold font-mono text-primary">{percentage}%</span>
          <span className="text-[10px] uppercase font-mono text-on-surface-variant tracking-wider">{title}</span>
        </div>
      </div>
    </div>
  );
};
