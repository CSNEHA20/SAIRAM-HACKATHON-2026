import React from 'react';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

export const BoxPlotChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const xKey = config.x_key;

  return (
    <div className="w-full p-3 space-y-3">
      {data.map((item, idx) => {
        const label = item[xKey] || `Group ${idx + 1}`;
        const min = Number(item.min ?? item.low ?? 10);
        const q1 = Number(item.q1 ?? 25);
        const median = Number(item.median ?? item.value ?? 50);
        const q3 = Number(item.q3 ?? 75);
        const max = Number(item.max ?? item.high ?? 90);

        return (
          <div key={idx} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
            <div className="flex justify-between items-center text-xs font-mono text-on-surface mb-2">
              <span className="font-bold text-primary">{label}</span>
              <span className="text-on-surface-variant">Min: {min} | Median: {median} | Max: {max}</span>
            </div>
            <div className="relative h-6 w-full flex items-center">
              {/* Whiskers line */}
              <div className="absolute left-[10%] right-[10%] h-[2px] bg-outline-variant"></div>
              {/* Box range (Q1 to Q3) */}
              <div className="absolute left-[25%] right-[25%] h-5 rounded bg-primary/25 border border-primary flex items-center justify-center">
                {/* Median line */}
                <div className="w-1 h-full bg-secondary"></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
