import React from 'react';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

const PALETTE = ['#ffb595', '#ee671c', '#bbcbb9', '#adc6ff', '#a88a7e'];

export const FunnelChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const maxVal = Math.max(...data.map((d) => Number(d[config.y_key] || 1)), 1);

  return (
    <div className="w-full p-4 space-y-2 flex flex-col items-center">
      {data.map((item, idx) => {
        const val = Number(item[config.y_key] || 0);
        const widthPercent = Math.max(Math.round((val / maxVal) * 100), 20);
        const color = PALETTE[idx % PALETTE.length];

        return (
          <div
            key={idx}
            className="h-10 rounded-xl flex items-center justify-between px-4 text-xs font-semibold font-mono shadow-sm transition-all hover:brightness-110"
            style={{
              width: `${widthPercent}%`,
              backgroundColor: color,
              color: '#170b07',
            }}
          >
            <span className="truncate">{item[config.x_key]}</span>
            <span>{val.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
};
