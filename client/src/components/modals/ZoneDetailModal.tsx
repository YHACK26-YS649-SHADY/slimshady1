import React from 'react';
import {
  X,
  Mountain,
  Droplets,
  CloudRain,
  Activity,
  Route,
  Users,
  CheckSquare,
  Radio
} from 'lucide-react';
import type { ZoneWithRisk } from '../../types';

interface ZoneDetailModalProps {
  zoneData: ZoneWithRisk | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ZoneDetailModal: React.FC<ZoneDetailModalProps> = ({
  zoneData,
  isOpen,
  onClose
}) => {
  if (!isOpen || !zoneData) return null;

  const { zone, weather, risk } = zoneData;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Moderate': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const riskColor = getRiskColor(risk.riskLevel);

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-[#08060cb3] backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-2xl bg-[#0e0c15]/95 my-8 max-h-[90vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-amber-200/60 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-amber-500/20 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase">
                {zone.id}
              </span>
              <span
                className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full text-slate-950 shadow-sm"
                style={{ backgroundColor: riskColor }}
              >
                {risk.riskLevel} Risk Alert
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-white tracking-tight">
              {zone.name}
            </h2>
            <p className="text-xs text-amber-200/70">
              {zone.district}, {zone.state} • Coordinates: {zone.lat.toFixed(4)}°N, {zone.lon.toFixed(4)}°E
            </p>
          </div>

          <div className="text-right shrink-0 bg-[#161224] p-3 rounded-xl border border-amber-500/20">
            <span className="text-[10px] text-amber-200/60 uppercase font-bold block">Aggregated AI Score</span>
            <span className="font-data font-extrabold text-3xl" style={{ color: riskColor }}>
              {risk.riskScore}
              <span className="text-xs font-normal text-amber-200/50"> /100</span>
            </span>
          </div>
        </div>

        {/* 4-Card Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">

          <div className="bg-[#161224]/80 p-3 rounded-xl border border-amber-500/15">
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span>Current Rain</span>
              <CloudRain className="w-4 h-4" />
            </div>
            <div className="font-data font-bold text-lg text-white">
              {weather.current.current_rainfall_mm_hr.toFixed(1)} <span className="text-xs font-normal text-amber-200/50">mm/h</span>
            </div>
            <div className="text-[10px] text-amber-200/60 mt-0.5">24h Cum: {weather.current.rainfall_24h_mm} mm</div>
          </div>

          <div className="bg-[#161224]/80 p-3 rounded-xl border border-amber-500/15">
            <div className="flex items-center justify-between text-xs text-orange-400 mb-1">
              <span>Soil Moisture</span>
              <Droplets className="w-4 h-4" />
            </div>
            <div className="font-data font-bold text-lg text-white">
              {risk.simulatedSoilMoisturePct}%
            </div>
            <div className="text-[10px] text-amber-200/60 mt-0.5">NASA SMAP Decay Model</div>
          </div>

          <div className="bg-[#161224]/80 p-3 rounded-xl border border-amber-500/15">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
              <span>Slope & Relief</span>
              <Mountain className="w-4 h-4" />
            </div>
            <div className="font-data font-bold text-lg text-white">
              {zone.slope_deg}°
            </div>
            <div className="text-[10px] text-amber-200/60 mt-0.5">Elevation: {zone.elevation_m}m</div>
          </div>

          <div className="bg-[#161224]/80 p-3 rounded-xl border border-amber-500/15">
            <div className="flex items-center justify-between text-xs text-orange-300 mb-1">
              <span>SAR InSAR Creep</span>
              <Radio className="w-4 h-4" />
            </div>
            <div className="font-data font-bold text-lg text-white">
              {(zone.sar_coherence_loss * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-amber-200/60 mt-0.5">Sentinel-1 Coherence Loss</div>
          </div>

        </div>

        {/* Explainable AI Decision Breakdown */}
        <div className="bg-[#161224]/90 p-4 rounded-xl border border-amber-500/20 mb-6">
          <h4 className="font-heading font-bold text-sm text-amber-400 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            Physics & Machine Learning Multi-Factor Calibration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between text-slate-200">
                <span>Rainfall Intensity (Weight: 35%)</span>
                <span className="font-mono text-amber-400 font-bold">+{risk.featureContributions.rainfall} / 35</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span>Soil Moisture Saturation (Weight: 25%)</span>
                <span className="font-mono text-orange-400 font-bold">+{risk.featureContributions.soil_saturation} / 25</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span>Slope Angle & Geomorphology (Weight: 18%)</span>
                <span className="font-mono text-amber-300 font-bold">+{risk.featureContributions.slope_terrain} / 18</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-200">
                <span>Geological Fault Proximity (Weight: 12%)</span>
                <span className="font-mono text-orange-400 font-bold">+{risk.featureContributions.geology_faults} / 12</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span>Earth Observation SAR Coherence (Weight: 10%)</span>
                <span className="font-mono text-amber-400 font-bold">+{risk.featureContributions.satellite_displacement} / 10</span>
              </div>
              <div className="flex justify-between text-slate-200">
                <span>Field Reports Ground Evidence Boost</span>
                <span className="font-mono text-emerald-400 font-bold">+{risk.featureContributions.crowdsourced_boost} pts</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-500/15 text-xs">
            <span className="text-amber-400 font-bold block mb-1">Key Contributing Drivers:</span>
            <ul className="list-disc list-inside text-amber-100/90 space-y-1">
              {risk.keyDrivers.map((driver, i) => (
                <li key={i}>{driver}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Infrastructure & Vulnerable Settlements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          <div className="bg-[#161224] p-4 rounded-xl border border-amber-500/20 text-xs">
            <h4 className="font-heading font-bold text-amber-200 mb-2 flex items-center gap-1.5">
              <Route className="w-4 h-4 text-orange-400" />
              Critical Arterial Infrastructure
            </h4>
            <ul className="space-y-1.5 text-slate-200">
              {zone.critical_infrastructure.map((infra, i) => (
                <li key={i} className="flex items-center gap-1.5 bg-[#0e0c15] p-2 rounded-lg border border-amber-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>{infra}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#161224] p-4 rounded-xl border border-amber-500/20 text-xs">
            <h4 className="font-heading font-bold text-amber-200 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              High Vulnerability Settlements
            </h4>
            <ul className="space-y-1.5 text-slate-200">
              {zone.vulnerable_villages.map((village, i) => (
                <li key={i} className="flex items-center gap-1.5 bg-[#0e0c15] p-2 rounded-lg border border-amber-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{village}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Standard Operating Procedure (SOP) Actions */}
        <div className="bg-[#161224] p-4 rounded-xl border border-amber-500/20 text-xs">
          <h4 className="font-heading font-bold text-amber-400 mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-orange-400" />
            Standard Operating Procedure (SOP) Action Checklist
          </h4>
          <div className="space-y-2">
            {risk.recommendedActions.map((act, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-[#0e0c15] border border-amber-500/15 flex items-center gap-2 text-slate-200">
                <span className="text-amber-400 font-bold">✔</span>
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
