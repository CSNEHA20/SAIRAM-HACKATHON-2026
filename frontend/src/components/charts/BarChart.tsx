import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

const PALETTE = [
  '#ffb595',
  '#ee671c',
  '#bbcbb9',
  '#adc6ff',
  '#a88a7e',
  '#e0c0b2',
];

export const BarChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const color = config.color || '#ffb595';
  const gridStroke = '#594238';
  const axisStroke = '#a88a7e';
  const tickFill = '#e0c0b2';

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.5} />
          <XAxis
            dataKey={config.x_key}
            stroke={axisStroke}
            tick={{ fill: tickFill, fontSize: 11 }}
            tickLine={{ stroke: axisStroke }}
          />
          <YAxis
            stroke={axisStroke}
            tick={{ fill: tickFill, fontSize: 11 }}
            tickLine={{ stroke: axisStroke }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#170b07',
              borderColor: '#594238',
              borderRadius: '8px',
              color: '#f6ddd4',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
            }}
            cursor={{ fill: 'rgba(255, 181, 149, 0.08)' }}
          />
          <Bar dataKey={config.y_key} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length] || color} />
            ))}
         </Bar>
       </RechartsBarChart>
     </ResponsiveContainer>
   </div>
  );
};
