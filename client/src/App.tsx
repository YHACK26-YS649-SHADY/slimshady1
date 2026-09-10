import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { QuickStartGuide } from './components/common/QuickStartGuide';
import { RiskMap } from './components/gis/RiskMap';
import { AuthorityDashboard } from './components/dashboard/AuthorityDashboard';
import { PublicCommunityPortal } from './components/dashboard/PublicCommunityPortal';
import { FieldReportModal } from './components/reports/FieldReportModal';
import { ZoneDetailModal } from './components/modals/ZoneDetailModal';
import { api } from './services/api';
import type {
  ZoneWithRisk,
  EarlyWarningAlert,
  FieldReport,
  VulnerableRoad,
  HistoricalLandslide
} from './types';
import { WifiOff, BellRing, Loader2, X, Compass } from 'lucide-react';

export function App() {
  const [zones, setZones] = useState<ZoneWithRisk[]>([]);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [roads, setRoads] = useState<VulnerableRoad[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalLandslide[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ner-sk-01');
  const [modalZone, setModalZone] = useState<ZoneWithRisk | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'authority' | 'community'>('authority');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'as' | 'kha' | 'mz' | 'bn'>('en');
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wsConnected, setWsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataSourceLabel, setDataSourceLabel] = useState('Open-Meteo Live');
  const [cachedTime, setCachedTime] = useState<string | null>(null);

  // New Alert Toast Banner State & Dismiss tracking
  const [latestAlertToast, setLatestAlertToast] = useState<EarlyWarningAlert | null>(null);
  const [dismissedAlertKeys, setDismissedAlertKeys] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('dismanager_dismissed_alerts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleDismissToast = useCallback((alert: EarlyWarningAlert) => {
    setDismissedAlertKeys(prev => {
      const updated = new Set(prev);
      updated.add(alert.id);
      updated.add(`${alert.zoneId}-${alert.riskLevel}`);
      try {
        sessionStorage.setItem('dismanager_dismissed_alerts', JSON.stringify(Array.from(updated)));
      } catch {
        // ignore
      }
      return updated;
    });
    setLatestAlertToast(null);
  }, []);

  // 1. Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [zonesData, alertsData, roadsData, histData, repsData] = await Promise.all([
        api.getZones(),
        api.getAlerts(),
        api.getRoads(),
        api.getHistorical(),
        api.getReports()
      ]);

      if (zonesData && zonesData.length > 0) {
        setZones(zonesData);
        const source = zonesData[0].weather?.dataSource;
        setDataSourceLabel(
          source === 'live-weatherapi'
            ? 'WeatherAPI (Auth)'
            : source === 'live-openmeteo'
            ? 'Open-Meteo Live Radar'
            : 'Simulated Engine'
        );
      }
      setAlerts(alertsData || []);
      setRoads(roadsData || []);
      setHistoricalEvents(histData || []);
      setReports(repsData || []);
    } catch (err) {
      console.warn('Network fetch error, loading from local cache:', err);
      const cachedZonesStr = localStorage.getItem('ne_sentinel_cached_zones');
      if (cachedZonesStr) {
        const parsed = JSON.parse(cachedZonesStr);
        setZones(parsed.data || []);
        setCachedTime(new Date(parsed.timestamp).toLocaleTimeString());
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW registration skipped:', err);
      });
    }

    const handleOnline = () => {
      setIsOnline(true);
      setCachedTime(null);
      loadInitialData();
      api.syncOfflineReports().then(count => {
        if (count > 0) {
          console.log(`[PWA Sync] Successfully synced ${count} offline reports`);
          api.getReports().then(setReports);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setCachedTime(new Date().toLocaleTimeString());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadInitialData]);

  // 2. WebSocket Real-Time Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          console.log('[WebSocket] Connected to DisManager Stream');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'NEW_ALERT') {
              setAlerts(prev => [msg.alert, ...prev.filter(a => a.zoneId !== msg.alert.zoneId)]);
              
              const alertKey1 = msg.alert.id;
              const alertKey2 = `${msg.alert.zoneId}-${msg.alert.riskLevel}`;
              if (!dismissedAlertKeys.has(alertKey1) && !dismissedAlertKeys.has(alertKey2)) {
                setLatestAlertToast(msg.alert);
              }
            } else if (msg.type === 'ZONES_UPDATED') {
              api.getZones().then(setZones);
            } else if (msg.type === 'NEW_FIELD_REPORT') {
              setReports(prev => [msg.report, ...prev]);
            }
          } catch (e) {
            console.error('[WebSocket] Message parse error:', e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          setWsConnected(false);
          ws?.close();
        };
      } catch (err) {
        console.warn('WebSocket init exception:', err);
      }
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [dismissedAlertKeys]);

  // Handlers
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
  };

  const handleOpenZoneModal = (zone: ZoneWithRisk) => {
    setModalZone(zone);
  };

  const handleTakeAlertAction = async (alertId: string, actionName: string, status?: any) => {
    try {
      const res = await api.takeAlertAction(alertId, actionName, status);
      setAlerts(prev => prev.map(a => a.id === alertId ? res.alert : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSimulation = async (zoneId: string, extraRainMm: number) => {
    try {
      await api.triggerSimulationAnomaly(zoneId, extraRainMm);
      const updatedZones = await api.getZones();
      setZones(updatedZones);
      const updatedAlerts = await api.getAlerts();
      setAlerts(updatedAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSimulation = async () => {
    try {
      await api.resetSimulation();
      const updatedZones = await api.getZones();
      setZones(updatedZones);
      const updatedAlerts = await api.getAlerts();
      setAlerts(updatedAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFieldReport = async (reportData: Omit<FieldReport, 'id' | 'timestamp' | 'isVerified'>) => {
    const created = await api.submitReport(reportData);
    setReports(prev => [created, ...prev]);
    const updatedZones = await api.getZones();
    setZones(updatedZones);
  };

  const handleVerifyReport = async (reportId: string) => {
    try {
      const updated = await api.toggleVerifyReport(reportId);
      if (updated) {
        setReports(prev => prev.map(r => r.id === reportId ? updated : r));
        const updatedZones = await api.getZones();
        setZones(updatedZones);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedZone = zones.find(z => z.zone?.id === selectedZoneId) || zones[0] || null;
  const criticalAlertsCount = alerts.filter(a => a.riskLevel === 'Critical' && a.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0c0a12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* 1. System Header */}
      <Header
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        isOnline={isOnline}
        wsConnected={wsConnected}
        onRefresh={loadInitialData}
        isRefreshing={isRefreshing}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        criticalAlertsCount={criticalAlertsCount}
        dataSourceLabel={dataSourceLabel}
      />

      {/* 2. Offline / Low Connectivity Status Banner */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>
            <strong>Low Connectivity PWA Mode:</strong> Showing cached hazard data from {cachedTime || 'previous session'}. Field reports will sync automatically when connection restores.
          </span>
        </div>
      )}

      {/* 3. Real-Time Alert Toast Notification */}
      {latestAlertToast && (
        <div className="fixed top-16 right-4 z-[3000] max-w-md glass-panel-danger p-4 rounded-2xl border border-red-500/60 shadow-2xl transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-500 text-slate-950 flex-shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  CRITICAL EARLY WARNING ALERT
                </span>
                <button
                  onClick={() => handleDismissToast(latestAlertToast)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-heading font-extrabold text-sm text-white mt-0.5 truncate">
                {latestAlertToast.zoneName} ({latestAlertToast.state})
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {latestAlertToast.keyDriverSummary}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedZoneId(latestAlertToast.zoneId);
                    handleDismissToast(latestAlertToast);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-[11px] rounded-lg transition cursor-pointer shadow"
                >
                  Locate on GIS Map
                </button>
                <button
                  onClick={() => handleDismissToast(latestAlertToast)}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] rounded-lg border border-slate-700/60 transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        
        {zones.length === 0 && isRefreshing ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white">
              Connecting to DisManager Telemetry Stream...
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Fetching real-time precipitation, slope stability indices, and GIS infrastructure maps for the North Eastern Region.
            </p>
          </div>
        ) : (
          <>
            {/* Top Split: Interactive GIS Map */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <h2 className="font-heading font-extrabold text-base text-slate-100 flex items-center gap-1.5">
                    <span>NER Geospatial GIS Landslide Radar</span>
                  </h2>
                </div>
                <span className="text-xs text-amber-300/80 font-mono">
                  Center: 26.2°N, 92.8°E • {zones.length || 18} Monitored Hotspots
                </span>
              </div>

              <RiskMap
                zones={zones}
                roads={roads}
                historicalEvents={historicalEvents}
                fieldReports={reports}
                selectedZoneId={selectedZoneId}
                onSelectZone={handleSelectZone}
                onOpenZoneModal={handleOpenZoneModal}
              />
            </section>

            {/* Bottom Section: Active Dashboard Switcher */}
            {viewMode === 'authority' ? (
              <section>
                <AuthorityDashboard
                  zones={zones}
                  alerts={alerts}
                  roads={roads}
                  reports={reports}
                  selectedZone={selectedZone}
                  onSelectZone={handleSelectZone}
                  onOpenZoneModal={handleOpenZoneModal}
                  onTakeAlertAction={handleTakeAlertAction}
                  onTriggerSimulation={handleTriggerSimulation}
                  onResetSimulation={handleResetSimulation}
                  onVerifyReport={handleVerifyReport}
                />
              </section>
            ) : (
              <section>
                <PublicCommunityPortal
                  zones={zones}
                  alerts={alerts}
                  selectedLanguage={selectedLanguage}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  onSelectZone={handleSelectZone}
                />
              </section>
            )}
          </>
        )}

      </main>

      {/* 5. Modals */}
      <FieldReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleSubmitFieldReport}
        zones={zones}
        isOnline={isOnline}
      />

      <ZoneDetailModal
        isOpen={Boolean(modalZone)}
        zoneData={modalZone}
        onClose={() => setModalZone(null)}
      />

      <QuickStartGuide
        isOpen={isGuideOpen}
        onClose={() => {
          setIsGuideOpen(false);
          try { localStorage.setItem('dismanager_guide_seen', 'true'); } catch {}
        }}
        onSelectRole={(role) => {
          setViewMode(role);
          setIsGuideOpen(false);
          try { localStorage.setItem('dismanager_guide_seen', 'true'); } catch {}
        }}
      />

      {/* Floating Beginner Guide Launcher (Bottom-Left) */}
      <button
        onClick={() => setIsGuideOpen(true)}
        className="fixed bottom-5 left-5 z-[2000] flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-2xl border border-emerald-300/40 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="Open Beginner Guide & Help"
      >
        <Compass className="w-4 h-4 animate-spin-slow" />
        <span className="hidden sm:inline">💡 Help & Beginner Guide</span>
        <span className="sm:hidden">Help</span>
      </button>

      {/* 6. Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 mt-12 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-300">DisManager</span>
            <span>•</span>
            <span>AI Landslide & Disaster Early-Warning Platform for North Eastern India</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Powered by Physics-Informed ML + Open-Meteo Live Feeds + NDMA CAP Protocol</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
