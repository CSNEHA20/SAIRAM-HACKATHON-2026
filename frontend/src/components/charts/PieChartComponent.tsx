import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const PieChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config, title } = chart;
  const xKey = config.x_key;
  const yKey = config.y_key;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 my-3">
      {title && <h4 className="text-xs font-semibold text-slate-200 mb-3 font-mono">{title}</h4>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
