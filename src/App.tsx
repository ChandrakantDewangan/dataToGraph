import React, { useState, useRef } from 'react';
import { 
  LayoutDashboard, Upload, Plus, 
  BarChart3, LineChart as LineIcon, PieChart as PieIcon, 
  AreaChart as AreaIcon, Download, Settings2, ChevronRight,
  Database, X, Check, Settings, ChevronLeft,
  Sigma, Hash, ArrowDown, ArrowUp, Divide, Activity
} from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { DataRow, ChartType, WidgetConfig, DashboardState, AggregationType } from './types';

// Import separate chart components
import BarChartWidget from './components/BarChartWidget';
import LineChartWidget from './components/LineChartWidget';
import PieChartWidget from './components/PieChartWidget';
import AreaChartWidget from './components/AreaChartWidget';
import UniversalChartWidget from './components/UniversalChartWidget';

export default function App() {
  const [state, setState] = useState<DashboardState>({
    data: [],
    columns: [],
    widgets: [],
    fileName: null
  });
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedWidget = state.widgets.find(w => w.id === selectedWidgetId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as DataRow[];
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          setState({
            data,
            columns,
            widgets: [],
            fileName: file.name
          });
          setSelectedWidgetId(null);
          setIsRightSidebarOpen(false);
        }
      }
    });
  };

  const addWidget = (type: ChartType) => {
    if (state.columns.length < 1) return;
    
    const newWidget: WidgetConfig = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}`,
      xKeys: [state.columns[0]],
      yKeys: state.columns.length > 1 ? [state.columns[1]] : [],
      zKeys: [],
      aggregation: 'none',
      columnColors: state.columns.length > 1 ? { [state.columns[1]]: '#6366f1' } : {},
      color: '#6366f1',
      lineWidth: 2,
      curveType: 'function',
      pieHole: 0.4,
      is3D: false,
      opacity: 0.3,
      w: 1,
      h: 1
    };

    // Initialize zKeys for specific charts
    if (type === 'bubble' && state.columns.length > 2) newWidget.zKeys = [state.columns[2]];
    if (type === 'gantt' && state.columns.length > 3) newWidget.zKeys = [state.columns[2], state.columns[3]];
    if (type === 'sankey' && state.columns.length > 2) newWidget.zKeys = [state.columns[2]];
    if (type === 'tree-map' && state.columns.length > 3) newWidget.zKeys = [state.columns[2], state.columns[3]];
    if (type === 'timeline' && state.columns.length > 3) newWidget.zKeys = [state.columns[2], state.columns[3]];
    if (type === 'org' && state.columns.length > 2) newWidget.zKeys = [state.columns[2]];
    
    setState(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
    setSelectedWidgetId(newWidget.id);
    setIsRightSidebarOpen(true);
  };

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
    }));
  };

  const removeWidget = (id: string) => {
    setState(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== id)
    }));
    if (selectedWidgetId === id) {
      setSelectedWidgetId(null);
      setIsRightSidebarOpen(false);
    }
  };

  const toggleXKey = (widgetId: string, key: string) => {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    const newKeys = widget.xKeys.includes(key)
      ? (widget.xKeys.length > 1 ? widget.xKeys.filter(k => k !== key) : widget.xKeys)
      : [...widget.xKeys, key];
    updateWidget(widgetId, { xKeys: newKeys });
  };

  const toggleYKey = (widgetId: string, key: string) => {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    const newKeys = widget.yKeys.includes(key)
      ? (widget.yKeys.length > 1 ? widget.yKeys.filter(k => k !== key) : widget.yKeys)
      : [...widget.yKeys, key];
    
    // Initialize color for new key if not present
    const newColumnColors = { ...(widget.columnColors || {}) };
    if (!newKeys.includes(key)) {
      delete newColumnColors[key];
    } else if (!newColumnColors[key]) {
      newColumnColors[key] = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    }
    
    updateWidget(widgetId, { yKeys: newKeys, columnColors: newColumnColors });
  };

  const toggleZKey = (widgetId: string, key: string) => {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    const zKeys = widget.zKeys || [];
    const newKeys = zKeys.includes(key)
      ? zKeys.filter(k => k !== key)
      : [...zKeys, key];
    updateWidget(widgetId, { zKeys: newKeys });
  };

  const updateColumnColor = (widgetId: string, column: string, color: string) => {
    const widget = state.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    updateWidget(widgetId, {
      columnColors: {
        ...(widget.columnColors || {}),
        [column]: color
      }
    });
  };

  const getXLabel = (type: ChartType) => {
    switch(type) {
      case 'pie': return 'Labels (Keys)';
      case 'bar': case 'column': return 'Categories (X-Axis)';
      case 'geo': return 'Region / Country';
      case 'calendar': return 'Date Column';
      case 'gantt': return 'Task ID';
      case 'org': return 'Node Name';
      case 'sankey': return 'From Node';
      case 'timeline': return 'Row Label';
      case 'bubble': return 'X-Axis Value';
      case 'candlestick': return 'Time / Category';
      case 'table': return 'Columns to Show';
      case 'tree-map': return 'Node ID';
      default: return 'X-Axis (Dimension)';
    }
  };

  const getYLabel = (type: ChartType) => {
    switch(type) {
      case 'pie': return 'Values (Data)';
      case 'bar': case 'column': return 'Values (Y-Axis)';
      case 'geo': return 'Data Value';
      case 'calendar': return 'Data Value';
      case 'gantt': return 'Task Name';
      case 'org': return 'Parent Node';
      case 'sankey': return 'To Node';
      case 'timeline': return 'Bar Label';
      case 'bubble': return 'Y-Axis Value';
      case 'candlestick': return 'Low, Open, Close, High';
      case 'gauge': return 'Value Column';
      case 'histogram': return 'Value Distribution';
      case 'tree-map': return 'Parent ID';
      default: return 'Y-Axis (Measures)';
    }
  };

  const getZLabel = (type: ChartType) => {
    switch(type) {
      case 'bubble': return 'Size / ID';
      case 'gantt': return 'Resource, Start, End, Duration, % Complete, Dependencies';
      case 'sankey': return 'Weight / Value';
      case 'tree-map': return 'Size, Color Value';
      default: return 'Additional Data';
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isLeftSidebarOpen ? 280 : 0, opacity: isLeftSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-sm z-20 relative"
      >
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">InsightFlow</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Data Source Section */}
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Database size={14} /> Data Source
              </h2>
            </div>
            
            {!state.fileName ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group flex flex-col items-center gap-2"
              >
                <Upload className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-medium text-slate-600">Import CSV Data</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".csv" 
                  className="hidden" 
                />
              </button>
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database size={16} />
                  </div>
                  <span className="text-sm font-medium truncate text-slate-700">{state.fileName}</span>
                </div>
                <button 
                  onClick={() => setState({ data: [], columns: [], widgets: [], fileName: null })}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </section>

          {/* Chart Types Section */}
          <section className={cn("space-y-3", !state.fileName && "opacity-50 pointer-events-none")}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 px-2">
              <Plus size={14} /> Add Visuals
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'bar', icon: BarChart3, label: 'Bar' },
                { type: 'column', icon: BarChart3, label: 'Column' },
                { type: 'line', icon: LineIcon, label: 'Line' },
                { type: 'area', icon: AreaIcon, label: 'Area' },
                { type: 'pie', icon: PieIcon, label: 'Pie' },
                { type: 'scatter', icon: Activity, label: 'Scatter' },
                { type: 'bubble', icon: Activity, label: 'Bubble' },
                { type: 'geo', icon: Database, label: 'Geo' },
                { type: 'calendar', icon: Database, label: 'Calendar' },
                { type: 'gantt', icon: LayoutDashboard, label: 'Gantt' },
                { type: 'timeline', icon: LayoutDashboard, label: 'Timeline' },
                { type: 'candlestick', icon: BarChart3, label: 'Candlestick' },
                { type: 'gauge', icon: Activity, label: 'Gauge' },
                { type: 'histogram', icon: BarChart3, label: 'Histogram' },
                { type: 'org', icon: LayoutDashboard, label: 'Org' },
                { type: 'sankey', icon: Activity, label: 'Sankey' },
                { type: 'stepped-area', icon: AreaIcon, label: 'Stepped Area' },
                { type: 'table', icon: LayoutDashboard, label: 'Table' },
                { type: 'tree-map', icon: LayoutDashboard, label: 'Tree Map' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => addWidget(item.type as ChartType)}
                  className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                  <item.icon size={20} className="text-slate-500 group-hover:text-indigo-600" />
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              title={isLeftSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              <ChevronLeft className={cn("transition-transform", !isLeftSidebarOpen && "rotate-180")} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Dashboard</span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="font-semibold text-slate-700">Main Overview</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Download size={16} /> Export
            </button>
            {selectedWidgetId && (
              <button 
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors flex items-center gap-2",
                  isRightSidebarOpen ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Settings size={20} />
                <span className="text-sm font-medium">Customize</span>
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {state.data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <Upload size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to explore?</h2>
              <p className="text-slate-500 mb-8">Upload a CSV file to start building your interactive data dashboard.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 pb-20 max-w-6xl mx-auto">
              <AnimatePresence mode="popLayout">
                {state.widgets.map((widget) => (
                  <motion.div
                    key={widget.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full"
                  >
                    {['bar', 'line', 'pie', 'area', 'column'].includes(widget.type) ? (
                      <>
                        {(widget.type === 'bar' || widget.type === 'column') && (
                          <BarChartWidget 
                            data={state.data} 
                            config={widget}
                            isSelected={selectedWidgetId === widget.id}
                            onSelect={() => {
                              setSelectedWidgetId(widget.id);
                              setIsRightSidebarOpen(true);
                            }}
                            onRemove={(e) => {
                              e.stopPropagation();
                              removeWidget(widget.id);
                            }} 
                          />
                        )}
                        {widget.type === 'line' && (
                          <LineChartWidget 
                            data={state.data} 
                            config={widget}
                            isSelected={selectedWidgetId === widget.id}
                            onSelect={() => {
                              setSelectedWidgetId(widget.id);
                              setIsRightSidebarOpen(true);
                            }}
                            onRemove={(e) => {
                              e.stopPropagation();
                              removeWidget(widget.id);
                            }} 
                          />
                        )}
                        {widget.type === 'pie' && (
                          <PieChartWidget 
                            data={state.data} 
                            config={widget}
                            isSelected={selectedWidgetId === widget.id}
                            onSelect={() => {
                              setSelectedWidgetId(widget.id);
                              setIsRightSidebarOpen(true);
                            }}
                            onRemove={(e) => {
                              e.stopPropagation();
                              removeWidget(widget.id);
                            }} 
                          />
                        )}
                        {widget.type === 'area' && (
                          <AreaChartWidget 
                            data={state.data} 
                            config={widget}
                            isSelected={selectedWidgetId === widget.id}
                            onSelect={() => {
                              setSelectedWidgetId(widget.id);
                              setIsRightSidebarOpen(true);
                            }}
                            onRemove={(e) => {
                              e.stopPropagation();
                              removeWidget(widget.id);
                            }} 
                          />
                        )}
                      </>
                    ) : (
                      <UniversalChartWidget 
                        data={state.data} 
                        config={widget}
                        isSelected={selectedWidgetId === widget.id}
                        onSelect={() => {
                          setSelectedWidgetId(widget.id);
                          setIsRightSidebarOpen(true);
                        }}
                        onRemove={(e) => {
                          e.stopPropagation();
                          removeWidget(widget.id);
                        }} 
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {state.widgets.length === 0 && (
                <div className="col-span-full h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Plus size={32} />
                  <p className="font-medium">Add your first visual from the sidebar</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar (Customization) */}
      <motion.aside 
        initial={false}
        animate={{ width: isRightSidebarOpen && selectedWidgetId ? 360 : 0, opacity: isRightSidebarOpen && selectedWidgetId ? 1 : 0 }}
        className="bg-white border-l border-slate-200 flex flex-col overflow-hidden shadow-sm z-20"
      >
        {selectedWidget && (
          <>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="text-indigo-600" size={20} />
                <h2 className="font-bold text-lg text-slate-800">Customize</h2>
              </div>
              <button 
                onClick={() => setIsRightSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Chart Title</label>
                <input 
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                />
              </div>

              {/* Axis Selection */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{getXLabel(selectedWidget.type)}</label>
                  <div className="flex flex-wrap gap-2">
                    {state.columns.map(col => (
                      <button
                        key={col}
                        onClick={() => toggleXKey(selectedWidget.id, col)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1.5",
                          selectedWidget.xKeys.includes(col) 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {col}
                        {selectedWidget.xKeys.includes(col) && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{getYLabel(selectedWidget.type)}</label>
                  <div className="flex flex-wrap gap-2">
                    {state.columns.map(col => (
                      <button
                        key={col}
                        onClick={() => toggleYKey(selectedWidget.id, col)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1.5",
                          selectedWidget.yKeys.includes(col) 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {col}
                        {selectedWidget.yKeys.includes(col) && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                {['bubble', 'gantt', 'sankey', 'tree-map', 'timeline', 'org', 'table'].includes(selectedWidget.type) && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{getZLabel(selectedWidget.type)}</label>
                    <div className="flex flex-wrap gap-2">
                      {state.columns.map(col => (
                        <button
                          key={col}
                          onClick={() => toggleZKey(selectedWidget.id, col)}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1.5",
                            selectedWidget.zKeys?.includes(col) 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {col}
                          {selectedWidget.zKeys?.includes(col) && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      {selectedWidget.type === 'gantt' && "Order: Resource, Start, End, Duration, % Complete, Dependencies"}
                      {selectedWidget.type === 'timeline' && "Order: Start Date, End Date"}
                      {selectedWidget.type === 'bubble' && "Order: Size, ID"}
                      {selectedWidget.type === 'sankey' && "Order: Weight"}
                      {selectedWidget.type === 'tree-map' && "Order: Size, Color Value"}
                    </p>
                  </div>
                )}
              </div>

              {/* Aggregation */}
              {!['bubble', 'gantt', 'calendar', 'candlestick', 'org', 'sankey', 'timeline', 'tree-map', 'table'].includes(selectedWidget.type) && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Aggregation Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'Raw', icon: Activity },
                      { id: 'sum', label: 'Sum', icon: Sigma },
                      { id: 'avg', label: 'Avg', icon: Divide },
                      { id: 'min', label: 'Min', icon: ArrowDown },
                      { id: 'max', label: 'Max', icon: ArrowUp },
                      { id: 'count', label: 'Count', icon: Hash },
                    ].map((agg) => (
                      <button
                        key={agg.id}
                        onClick={() => updateWidget(selectedWidget.id, { aggregation: agg.id as AggregationType })}
                        className={cn(
                          "px-2 py-2.5 text-[10px] rounded-xl border transition-all font-bold flex flex-col items-center gap-1.5 uppercase tracking-wider",
                          selectedWidget.aggregation === agg.id
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <agg.icon size={14} />
                        {agg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Column Colors */}
              {selectedWidget.type !== 'pie' ? (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Series Colors</label>
                  <div className="space-y-2">
                    {selectedWidget.yKeys.map(key => (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">{key}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={selectedWidget.columnColors?.[key] || '#6366f1'} 
                            onChange={(e) => updateColumnColor(selectedWidget.id, key, e.target.value)}
                            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer rounded-lg overflow-hidden"
                          />
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedWidget.columnColors?.[key] || '#6366f1'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Chart Color</label>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-medium text-slate-700">Base Color</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={selectedWidget.color || '#6366f1'} 
                        onChange={(e) => updateWidget(selectedWidget.id, { color: e.target.value })}
                        className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer rounded-lg overflow-hidden"
                      />
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedWidget.color || '#6366f1'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Specific Settings */}
              {selectedWidget.type === 'line' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Smoothing</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => updateWidget(selectedWidget.id, { curveType: 'none' })}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                          selectedWidget.curveType === 'none' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Straight
                      </button>
                      <button 
                        onClick={() => updateWidget(selectedWidget.id, { curveType: 'function' })}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                          selectedWidget.curveType === 'function' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Smooth
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Line Width: {selectedWidget.lineWidth}</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={selectedWidget.lineWidth} 
                      onChange={(e) => updateWidget(selectedWidget.id, { lineWidth: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </>
              )}

              {selectedWidget.type === 'area' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Fill Opacity: {Math.round((selectedWidget.opacity || 0.3) * 100)}%</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={selectedWidget.opacity} 
                    onChange={(e) => updateWidget(selectedWidget.id, { opacity: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              )}

              {selectedWidget.type === 'pie' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Donut Hole: {Math.round((selectedWidget.pieHole || 0.4) * 100)}%</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="0.9" 
                      step="0.1"
                      value={selectedWidget.pieHole} 
                      onChange={(e) => updateWidget(selectedWidget.id, { pieHole: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <label htmlFor="is3d-toggle" className="text-sm font-medium text-slate-700">3D Perspective</label>
                    <input 
                      type="checkbox" 
                      id="is3d-toggle"
                      checked={selectedWidget.is3D} 
                      onChange={(e) => updateWidget(selectedWidget.id, { is3D: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => removeWidget(selectedWidget.id)}
                className="w-full py-3 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <X size={16} /> Remove Visual
              </button>
            </div>
          </>
        )}
      </motion.aside>
    </div>
  );
}
