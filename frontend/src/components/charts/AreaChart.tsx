import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
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

export const AreaChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;
  const gridStroke = '#594238';
  const axisStroke = '#a88a7e';
  const tickFill = '#e0c0b2';

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 24 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffb595" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ffb595" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey={config.y_key}
            stroke="#ffb595"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#areaGradient)"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
