import React from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
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

export const ScatterChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const color = config.color || '#ffb595';
  const gridStroke = '#594238';
  const axisStroke = '#a88a7e';
  const tickFill = '#e0c0b2';

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
          <XAxis
            dataKey={config.x_key}
            name={config.x_label || config.x_key}
            stroke={axisStroke}
            tick={{ fill: tickFill, fontSize: 11 }}
            tickLine={{ stroke: axisStroke }}
          />
          <YAxis
            dataKey={config.y_key}
            name={config.y_label || config.y_key}
            stroke={axisStroke}
            tick={{ fill: tickFill, fontSize: 11 }}
            tickLine={{ stroke: axisStroke }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#a88a7e' }}
            contentStyle={{
              backgroundColor: '#170b07',
              borderColor: '#594238',
              borderRadius: '8px',
              color: '#f6ddd4',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <Scatter data={data} fill={color} />
       </RechartsScatterChart>
      </ResponsiveContainer>
   </div>
  );
};
