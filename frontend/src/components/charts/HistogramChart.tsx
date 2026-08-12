import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
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

export const HistogramChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const gridStroke = '#594238';
  const axisStroke = '#a88a7e';
  const tickFill = '#e0c0b2';

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} barCategoryGap={0} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} opacity={0.4} />
          <XAxis dataKey={config.x_key} stroke={axisStroke} tick={{ fill: tickFill, fontSize: 11 }} />
          <YAxis stroke={axisStroke} tick={{ fill: tickFill, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#170b07',
              borderColor: '#594238',
              borderRadius: '8px',
              color: '#f6ddd4',
              fontSize: '12px',
            }}
          />
          <Bar dataKey={config.y_key} fill="#adc6ff" stroke="#170b07" strokeWidth={1} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
