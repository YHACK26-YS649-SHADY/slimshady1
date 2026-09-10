import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Marker,
  Popup,
  Tooltip
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  CloudRain,
  Droplets,
  History,
  Route,
  Camera,
  Maximize2,
  CheckCircle2,
  Mountain,
  Activity,
  Thermometer,
  Wind,
  Radio,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type {
  ZoneWithRisk,
  VulnerableRoad,
  HistoricalLandslide,
  FieldReport
} from '../../types';

// Helper for weather condition text and emoji based on live meteorological telemetry
const getWeatherInfo = (rainMm: number, humidity: number) => {
  if (rainMm > 25) return { condition: 'Cloudburst Downpour', emoji: '⛈️' };
  if (rainMm > 12) return { condition: 'Heavy Monsoonal Rain', emoji: '🌧️' };
  if (rainMm > 3) return { condition: 'Moderate Rainfall', emoji: '🌧️' };
  if (rainMm > 0.1) return { condition: 'Light Drizzle', emoji: '🌦️' };
  if (humidity > 85) return { condition: 'Overcast & Humid', emoji: '⛅' };
  return { condition: 'Clear / Partly Cloudy', emoji: '☀️' };
};

// Custom DivIcons
const createWeatherBadgeIcon = (weather: any, isSelected: boolean, riskColor: string) => {
  const current = weather.current;
  const { emoji } = getWeatherInfo(current.current_rainfall_mm_hr, current.humidity_pct);
  const temp = Math.round(current.temperature_c);
  const rain = current.current_rainfall_mm_hr.toFixed(1);
  const isRaining = current.current_rainfall_mm_hr > 0.2;

  return L.divIcon({
    className: 'custom-weather-badge',
    html: `
      <div style="
        background: rgba(10, 16, 30, 0.92);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: ${isSelected ? '2px solid #38bdf8' : isRaining ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.22)'};
        padding: 3px 8px;
        border-radius: 9999px;
        color: white;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.7);
        white-space: nowrap;
        transform: translate(-50%, -150%);
        pointer-events: auto;
        cursor: pointer;
      ">
        <span style="font-size: 13px;">${emoji}</span>
        <span style="color: #f8fafc;">${temp}°C</span>
        ${isRaining ? `<span style="color: #38bdf8; font-weight: 800;">${rain}mm/h</span>` : ''}
        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${riskColor}; display: inline-block;"></span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const createReportIcon = (isVerified: boolean, severity: string) => {
  const isSevere = severity.includes('Severe') || severity.includes('Debris');
  const bgColor = isSevere ? '#ef4444' : isVerified ? '#10b981' : '#f59e0b';
  return L.divIcon({
    className: 'custom-field-pin',
    html: `
      <div style="
        background: ${bgColor};
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px ${bgColor};
      ">
        <span style="color: black; font-size: 11px; font-weight: bold;">📍</span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 26]
  });
};

