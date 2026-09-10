import React from 'react';
import { 
  Flame, 
  Radio, 
  WifiOff, 
  RotateCw, 
  CloudRain, 
  AlertTriangle, 
  PlusCircle, 
  Languages, 
  Users, 
  Compass, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface HeaderProps {
  viewMode: 'authority' | 'community';
  onToggleViewMode: (mode: 'authority' | 'community') => void;
  isOnline: boolean;
  wsConnected: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedLanguage: 'en' | 'hi' | 'as' | 'kha' | 'mz' | 'bn';
  onLanguageChange: (lang: 'en' | 'hi' | 'as' | 'kha' | 'mz' | 'bn') => void;
  onOpenReportModal: () => void;
  onOpenGuide: () => void;
  criticalAlertsCount: number;
  dataSourceLabel: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onToggleViewMode,
  isOnline,
  wsConnected,
  onRefresh,
  isRefreshing,
  selectedLanguage,
  onLanguageChange,
  onOpenReportModal,
  onOpenGuide,
  criticalAlertsCount,
  dataSourceLabel
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-amber-500/20 px-4 py-2.5 backdrop-blur-xl bg-[#0e0b16]/90 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 via-orange-500/30 to-red-500/40 border border-amber-500/50 shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-lg tracking-wider bg-gradient-to-r from-amber-300 via-orange-300 to-amber-100 bg-clip-text text-transparent">
                  DisManager
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded shadow-sm">
                  NER Sunset Radar
                </span>
              </div>
              <p className="text-[11px] text-amber-200/70 font-medium leading-none">
                AI Landslide Early-Warning & Citizen Safety
              </p>
            </div>
          </div>

          {/* Quick Guide & Report button (Mobile) */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOpenGuide}
              className="p-1.5 text-xs font-semibold bg-slate-900 text-amber-400 border border-amber-500/40 rounded-lg flex items-center gap-1 cursor-pointer"
              title="Help & Beginner Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenReportModal}
              className="px-2.5 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-lg flex items-center gap-1 transition shadow-md shadow-orange-500/25 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Report
            </button>
          </div>
        </div>

        {/* Center: Beginner-Friendly Status Badges */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          
          {/* Guide Quick Launcher */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold transition cursor-pointer shadow-sm shadow-amber-500/10"
            title="Open Interactive Quick Guide"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>💡 How It Works / Beginner Guide</span>
          </button>

          {/* Live Data Badge with Tooltip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181324] border border-amber-500/30 text-slate-200">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Weather:</span>
            <span className="font-semibold text-amber-300">{dataSourceLabel}</span>
            <InfoTooltip text="Live precipitation, humidity, and rainfall radar updated hourly from official meteorological feeds." />
          </div>

          {/* Connection Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
            isOnline && wsConnected 
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
              : isOnline
              ? 'bg-orange-950/40 border-orange-500/40 text-orange-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            {isOnline ? (
              <>
                <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'animate-pulse text-amber-400' : 'text-orange-400'}`} />
                <span>{wsConnected ? 'Live Stream Active' : 'Polling Sync'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Offline Safe Cache</span>
              </>
            )}
          </div>

          {/* Critical Hazard Alert */}
          {criticalAlertsCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/70 border border-red-500/60 text-red-300 animate-pulse shadow-md shadow-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="font-bold">{criticalAlertsCount} Red Alerts Active</span>
            </div>
          )}
        </div>

        {/* Right: Actions, Language Switcher & View Mode Toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          
          {/* View Mode Toggle Pill (Citizen vs Officer) */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#181324] border border-amber-500/30 shadow-inner">
            <button
              onClick={() => onToggleViewMode('community')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'community'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-amber-200'
              }`}
              title="Citizen Mode - Simple, clear safety advice and shelters"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Citizen Safety</span>
            </button>
            <button
              onClick={() => onToggleViewMode('authority')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'authority'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-400 hover:text-amber-200'
              }`}
              title="Authority Mode - Full GIS data, simulations, and telemetry"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Operations Desk</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="relative flex items-center bg-[#181324] border border-amber-500/30 rounded-xl px-2 py-1 text-xs">
            <Languages className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value as any)}
              className="bg-transparent text-amber-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              aria-label="Select Language"
            >
              <option value="en" className="bg-[#181324] text-slate-100">English</option>
              <option value="hi" className="bg-[#181324] text-slate-100">हिन्दी</option>
              <option value="as" className="bg-[#181324] text-slate-100">অসমীয়া</option>
              <option value="kha" className="bg-[#181324] text-slate-100">Khasi</option>
              <option value="mz" className="bg-[#181324] text-slate-100">Mizo</option>
              <option value="bn" className="bg-[#181324] text-slate-100">বাংলা</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Live Data"
            className="p-1.5 rounded-xl bg-[#181324] hover:bg-[#251d38] border border-amber-500/30 text-amber-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          {/* Report Button (Desktop) */}
          <button
            onClick={onOpenReportModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-orange-500/30 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Hazard</span>
          </button>

        </div>

      </div>
    </header>
  );
};
