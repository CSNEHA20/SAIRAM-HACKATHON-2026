import React from 'react';
import { SSEChartEvent } from '../../types';
import { BarChartComponent } from './BarChartComponent';
import { LineChartComponent } from './LineChartComponent';
import { PieChartComponent } from './PieChartComponent';
import { ScatterChartComponent } from './ScatterChartComponent';

interface ChartRendererProps {
  chart: SSEChartEvent;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  switch (chart.chart_type) {
    case 'bar':
      return <BarChartComponent chart={chart} />;
    case 'line':
      return <LineChartComponent chart={chart} />;
    case 'pie':
      return <PieChartComponent chart={chart} />;
    case 'scatter':
      return <ScatterChartComponent chart={chart} />;
    default:
      return <BarChartComponent chart={chart} />;
  }
};
