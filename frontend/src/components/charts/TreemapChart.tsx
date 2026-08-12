import React from 'react';
import { Treemap as RechartsTreemap, ResponsiveContainer, Tooltip } from 'recharts';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

const PALETTE = ['#ffb595', '#ee671c', '#bbcbb9', '#adc6ff', '#a88a7e', '#e0c0b2'];

export const TreemapChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;

  const formattedData = data.map((item, idx) => ({
    name: String(item[config.x_key] || `Item ${idx + 1}`),
    size: Number(item[config.y_key] || 10),
    fill: PALETTE[idx % PALETTE.length],
  }));

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsTreemap
          data={formattedData}
          dataKey="size"
          stroke="#170b07"
          fill="#ffb595"
        >
          <Tooltip
            contentStyle={{
              backgroundColor: '#170b07',
              borderColor: '#594238',
              borderRadius: '8px',
              color: '#f6ddd4',
              fontSize: '12px',
            }}
          />
        </RechartsTreemap>
      </ResponsiveContainer>
    </div>
  );
};
