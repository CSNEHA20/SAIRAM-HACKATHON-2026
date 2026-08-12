import React from 'react';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

export const HeatmapChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const xKey = config.x_key;
  const yKey = config.y_key;
  const zKey = config.z_key || 'value';

  // Get max value for intensity calculation
  const values = data.map((d) => Number(d[zKey] || d[yKey] || 0));
  const maxVal = Math.max(...values, 1);

  return (
    <div className="w-full p-2 overflow-x-auto">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 min-w-[300px]">
        {data.map((item, idx) => {
          const val = Number(item[zKey] || item[yKey] || 0);
          const intensity = Math.min(Math.max(val / maxVal, 0.15), 1);
          return (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-outline-variant/40 flex flex-col justify-between items-center text-center transition-all hover:scale-105"
              style={{
                backgroundColor: `rgba(238, 103, 28, ${intensity})`,
                color: intensity > 0.5 ? '#ffffff' : '#f6ddd4',
              }}
              title={`${item[xKey]}: ${val}`}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider truncate w-full">{item[xKey]}</span>
              <span className="text-xs font-bold font-mono mt-1">{val.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