const createHistoricalIcon = () => {
  return L.divIcon({
    className: 'custom-hist-pin',
    html: `
      <div style="
        background: #64748b;
        width: 22px;
        height: 22px;
        border-radius: 4px;
        border: 1.5px solid #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.85;
      ">
        <span style="color: #ffffff; font-size: 10px; font-weight: 900;">⚡</span>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

interface RiskMapProps {
  zones: ZoneWithRisk[];
  roads: VulnerableRoad[];
  historicalEvents: HistoricalLandslide[];
  fieldReports: FieldReport[];
  selectedZoneId?: string;
  onSelectZone: (zoneId: string) => void;
  onOpenZoneModal: (zone: ZoneWithRisk) => void;
}

export const RiskMap: React.FC<RiskMapProps> = ({
  zones,
  roads,
  historicalEvents,
  fieldReports,
  selectedZoneId,
  onSelectZone,
  onOpenZoneModal
}) => {
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showWeatherBadges, setShowWeatherBadges] = useState(true);
  const [showRainfall, setShowRainfall] = useState(true);
  const [showSoilMoisture, setShowSoilMoisture] = useState(false);
  const [showRoads, setShowRoads] = useState(true);
  const [showHistorical, setShowHistorical] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [isWeatherHudOpen, setIsWeatherHudOpen] = useState(true);

  const [mapStyle, setMapStyle] = useState<'satellite' | 'topo' | 'dark' | 'osm'>('satellite');

  const centerLat = 26.2;
  const centerLon = 92.8;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Moderate': return '#eab308';
      default: return '#10b981';
    }
  };

  const isRoadAtRisk = (road: VulnerableRoad) => {
    return road.associated_zone_ids.some(zId => {
      const z = zones.find(item => item.zone.id === zId);
      return z && (z.risk.riskLevel === 'High' || z.risk.riskLevel === 'Critical');
    });
  };

  // Find currently selected zone or fallback to highest rainfall zone
  const activeZone = zones.find(z => z.zone.id === selectedZoneId) || 
    [...zones].sort((a, b) => b.weather.current.current_rainfall_mm_hr - a.weather.current.current_rainfall_mm_hr)[0] || 
    zones[0];

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950 flex flex-col">
      
      {/* Tactical Floating GIS Toolbar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-[calc(100%-24px)] flex-wrap">
        <div className="glass-panel px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-lg flex-wrap">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="text-slate-300">GIS Layers:</span>

          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition ${
              showRiskZones
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            Hazard Zones
          </button>

          <button
            onClick={() => setShowWeatherBadges(!showWeatherBadges)}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
              showWeatherBadges
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Thermometer className="w-3 h-3" />
            Live Weather Pins
          </button>

          <button
            onClick={() => setShowRainfall(!showRainfall)}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
              showRainfall
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            Rainfall
          </button>

          <button
            onClick={() => setShowSoilMoisture(!showSoilMoisture)}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
              showSoilMoisture
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Droplets className="w-3 h-3" />
            Soil SMAP
          </button>

          <button
            onClick={() => setShowRoads(!showRoads)}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
              showRoads
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Route className="w-3 h-3" />
            Highways
          </button>

          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
              showHistorical
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <History className="w-3 h-3" />
            Historical
          </button>

          <button
            onClick={() => setShowReports(!showReports)}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
              showReports
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Camera className="w-3 h-3" />
            Field Pins ({fieldReports.length})
          </button>
        </div>

        {/* Multi-style Basemap Switcher */}
        <div className="glass-panel px-2 py-1 rounded-xl flex items-center gap-1 text-xs shadow-lg">
          <Mountain className="w-3.5 h-3.5 text-emerald-400 ml-1" />
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
              mapStyle === 'satellite' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛰️ Satellite Terrain
          </button>
          <button
            onClick={() => setMapStyle('topo')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
              mapStyle === 'topo' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⛰️ Topography
          </button>
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
              mapStyle === 'dark' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tactical Dark
          </button>
          <button
            onClick={() => setMapStyle('osm')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
              mapStyle === 'osm' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {/* Floating Real-Time Meteorological HUD Panel (Top Right) */}
      {activeZone && (
        <div className="absolute top-3 right-3 z-[1000] glass-panel rounded-2xl p-3 text-xs max-w-xs shadow-2xl border border-sky-500/30 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                Live Weather Radar
              </span>
            </div>
            <button
              onClick={() => setIsWeatherHudOpen(!isWeatherHudOpen)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition"
            >
              {isWeatherHudOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-bold text-white text-sm truncate max-w-[170px]">
                {activeZone.zone.name}
              </div>
              <div className="text-[10px] text-slate-400">
                {activeZone.zone.district}, {activeZone.zone.state}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl leading-none">
                {getWeatherInfo(activeZone.weather.current.current_rainfall_mm_hr, activeZone.weather.current.humidity_pct).emoji}
              </span>
              <span className="font-extrabold text-base text-white ml-1.5">
                {Math.round(activeZone.weather.current.temperature_c)}°C
              </span>
            </div>
          </div>

          {isWeatherHudOpen && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-sky-200 font-semibold bg-sky-950/50 px-2 py-1 rounded-lg border border-sky-500/20 flex items-center justify-between">
                <span>{getWeatherInfo(activeZone.weather.current.current_rainfall_mm_hr, activeZone.weather.current.humidity_pct).condition}</span>
                <span className="text-[10px] text-sky-400 font-mono">{activeZone.weather.current.humidity_pct}% Humidity</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-sky-400" />
                    <span>Live Rain</span>
                  </div>
                  <div className="font-bold text-sky-300 font-mono mt-0.5">
                    {activeZone.weather.current.current_rainfall_mm_hr.toFixed(1)} mm/h
                  </div>
                </div>

                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-teal-400" />
                    <span>24h Accum.</span>
                  </div>
                  <div className="font-bold text-teal-300 font-mono mt-0.5">
                    {activeZone.weather.current.rainfall_24h_mm.toFixed(1)} mm
                  </div>
                </div>

                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-amber-400" />
                    <span>Wind Speed</span>
                  </div>
                  <div className="font-bold text-slate-200 font-mono mt-0.5">
                    {activeZone.weather.current.wind_speed_kmh.toFixed(0)} km/h
                  </div>
                </div>

                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span>Soil SMAP</span>
                  </div>
                  <div className="font-bold text-purple-300 font-mono mt-0.5">
                    {activeZone.risk.simulatedSoilMoisturePct}%
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">7-Day Rain: <strong className="text-slate-200">{activeZone.weather.current.rainfall_7d_mm.toFixed(0)} mm</strong></span>
                <span className="text-slate-400">48h Rain: <strong className="text-cyan-300">{activeZone.weather.current.rainfall_48h_mm.toFixed(0)} mm</strong></span>
              </div>

              <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-0.5 font-mono">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Source: {activeZone.weather.dataSource === 'live-weatherapi' ? 'WeatherAPI Live' : 'Open-Meteo Global Radar'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-[1000] glass-panel p-3 rounded-xl shadow-xl text-xs max-w-xs pointer-events-auto border border-slate-700/60">
        <div className="font-heading font-bold text-slate-200 mb-2 flex items-center justify-between">
          <span>Map Telemetry Legend</span>
          <Activity className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            <span className="text-slate-300">Critical (80-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-300">High (60-79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-slate-300">Moderate (35-59)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Low (0-34)</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-slate-800">
            <span className="w-3 h-0.5 bg-rose-500 border border-rose-400" />
            <span className="text-rose-300 font-medium">Highway at Risk of Blockage</span>
          </div>
        </div>
      </div>

      {/* Leaflet Core Container */}
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={7}
        scrollWheelZoom={true}
        className="w-full h-full flex-1 z-0"
      >
        {/* High-Resolution Satellite & Terrain Hybrid (Default) */}
        {mapStyle === 'satellite' && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          </>
        )}

        {/* Topographic Relief for Slope Analysis */}
        {mapStyle === 'topo' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; World Topo Map'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* Tactical Dark (Clean Esri Dark Canvas - Zero Watermarks) */}
        {mapStyle === 'dark' && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
          </>
        )}

        {/* Standard OpenStreetMap */}
        {mapStyle === 'osm' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* Vulnerable Roads */}
        {showRoads && roads.map((road) => {
          const atRisk = isRoadAtRisk(road);
          const latLngs: [number, number][] = road.coordinates.map(([lon, lat]) => [lat, lon]);

          return (
            <Polyline
              key={road.id}
              positions={latLngs}
              pathOptions={{
                color: atRisk ? '#ef4444' : '#38bdf8',
                weight: atRisk ? 4.5 : 2.5,
                dashArray: atRisk ? '6, 6' : undefined,
                opacity: atRisk ? 0.95 : 0.65
              }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1">
                  <div className="font-bold text-white">{road.name}</div>
                  <div className={`text-[10px] font-semibold ${atRisk ? 'text-rose-400' : 'text-sky-400'}`}>
                    {atRisk ? '⚠️ AT RISK OF IMMINENT LANDSLIDE BLOCKAGE' : 'Status: Normal Transit'}
                  </div>
                  <div className="text-[10px] text-slate-300">Length: {road.length_km} km</div>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Real-time Rainfall Intensity Dispersion Halos */}
        {showRainfall && zones.map((item) => {
          const { zone, weather } = item;
          const rain = weather.current.current_rainfall_mm_hr;
          if (rain < 0.5) return null;

          return (
            <CircleMarker
              key={`rain-halo-${zone.id}`}
              center={[zone.lat, zone.lon]}
              radius={Math.min(45, Math.max(16, rain * 2.2))}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#0284c7',
                fillOpacity: Math.min(0.35, 0.08 + (rain / 80)),
                weight: 1,
                dashArray: '3, 4'
              }}
            />
          );
        })}

        {/* Hazard Zones */}
        {showRiskZones && zones.map((item) => {
          const { zone, weather, risk } = item;
          const isSelected = selectedZoneId === zone.id;
          const riskColor = getRiskColor(risk.riskLevel);
          const isCritical = risk.riskLevel === 'Critical';

          return (
            <React.Fragment key={zone.id}>
              {/* Core Risk Dot Marker */}
              <CircleMarker
                center={[zone.lat, zone.lon]}
                radius={isCritical ? 18 : isSelected ? 16 : 12}
                pathOptions={{
                  color: isSelected ? '#ffffff' : riskColor,
                  fillColor: riskColor,
                  fillOpacity: isCritical ? 0.85 : 0.65,
                  weight: isSelected ? 3 : isCritical ? 2.5 : 1.5
                }}
                eventHandlers={{
                  click: () => onSelectZone(zone.id)
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="text-xs p-1">
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>{getWeatherInfo(weather.current.current_rainfall_mm_hr, weather.current.humidity_pct).emoji}</span>
                      <span>{zone.name}</span>
                    </div>
                    <div className="text-[10px] text-sky-300 font-mono">
                      {Math.round(weather.current.temperature_c)}°C • {weather.current.current_rainfall_mm_hr.toFixed(1)} mm/h rain
                    </div>
                    <div className="text-[10px] text-teal-300">
                      Soil Saturation: {risk.simulatedSoilMoisturePct}%
                    </div>
                  </div>
                </Tooltip>

                <Popup className="custom-leaflet-popup">
                  <div className="p-3 max-w-[290px] text-slate-100 font-sans">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-white leading-snug">
                          {zone.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">{zone.district}, {zone.state}</p>
                      </div>
                      <span
                        className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full text-slate-950"
                        style={{ backgroundColor: riskColor }}
                      >
                        {risk.riskLevel}
                      </span>
                    </div>

                    {/* Real-time Weather Telemetry Card */}
                    <div className="bg-sky-950/40 p-2 rounded-xl border border-sky-500/30 mb-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-sky-200 mb-1.5">
                        <span className="flex items-center gap-1">
                          <span>{getWeatherInfo(weather.current.current_rainfall_mm_hr, weather.current.humidity_pct).emoji}</span>
                          <span>{getWeatherInfo(weather.current.current_rainfall_mm_hr, weather.current.humidity_pct).condition}</span>
                        </span>
                        <span className="text-white text-xs">{Math.round(weather.current.temperature_c)}°C</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                        <div>Rain: <strong className="text-sky-300">{weather.current.current_rainfall_mm_hr.toFixed(1)} mm/h</strong></div>
                        <div>24h Total: <strong className="text-teal-300">{weather.current.rainfall_24h_mm.toFixed(1)} mm</strong></div>
                        <div>Wind: <strong className="text-amber-300">{weather.current.wind_speed_kmh.toFixed(0)} km/h</strong></div>
                        <div>Humidity: <strong className="text-purple-300">{weather.current.humidity_pct}%</strong></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                      <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">AI Risk Score</span>
                        <span className="font-data font-bold text-sm" style={{ color: riskColor }}>
                          {risk.riskScore}/100
                        </span>
                      </div>

                      <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Soil Moisture</span>
                        <span className="font-data font-bold text-sm text-teal-400">
                          {risk.simulatedSoilMoisturePct}%
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 mb-3">
                      <span className="text-amber-400 font-semibold block mb-0.5">Primary Driver:</span>
                      {risk.keyDrivers[0] || 'Standard geological equilibrium'}
                    </div>

                    <button
                      onClick={() => onOpenZoneModal(item)}
                      className="w-full py-1.5 px-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>View AI Risk Telemetry & Trends</span>
                    </button>
                  </div>
                </Popup>
              </CircleMarker>

              {/* Floating Real-Time Weather Badge Marker */}
              {showWeatherBadges && (
                <Marker
                  position={[zone.lat, zone.lon]}
                  icon={createWeatherBadgeIcon(weather, isSelected, riskColor)}
                  eventHandlers={{
                    click: () => onSelectZone(zone.id)
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Historical Landslides */}
        {showHistorical && historicalEvents.map((ev) => (
          <Marker
            key={ev.id}
            position={[ev.lat, ev.lon]}
            icon={createHistoricalIcon()}
          >
            <Popup>
              <div className="p-2.5 max-w-[260px] text-xs">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
                  <History className="w-3.5 h-3.5" />
                  <span>Historical Landslide ({ev.date})</span>
                </div>
                <div className="font-semibold text-white mb-1">{ev.location}</div>
                <div className="text-slate-300 text-[11px] mb-2">{ev.description}</div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800">
                  <div>Casualties: <strong className="text-rose-400">{ev.casualties}</strong></div>
                  <div>Trigger Rain: <strong className="text-sky-400">{ev.rainfall_trigger_mm_24h} mm</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Field Reports */}
        {showReports && fieldReports.map((rep) => (
          <Marker
            key={rep.id}
            position={[rep.latitude, rep.longitude]}
            icon={createReportIcon(rep.isVerified, rep.severity)}
          >
            <Popup>
              <div className="p-2.5 max-w-[260px] text-xs">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    📍 {rep.severity}
                  </span>
                  {rep.isVerified ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-[11px] mb-2">{rep.description}</p>
                <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                  Reported by: <strong className="text-slate-200">{rep.reporterName}</strong> ({rep.reporterRole})
                  {rep.crackWidthCm && <div>Crack Width: <strong className="text-amber-400">{rep.crackWidthCm} cm</strong></div>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {/* Beginner Friendly Helper Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-300 z-10">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">💡 Quick Tip</span>
          <span className="text-slate-300">Click any zone or weather pin on the map to view instant local radar and emergency relief shelters.</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> 🟢 Safe (0-40%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 🟡 Watch (40-70%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> 🔴 Danger (70%+)</span>
        </div>
      </div>
    </div>
  );
};

