import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SSEChartEvent } from '../../types';

interface ChartProps {
  chart: SSEChartEvent;
}

export const ScatterChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config, title } = chart;
  const xKey = config.x_key;
  const yKey = config.y_key;
  const color = config.color || '#f59e0b';

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 my-3">
      {title && <h4 className="text-xs font-semibold text-slate-200 mb-3 font-mono">{title}</h4>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} name={config.x_label || xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis dataKey={yKey} name={config.y_label || yKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
            />
            <Scatter name={title || 'Scatter'} data={data} fill={color} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
