import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Users,
  Route,
  Activity,
  Zap,
  RefreshCw,
  ArrowUpRight,
  CheckCheck,
  Sliders,
  Sparkles,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  CloudRain,
  Search,
  Check,
  Compass,
  FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts';
import type {
  ZoneWithRisk,
  EarlyWarningAlert,
  FieldReport,
  VulnerableRoad
} from '../../types';
import { InfoTooltip } from '../common/InfoTooltip';

interface AuthorityDashboardProps {
  zones: ZoneWithRisk[];
  alerts: EarlyWarningAlert[];
  roads: VulnerableRoad[];
  reports: FieldReport[];
  selectedZone: ZoneWithRisk | null;
  onSelectZone: (zoneId: string) => void;
  onOpenZoneModal: (zone: ZoneWithRisk) => void;
  onTakeAlertAction: (alertId: string, actionName: string, status?: any) => void;
  onTriggerSimulation: (zoneId: string, extraRainMm: number) => void;
  onResetSimulation: () => void;
  onVerifyReport: (reportId: string) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  zones,
  alerts,
  roads,
  reports,
  selectedZone,
  onSelectZone,
  onOpenZoneModal,
  onTakeAlertAction,
  onTriggerSimulation,
  onResetSimulation,
  onVerifyReport
}) => {
  const [sandboxZoneId, setSandboxZoneId] = useState<string>(zones[0]?.zone?.id || 'ner-sk-01');
  const [sandboxRainMm, setSandboxRainMm] = useState<number>(120);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'reports'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const activeZone = selectedZone || zones[0] || null;

  const criticalCount = zones.filter(z => z.risk?.riskLevel === 'Critical').length;
  const highCount = zones.filter(z => z.risk?.riskLevel === 'High').length;
  
  const threatenedPopulation = zones
    .filter(z => z.risk?.riskLevel === 'Critical' || z.risk?.riskLevel === 'High')
    .reduce((sum, z) => sum + (z.zone?.population_exposure || 0), 0);

  const blockedRoadsCount = roads.filter(road =>
    road.associated_zone_ids.some(zId => {
      const z = zones.find(item => item.zone?.id === zId);
      return z && (z.risk?.riskLevel === 'High' || z.risk?.riskLevel === 'Critical');
    })
  ).length;

  const states = ['all', 'Sikkim', 'Meghalaya', 'Assam', 'Mizoram', 'Nagaland', 'Arunachal Pradesh', 'Manipur', 'Tripura'];

  const filteredZones = zones.filter(item => {
    const matchesState = selectedStateFilter === 'all' || item.zone?.state.toLowerCase().includes(selectedStateFilter.toLowerCase());
    const matchesSearch = !searchQuery || 
      item.zone?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.zone?.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.zone?.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  const priorityQueue = [...filteredZones].sort(
    (a, b) => (b.risk?.responsePriorityScore || 0) - (a.risk?.responsePriorityScore || 0)
  );

  const chartData = (activeZone?.weather?.hourlyHistory || []).map(pt => ({
    time: pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
    rainfall: pt.rainfall_mm,
    soilMoisture: Math.round((pt.soil_moisture_est || 0) * 100),
    humidity: pt.humidity_pct
  }));

  const handleSimulate = async () => {
    setSandboxRunning(true);
    await onTriggerSimulation(sandboxZoneId, sandboxRainMm);
    setTimeout(() => setSandboxRunning(false), 800);
  };

  const handleReset = async () => {
    setSandboxRunning(true);
    await onResetSimulation();
    setTimeout(() => setSandboxRunning(false), 800);
  };

  // 1-Click Simulation Scenario Presets
  const simulationPresets = [
    { label: '🌦️ Light Rain', rainMm: 15, desc: 'Normal hill showers' },
    { label: '🌧️ Heavy Monsoon', rainMm: 65, desc: 'Sustained slope soaking' },
    { label: '⛈️ Cloudburst', rainMm: 140, desc: 'Sudden flash downpour' },
    { label: '🌀 Cyclone / Extreme', rainMm: 220, desc: 'Catastrophic saturation' }
  ];

  // Calculate simulated risk level preview based on slider
  const targetSimZone = zones.find(z => z.zone?.id === sandboxZoneId) || zones[0];
  const simulatedScorePreview = Math.min(99, Math.round((targetSimZone?.risk?.riskScore || 30) + (sandboxRainMm * 0.35)));
  const simulatedLevelPreview = simulatedScorePreview >= 70 ? 'Critical' : simulatedScorePreview >= 40 ? 'High' : 'Moderate';

  const handleDispatchAction = (alertId: string, actionDesc: string) => {
    onTakeAlertAction(alertId, actionDesc, 'acknowledged');
    setActionSuccessMsg(`Dispatched: ${actionDesc}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Action Toast / Feedback notification */}
      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* 1. HUD Metrics with Plain-English Beginner Jargon Tooltips */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-950/20 shadow-lg">
          <div className="flex items-center justify-between text-xs text-red-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <span>Critical Hotspots</span>
              <InfoTooltip text="Sectors where rainfall has saturated the slope beyond holding limit. Immediate evacuation recommended." />
            </span>
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="font-data font-extrabold text-2xl text-red-400">
            {criticalCount} <span className="text-xs font-normal text-slate-400">Zones</span>
          </div>
          <div className="text-[11px] text-red-300/80 mt-1">Imminent slope failure threshold</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <span>High Risk Sectors</span>
              <InfoTooltip text="Areas experiencing sustained rainfall where slope stability is steadily decreasing. Keep on active alert." />
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-data font-extrabold text-2xl text-amber-400">
            {highCount} <span className="text-xs font-normal text-slate-400">Zones</span>
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">Sustained precipitation threshold</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-sky-500/30 bg-sky-950/20 shadow-lg">
          <div className="flex items-center justify-between text-xs text-sky-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <span>Exposed Population</span>
              <InfoTooltip text="Total estimated residents living within currently active red & orange alert sectors." />
            </span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="font-data font-extrabold text-2xl text-sky-300">
            {threatenedPopulation.toLocaleString()}
          </div>
          <div className="text-[11px] text-sky-300/80 mt-1">Across active warning sectors</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 shadow-lg">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <span>At-Risk Arteries</span>
              <InfoTooltip text="Key transport highways (like NH-10, NH-29, NH-06) traversing through hazardous slopes." />
            </span>
            <Route className="w-4 h-4 text-purple-500" />
          </div>
          <div className="font-data font-extrabold text-2xl text-purple-300">
            {blockedRoadsCount} <span className="text-xs font-normal text-slate-400">Roads</span>
          </div>
          <div className="text-[11px] text-purple-300/80 mt-1">NH & State Highway Corridors</div>
        </div>

      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Priority Response Center</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>🌧️ "What-If" Rain Simulator</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Interactive</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Field Reports Verification</span>
          {reports.length > 0 && (
            <span className="text-[10px] bg-sky-500/20 text-sky-950 px-1.5 py-0.5 rounded font-extrabold">
              {reports.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Tab 1: Overview & Priority Queue */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Priority Queue (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="font-heading font-extrabold text-base text-white">
                  Response Priority Queue
                </h3>
                <InfoTooltip text="Ranked automatically by AI considering slope angle, rain volume, and population density." />
              </div>
              <span className="text-xs text-slate-400">
                {priorityQueue.length} Sectors Monitored
              </span>
            </div>

            {/* Beginner-friendly Search & State Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search district, city or highway..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {states.map(st => (
                  <option key={st} value={st} className="bg-slate-900">
                    {st === 'all' ? 'All States' : st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {priorityQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                  No sectors match your search query "{searchQuery}".
                </div>
              ) : (
                priorityQueue.map((item) => {
                  const isSelected = item.zone?.id === activeZone?.zone?.id;
                  const rLevel = item.risk?.riskLevel || 'Low';
                  const matchingAlert = alerts.find(a => a.zoneId === item.zone?.id);

                  return (
                    <div
                      key={item.zone?.id}
                      onClick={() => onSelectZone(item.zone?.id)}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              rLevel === 'Critical' ? 'bg-red-500 animate-ping' : rLevel === 'High' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`} />
                            <h4 className="font-heading font-bold text-sm text-white">
                              {item.zone?.name}
                            </h4>
                            <span className="text-xs text-slate-400 font-mono">({item.zone?.state})</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                            {item.risk?.primaryDriver || item.risk?.keyDrivers?.[0] || 'Stable slope condition'}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className={`font-data font-extrabold text-sm ${
                            rLevel === 'Critical' ? 'text-red-400' : rLevel === 'High' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {item.risk?.riskScore || 0}% Risk
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">
                            {rLevel} Level
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span>Rain: <strong className="text-sky-400">{item.weather?.current?.rainfall_24h_mm?.toFixed(1) || 0}mm</strong></span>
                          <span>Soil: <strong className="text-amber-400">{item.risk?.simulatedSoilMoisturePct || 45}%</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenZoneModal(item);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            <span>Telemetry</span>
                          </button>

                          {matchingAlert && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispatchAction(matchingAlert.id, 'Dispatched SDRF Alert & CAP Evacuation Notice');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Dispatch Alert</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detailed Selected Sector & Live Sensor Graph (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Live Sector Radar
                  </span>
                  <h4 className="font-heading font-extrabold text-base text-white">
                    {activeZone?.zone?.name} ({activeZone?.zone?.state})
                  </h4>
                </div>
                <button
                  onClick={() => activeZone && onOpenZoneModal(activeZone)}
                  className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Full Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 24-Hour Telemetry Graph */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Rainfall & Soil Wetness History</span>
                  <span className="text-[11px] text-slate-400 font-mono">Past 24 Hours</span>
                </div>
                <div className="h-44 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="rainfall" name="Rain (mm)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorRain)" />
                      <Area type="monotone" dataKey="soilMoisture" name="Soil (%)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSoil)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Terrain Physics Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Slope Angle</span>
                    <InfoTooltip text="Steeper slopes (>30°) are significantly more vulnerable to rapid landslides under heavy downpours." />
                  </div>
                  <div className="font-heading font-bold text-white text-base mt-1">
                    {activeZone?.zone?.slope_deg}°
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Soil Formation</span>
                    <InfoTooltip text="Geological soil composition and cohesion against rainwater erosion." />
                  </div>
                  <div className="font-heading font-bold text-white text-xs mt-1 truncate">
                    {activeZone?.zone?.soil_type || 'Gneissic Clay Loam'}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 4. Tab 2: Interactive "What-If" Rainfall Simulator */}
      {activeTab === 'simulator' && (
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/30 via-slate-900/90 to-slate-950 shadow-2xl space-y-6">
          
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-white">
                  Interactive "What-If" Cloudburst & Rain Simulator
                </h3>
                <p className="text-xs text-slate-300">
                  Test disaster scenarios and watch the physics AI recalculate slope failure risks and road blockages in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={sandboxRunning}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sandboxRunning ? 'animate-spin' : ''}`} />
                <span>Reset to Live Feeds</span>
              </button>
            </div>
          </div>

          {/* Quick Scenario Presets Bar */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Quick 1-Click Weather Presets:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {simulationPresets.map(preset => (
                <button
                  key={preset.rainMm}
                  type="button"
                  onClick={() => setSandboxRainMm(preset.rainMm)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    sandboxRainMm === preset.rainMm
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{preset.label} (+{preset.rainMm}mm)</div>
                  <div className="text-[10px] text-slate-400">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left Slider & Controls (7 Cols) */}
            <div className="md:col-span-7 space-y-5">
              
              {/* Target Zone Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>Target Simulation Sector:</span>
                </label>
                <select
                  value={sandboxZoneId}
                  onChange={(e) => setSandboxZoneId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {zones.map(z => (
                    <option key={z.zone?.id} value={z.zone?.id}>
                      {z.zone?.name} ({z.zone?.state}) — Current: {z.risk?.riskLevel} ({z.risk?.riskScore}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Interactive Rainfall Slider */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-sky-400" />
                    <span>Injected Extra Rainfall:</span>
                  </span>
                  <span className="font-data font-black text-base text-sky-400">
                    +{sandboxRainMm} mm
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="250"
                  step="10"
                  value={sandboxRainMm}
                  onChange={(e) => setSandboxRainMm(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0mm (Normal)</span>
                  <span>75mm (Heavy Rain)</span>
                  <span>150mm (Severe Storm)</span>
                  <span>250mm (Cloudburst)</span>
                </div>
              </div>

              {/* Execute Simulation Button */}
              <button
                onClick={handleSimulate}
                disabled={sandboxRunning}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Zap className={`w-4 h-4 ${sandboxRunning ? 'animate-bounce' : ''}`} />
                <span>{sandboxRunning ? 'Recalculating Physics Model...' : 'Apply Simulation & Recalculate Risk'}</span>
              </button>

            </div>

            {/* Right Live Impact Preview (5 Cols) */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Predicted Simulation Outcome
              </span>

              <div className="flex flex-col items-center justify-center">
                <div className={`text-4xl font-heading font-black ${
                  simulatedLevelPreview === 'Critical' ? 'text-red-400' : simulatedLevelPreview === 'High' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {simulatedScorePreview}%
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                  simulatedLevelPreview === 'Critical' ? 'text-red-400' : simulatedLevelPreview === 'High' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {simulatedLevelPreview} Risk Level
                </div>
              </div>

              <div className="text-xs text-slate-300 text-left bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Physics Model Assessment:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {sandboxRainMm >= 150
                    ? '⚠️ Extreme soil liquefaction predicted. Factor of safety falls below 1.0. High risk of debris flow blocking connecting roads.'
                    : sandboxRainMm >= 80
                    ? '⚡ Saturated slope condition. Drainage channels will overflow. Caution advised on downhill roads.'
                    : '✅ Slope remains within normal stability limits.'}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 5. Tab 3: Crowdsourced Field Reports */}
      {activeTab === 'reports' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-base text-white">
                Crowdsourced Field Reports & Ground Evidence
              </h3>
              <p className="text-xs text-slate-400">
                Reports submitted by citizens, village responders, and road patrol engineers. Verify to update the official risk score.
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
              No field reports pending verification.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reports.map((report) => (
                <div key={report.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          report.severity.includes('Severe') || report.severity.includes('Debris')
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}>
                          {report.severity}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {report.affectedRoadName || 'Corridor Slope'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{report.description}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      report.isVerified
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {report.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Reported by: <strong>{report.reporterName || 'Citizen'}</strong> ({report.reporterRole})</span>
                    <button
                      onClick={() => onVerifyReport(report.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{report.isVerified ? 'Revoke' : 'Verify & Validate'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
