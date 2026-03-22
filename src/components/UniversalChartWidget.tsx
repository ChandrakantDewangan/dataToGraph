import React, { useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { Trash2, Settings } from 'lucide-react';
import { DataRow, WidgetConfig, ChartType } from '../types';
import { aggregateData } from '../lib/data';
import { cn } from '../lib/utils';

interface UniversalChartWidgetProps {
  data: DataRow[];
  config: WidgetConfig;
  isSelected: boolean;
  onRemove: (e: React.MouseEvent) => void;
  onSelect: () => void;
}

export default function UniversalChartWidget({ data, config, isSelected, onRemove, onSelect }: UniversalChartWidgetProps) {
  const processedData = useMemo(() => {
    // For some charts, aggregation might not make sense or needs special handling
    const aggregated = aggregateData(data, config.xKeys, config.yKeys, config.aggregation);
    const groupKey = config.xKeys.join(' - ');
    
    // Format data for Google Charts based on type
    let chartData: any[] = [];
    const headers = [groupKey, ...config.yKeys, ...(config.zKeys || [])];

    const safeDate = (val: any) => {
      if (val === undefined || val === null || val === '') return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const safeNum = (val: any) => {
      if (val === undefined || val === null || val === '') return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const safeStr = (val: any) => (val === undefined || val === null ? '' : String(val));
    
    switch (config.type) {
      case 'column':
        chartData = [
          headers,
          ...aggregated.map(row => headers.map(h => row[h] ?? null))
        ];
        break;
      case 'bubble':
        // ID, X, Y, Series, Size
        chartData = [
          ['ID', 'X', 'Y', 'Series', 'Size'],
          ...data.map((row, i) => [
            safeStr(row[config.zKeys?.[1] || config.xKeys[0]] || i),
            safeNum(row[config.xKeys[0]]),
            safeNum(row[config.yKeys[0]]),
            safeStr(row[config.zKeys?.[0]] || config.xKeys[0]),
            safeNum(row[config.zKeys?.[1]] || row[config.yKeys[0]])
          ])
        ];
        break;
      case 'gantt':
        // Task ID, Task Name, Resource, Start, End, Duration, Percent Complete, Dependencies
        chartData = [
          [
            { type: 'string', label: 'Task ID' },
            { type: 'string', label: 'Task Name' },
            { type: 'string', label: 'Resource' },
            { type: 'date', label: 'Start Date' },
            { type: 'date', label: 'End Date' },
            { type: 'number', label: 'Duration' },
            { type: 'number', label: 'Percent Complete' },
            { type: 'string', label: 'Dependencies' },
          ],
          ...data.map(row => [
            safeStr(row[config.xKeys[0]]),
            safeStr(row[config.yKeys[0]]),
            safeStr(row[config.zKeys?.[0]]),
            safeDate(row[config.zKeys?.[1]]),
            safeDate(row[config.zKeys?.[2]]),
            safeNum(row[config.zKeys?.[3]]),
            safeNum(row[config.zKeys?.[4]]),
            safeStr(row[config.zKeys?.[5]]),
          ])
        ];
        break;
      case 'calendar':
        chartData = [
          [{ type: 'date', id: 'Date' }, { type: 'number', id: 'Value' }],
          ...data.map(row => [safeDate(row[config.xKeys[0]]), safeNum(row[config.yKeys[0]])])
        ];
        break;
      case 'candlestick':
        // X, Low, Open, Close, High
        chartData = [
          ['Day', 'Low', 'Open', 'Close', 'High'],
          ...data.map(row => [
            safeStr(row[config.xKeys[0]]),
            safeNum(row[config.yKeys[0]]),
            safeNum(row[config.yKeys[1]]),
            safeNum(row[config.yKeys[2]]),
            safeNum(row[config.yKeys[3]])
          ])
        ];
        break;
      case 'geo':
        chartData = [
          ['Region', 'Value'],
          ...aggregated.map(row => [safeStr(row[groupKey]), safeNum(row[config.yKeys[0]])])
        ];
        break;
      case 'gauge':
        chartData = [
          ['Label', 'Value'],
          ...aggregated.map(row => [safeStr(row[groupKey]), safeNum(row[config.yKeys[0]])])
        ];
        break;
      case 'histogram':
        chartData = [
          ['Value'],
          ...data.map(row => [safeNum(row[config.yKeys[0]])])
        ];
        break;
      case 'org':
        // Name, Manager, Tooltip
        chartData = [
          ['Name', 'Manager', 'ToolTip'],
          ...data.map(row => [
            safeStr(row[config.xKeys[0]]),
            safeStr(row[config.yKeys[0]]),
            safeStr(row[config.zKeys?.[0]])
          ])
        ];
        break;
      case 'sankey':
        // From, To, Weight
        chartData = [
          ['From', 'To', 'Weight'],
          ...data.map(row => [
            safeStr(row[config.xKeys[0]] || 'Unknown'),
            safeStr(row[config.yKeys[0]] || 'Unknown'),
            safeNum(row[config.zKeys?.[0]] || 1)
          ])
        ];
        break;
      case 'timeline':
        // Row Label, Bar Label, Start, End
        chartData = [
          [
            { type: 'string', id: 'Row' },
            { type: 'string', id: 'Bar' },
            { type: 'date', id: 'Start' },
            { type: 'date', id: 'End' },
          ],
          ...data.map(row => [
            safeStr(row[config.xKeys[0]]),
            safeStr(row[config.yKeys[0]]),
            safeDate(row[config.zKeys?.[0]]),
            safeDate(row[config.zKeys?.[1]])
          ])
        ];
        break;
      case 'tree-map':
        // ID, Parent, Value, Color Value
        chartData = [
          ['Location', 'Parent', 'Market trade volume (size)', 'Market increase/decrease (color)'],
          ['Global', null, 0, 0], // Root
          ...data.map(row => [
            safeStr(row[config.xKeys[0]]),
            safeStr(row[config.yKeys[0]] || 'Global'),
            safeNum(row[config.zKeys?.[0]]),
            safeNum(row[config.zKeys?.[1]])
          ])
        ];
        break;
      case 'table':
        const tableHeaders = [...config.xKeys, ...config.yKeys, ...(config.zKeys || [])];
        chartData = [
          tableHeaders,
          ...data.map(row => tableHeaders.map(h => row[h] ?? null))
        ];
        break;
      default:
        chartData = [
          headers,
          ...aggregated.map(row => headers.map(h => row[h] ?? null))
        ];
    }

    // Safety check: Google Charts needs at least one data row or it might crash with minified errors
    if (chartData.length === 1) {
      chartData.push(headers.map(() => null));
    }

    return chartData;
  }, [data, config]);

  const getChartType = (type: ChartType) => {
    switch (type) {
      case 'column': return 'ColumnChart';
      case 'bar': return 'BarChart';
      case 'line': return 'LineChart';
      case 'area': return 'AreaChart';
      case 'pie': return 'PieChart';
      case 'scatter': return 'ScatterChart';
      case 'bubble': return 'BubbleChart';
      case 'geo': return 'GeoChart';
      case 'calendar': return 'Calendar';
      case 'gantt': return 'Gantt';
      case 'timeline': return 'Timeline';
      case 'candlestick': return 'CandlestickChart';
      case 'gauge': return 'Gauge';
      case 'histogram': return 'Histogram';
      case 'org': return 'OrgChart';
      case 'sankey': return 'Sankey';
      case 'stepped-area': return 'SteppedAreaChart';
      case 'table': return 'Table';
      case 'tree-map': return 'TreeMap';
      default: return 'BarChart';
    }
  };

  const options = useMemo(() => {
    const baseOptions: any = {
      title: config.title,
      backgroundColor: 'transparent',
      chartArea: { width: '85%', height: '75%' },
      hAxis: { title: config.xKeys.join(', ') },
      vAxis: { title: config.yKeys.join(', ') },
      legend: { position: 'right' },
      animation: { startup: true, duration: 1000, easing: 'out' },
    };

    if (config.columnColors) {
      baseOptions.series = config.yKeys.reduce((acc, key, i) => {
        if (config.columnColors?.[key]) {
          acc[i] = { color: config.columnColors[key] };
        }
        return acc;
      }, {} as any);
    }

    if (config.type === 'stepped-area') {
      baseOptions.isStacked = true;
    }

    if (config.type === 'gauge') {
      baseOptions.redFrom = 90;
      baseOptions.redTo = 100;
      baseOptions.yellowFrom = 75;
      baseOptions.yellowTo = 90;
      baseOptions.minorTicks = 5;
    }

    return baseOptions;
  }, [config]);

  return (
    <div 
      onClick={onSelect}
      className={cn(
        "bg-white p-6 rounded-2xl border transition-all cursor-pointer relative min-h-[450px]",
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

      <div className="h-[350px] w-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        {(() => {
          const requiredY = {
            'candlestick': 4,
            'bubble': 1,
            'gantt': 1,
            'timeline': 1,
          }[config.type as string] || 1;

          const requiredZ = {
            'bubble': 2,
            'gantt': 6,
            'timeline': 2,
            'sankey': 1,
            'tree-map': 2,
            'org': 1,
          }[config.type as string] || 0;

          if (config.yKeys.length < requiredY || (config.zKeys || []).length < requiredZ) {
            return (
              <div className="text-center p-6">
                <Settings className="mx-auto mb-2 text-slate-300" size={24} />
                <p className="text-sm text-slate-500 font-medium">Incomplete Configuration</p>
                <p className="text-xs text-slate-400 mt-1">
                  This chart requires {requiredY} value column{requiredY > 1 ? 's' : ''} 
                  {requiredZ > 0 ? ` and ${requiredZ} extra column${requiredZ > 1 ? 's' : ''}` : ''}.
                </p>
              </div>
            );
          }

          return (
            <Chart
              chartType={getChartType(config.type)}
              width="100%"
              height="100%"
              data={processedData}
              options={options}
            />
          );
        })()}
      </div>
    </div>
  );
}
