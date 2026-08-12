import React from 'react';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

const PALETTE = ['#ffb595', '#ee671c', '#bbcbb9', '#adc6ff', '#a88a7e', '#e0c0b2'];

export const WordCloudComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const values = data.map((d) => Number(d[config.y_key] || 1));
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 1);

  return (
    <div className="w-full p-4 flex flex-wrap items-center justify-center gap-3">
      {data.map((item, idx) => {
        const val = Number(item[config.y_key] || 1);
        const weight = (val - minVal) / (maxVal - minVal || 1);
        const fontSize = Math.max(Math.round(12 + weight * 20), 12);
        const color = PALETTE[idx % PALETTE.length];

        return (
          <span
            key={idx}
            className="font-bold font-mono transition-transform hover:scale-110 cursor-pointer"
            style={{
              fontSize: `${fontSize}px`,
              color,
            }}
            title={`${item[config.x_key]}: ${val}`}
          >
            {item[config.x_key]}
          </span>
        );
      })}
    </div>
  );
};
