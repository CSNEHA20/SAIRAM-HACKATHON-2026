import React, { useState } from 'react';
import { SSEChartEvent } from '../../types';
import { BarChartComponent } from './BarChart';
import { LineChartComponent } from './LineChart';
import { PieChartComponent } from './PieChart';
import { ScatterChartComponent } from './ScatterChart';
import { DonutChartComponent } from './DonutChart';
import { AreaChartComponent } from './AreaChart';
import { HistogramChartComponent } from './HistogramChart';
import { HeatmapChartComponent } from './HeatmapChart';
import { BoxPlotChartComponent } from './BoxPlotChart';
import { BubbleChartComponent } from './BubbleChart';
import { TreemapChartComponent } from './TreemapChart';
import { FunnelChartComponent } from './FunnelChart';
import { GaugeChartComponent } from './GaugeChart';
import { WordCloudComponent } from './WordCloud';
import { AlertCircle } from 'lucide-react';

interface ChartRendererProps {
  chart: SSEChartEvent;
}

const CHART_TYPES = [
  { key: 'bar', label: 'Bar', icon: '📊' },
  { key: 'line', label: 'Line', icon: '📈' },
  { key: 'pie', label: 'Pie', icon: '🥧' },
  { key: 'donut', label: 'Donut', icon: '🍩' },
  { key: 'scatter', label: 'Scatter', icon: '🌌' },
  { key: 'area', label: 'Area', icon: '🌊' },
  { key: 'histogram', label: 'Histogram', icon: '📉' },
  { key: 'heatmap', label: 'Heatmap', icon: '🟩' },
  { key: 'box', label: 'Box Plot', icon: '📦' },
  { key: 'bubble', label: 'Bubble', icon: '🫧' },
  { key: 'treemap', label: 'Treemap', icon: '🗺️' },
  { key: 'funnel', label: 'Funnel', icon: '🔻' },
  { key: 'gauge', label: 'Gauge', icon: '🎯' },
  { key: 'wordcloud', label: 'Word Cloud', icon: '☁️' },
];

const TYPE_LABEL: Record<string, string> = {
  bar: 'BAR CHART',
  line: 'LINE CHART',
  pie: 'PIE CHART',
  donut: 'DONUT CHART',
  scatter: 'SCATTER PLOT',
  area: 'AREA CHART',
  histogram: 'HISTOGRAM',
  heatmap: 'HEATMAP',
  box: 'BOX PLOT',
  bubble: 'BUBBLE CHART',
  treemap: 'TREEMAP',
  funnel: 'FUNNEL CHART',
  gauge: 'GAUGE / KPI',
  wordcloud: 'WORD CLOUD',
};

const renderChart = (type: string, chart: SSEChartEvent) => {
  switch (type) {
    case 'line': return <LineChartComponent chart={chart} />;
    case 'pie': return <PieChartComponent chart={chart} />;
    case 'scatter': return <ScatterChartComponent chart={chart} />;
    case 'donut': return <DonutChartComponent chart={chart} />;
    case 'area': return <AreaChartComponent chart={chart} />;
    case 'histogram': return <HistogramChartComponent chart={chart} />;
    case 'heatmap': return <HeatmapChartComponent chart={chart} />;
    case 'box': return <BoxPlotChartComponent chart={chart} />;
    case 'bubble': return <BubbleChartComponent chart={chart} />;
    case 'treemap': return <TreemapChartComponent chart={chart} />;
    case 'funnel': return <FunnelChartComponent chart={chart} />;
    case 'gauge': return <GaugeChartComponent chart={chart} />;
    case 'wordcloud': return <WordCloudComponent chart={chart} />;
    case 'bar':
    default:
      return <BarChartComponent chart={chart} />;
  }
};

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  const [activeType, setActiveType] = useState<string>(chart.chart_type || 'bar');

  if (!chart || !chart.data || chart.data.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-primary" />
        <span>No data available to render this chart</span>
      </div>
    );
  }

  const label = TYPE_LABEL[activeType] ?? TYPE_LABEL.bar;

  return (
    <div className="space-y-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40 dark:border-[#2f3131]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CHART_TYPES.find(t => t.key === activeType)?.icon ?? '📊'}</span>
          <span className="font-bold text-xs uppercase tracking-widest text-on-surface dark:text-tertiary-fixed">
            {chart.title || label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-on-surface-variant dark:text-on-tertiary-container bg-surface-container dark:bg-[#1b1c1c] px-2 py-0.5 rounded border border-outline-variant dark:border-[#2f3131]">
          {chart.data.length} ROWS
        </span>
      </div>

      {/* Chart Body */}
      <div className="pt-1">
        {renderChart(activeType, chart)}
      </div>

      {/* "Visualise in:" Toolbar — All 14 chart types */}
      <div className="pt-3 border-t border-outline-variant/30 dark:border-[#2f3131]/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-on-surface-variant dark:text-on-tertiary-container uppercase tracking-widest">📊 Visualise in:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CHART_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                activeType === t.key
                  ? 'bg-primary dark:bg-secondary text-on-primary dark:text-on-secondary-container border-primary dark:border-secondary shadow-sm'
                  : 'bg-surface-container dark:bg-[#1b1c1c] text-on-surface-variant dark:text-on-tertiary-container border-outline-variant dark:border-[#2f3131] hover:border-primary/50 dark:hover:border-secondary/50 hover:text-primary dark:hover:text-secondary-fixed'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
