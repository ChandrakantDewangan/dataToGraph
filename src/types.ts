export interface DataRow {
  [key: string]: any;
}

export type ChartType = 
  | 'bar' | 'line' | 'area' | 'pie' | 'scatter' 
  | 'column' | 'gantt' | 'geo' | 'timeline' 
  | 'bubble' | 'calendar' | 'candlestick' 
  | 'gauge' | 'histogram' | 'org' | 'sankey' 
  | 'stepped-area' | 'table' | 'tree-map';

export type AggregationType = 'none' | 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface WidgetConfig {
  id: string;
  type: ChartType;
  title: string;
  xKeys: string[]; // Primary dimension(s)
  yKeys: string[]; // Measure(s)
  zKeys?: string[]; // Extra dimensions (e.g., size in bubble, parent in org)
  aggregation: AggregationType;
  columnColors?: Record<string, string>;
  color?: string;
  lineWidth?: number;
  curveType?: 'none' | 'function';
  pieHole?: number;
  is3D?: boolean;
  opacity?: number;
  w: number;
  h: number;
}

export interface DashboardState {
  data: DataRow[];
  columns: string[];
  widgets: WidgetConfig[];
  fileName: string | null;
}
