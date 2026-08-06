import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

export const BarChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config, title } = chart;
  const xKey = config.x_key;
  const yKey = config.y_key;
  const color = config.color || '#6366f1';

  return (
    <div className="w-full bg-[#1a1a24]/90 border border-[#2a2a3a] rounded-xl p-4 my-3">
      {title && <h4 className="text-xs font-semibold text-[#f1f0ff] mb-3 font-mono">{title}</h4>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} name={config.y_label || yKey} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
