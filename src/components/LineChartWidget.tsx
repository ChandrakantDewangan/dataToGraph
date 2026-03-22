import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { Trash2 } from 'lucide-react';
import { DataRow, WidgetConfig } from '../types';
import { aggregateData } from '../lib/data';
import { cn } from '../lib/utils';

interface LineChartWidgetProps {
  data: DataRow[];
  config: WidgetConfig;
  isSelected: boolean;
  onRemove: (e: React.MouseEvent) => void;
  onSelect: () => void;
}

export default function LineChartWidget({ data, config, isSelected, onRemove, onSelect }: LineChartWidgetProps) {
  const processedData = useMemo(() => {
    const aggregated = aggregateData(data, config.xKeys, config.yKeys, config.aggregation);
    const groupKey = config.xKeys.join(' - ');
    return [
      [groupKey, ...config.yKeys],
      ...aggregated.map(row => [row[groupKey], ...config.yKeys.map(key => row[key])])
    ];
  }, [data, config.xKeys, config.yKeys, config.aggregation]);

  const options = {
    title: config.title,
    curveType: config.curveType || 'function',
    legend: { position: 'bottom' },
    lineWidth: config.lineWidth || 2,
    series: config.yKeys.reduce((acc, key, index) => {
      acc[index] = { color: config.columnColors?.[key] || '#8b5cf6' };
      return acc;
    }, {} as any),
    backgroundColor: 'transparent',
    hAxis: { title: config.xKeys.join(' - ') },
    vAxis: { title: config.aggregation === 'none' ? 'Value' : config.aggregation.toUpperCase() },
    chartArea: { width: '80%', height: '70%' }
  };

  return (
    <div 
      onClick={onSelect}
      className={cn(
        "bg-white p-6 rounded-2xl border transition-all cursor-pointer relative",
        isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg" : "border-slate-200 shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-lg">{config.title}</h3>
        <button 
          onClick={onRemove} 
          className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="h-[300px] w-full">
        <Chart
          chartType="LineChart"
          width="100%"
          height="100%"
          data={processedData}
          options={options}
        />
      </div>
    </div>
  );
}
