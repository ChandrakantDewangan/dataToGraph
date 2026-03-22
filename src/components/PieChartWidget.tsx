import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { Trash2 } from 'lucide-react';
import { DataRow, WidgetConfig } from '../types';
import { aggregateData } from '../lib/data';
import { cn } from '../lib/utils';

interface PieChartWidgetProps {
  data: DataRow[];
  config: WidgetConfig;
  isSelected: boolean;
  onRemove: (e: React.MouseEvent) => void;
  onSelect: () => void;
}

// Helper to generate shades of a color
const generateShades = (baseColor: string, count: number) => {
  const shades = [];
  // Simple hex to rgb and back to hex with lightness adjustment
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  for (let i = 0; i < count; i++) {
    const factor = 0.8 + (i / count) * 0.4; // Vary lightness
    const nr = Math.min(255, Math.floor(r * factor));
    const ng = Math.min(255, Math.floor(g * factor));
    const nb = Math.min(255, Math.floor(b * factor));
    shades.push(`rgb(${nr}, ${ng}, ${nb})`);
  }
  return shades;
};

export default function PieChartWidget({ data, config, isSelected, onRemove, onSelect }: PieChartWidgetProps) {
  const processedData = useMemo(() => {
    const aggregated = aggregateData(data, config.xKeys, config.yKeys, config.aggregation);
    const groupKey = config.xKeys.join(' - ');
    return {
      groupKey,
      rows: aggregated.slice(0, 10) // Limit to 10 for readability
    };
  }, [data, config.xKeys, config.yKeys, config.aggregation]);

  const getChartData = (valueKey: string) => {
    return [
      [processedData.groupKey, valueKey],
      ...processedData.rows.map(row => [row[processedData.groupKey], row[valueKey]])
    ];
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

      <div className="h-[400px] w-full relative flex items-center justify-center">
        {config.yKeys.map((key, index) => {
          const size = 100 - (index * (100 / (config.yKeys.length + 1)));
          const hole = 1 - (1 / (config.yKeys.length - index + 1));
          const baseColor = config.color || config.columnColors?.[key] || '#6366f1';
          const colors = generateShades(baseColor, processedData.rows.length);

          return (
            <div 
              key={key}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ 
                zIndex: config.yKeys.length - index,
                padding: `${index * 10}%`
              }}
            >
              <div className="w-full h-full pointer-events-auto">
                <Chart
                  chartType="PieChart"
                  width="100%"
                  height="100%"
                  data={getChartData(key)}
                  options={{
                    title: config.yKeys.length > 1 ? key : undefined,
                    pieHole: config.yKeys.length > 1 ? 0.6 : (config.pieHole || 0.4),
                    is3D: config.yKeys.length > 1 ? false : config.is3D,
                    backgroundColor: 'transparent',
                    legend: index === 0 ? { position: 'right' } : { position: 'none' },
                    chartArea: { width: '90%', height: '90%' },
                    colors: colors,
                    pieSliceText: config.yKeys.length > 1 ? 'none' : 'percentage',
                    tooltip: { trigger: 'focus' }
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
