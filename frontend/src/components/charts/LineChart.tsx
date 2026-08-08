import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

export const LineChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const color = config.color || '#ffb595';
  const gridStroke = '#594238';
  const axisStroke = '#a88a7e';
  const tickFill = '#e0c0b2';

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
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
            cursor={{ stroke: '#a88a7e', strokeDasharray: '3 3' }}
          />
          <Line
            type="monotone"
            dataKey={config.y_key}
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: color, stroke: '#170b07', strokeWidth: 2 }}
          />
       </RechartsLineChart>
     </ResponsiveContainer>
   </div>
  );
};
