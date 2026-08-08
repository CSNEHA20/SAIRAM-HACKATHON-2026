import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

export const PieChartComponent: React.FC<ChartProps> = ({ chart }) => {
  const { data, config } = chart;

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            nameKey={config.x_key}
            dataKey={config.y_key}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={48}
            fill="#ffb595"
            paddingAngle={2}
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ''} ${percent ? Math.round(percent * 100) : 0}%`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
         </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#170b07',
              borderColor: '#594238',
              borderRadius: '8px',
              color: '#f6ddd4',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#e0c0b2' }}
            iconType="circle"
          />
       </RechartsPieChart>
     </ResponsiveContainer>
   </div>
  );
};
