import React from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

export const BubbleChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const gridStroke = '#594238';
  const axisStroke = '#a88a7e';
  const tickFill = '#e0c0b2';
  const zKey = config.z_key || 'size';

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.4} />
          <XAxis dataKey={config.x_key} stroke={axisStroke} tick={{ fill: tickFill, fontSize: 11 }} />
          <YAxis dataKey={config.y_key} stroke={axisStroke} tick={{ fill: tickFill, fontSize: 11 }} />
          <ZAxis dataKey={zKey} range={[60, 400]} name={zKey} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#170b07',
              borderColor: '#594238',
              borderRadius: '8px',
              color: '#f6ddd4',
              fontSize: '12px',
            }}
          />
          <Scatter data={data} fill="#ee671c" opacity={0.8} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
