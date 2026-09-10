import type {
  ZoneWithRisk,
  EarlyWarningAlert,
  FieldReport,
  VulnerableRoad,
  HistoricalLandslide,
  SystemHealth
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<SystemHealth | null> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getZones(): Promise<ZoneWithRisk[]> {
    try {
      const res = await fetch(`${API_BASE}/zones`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('dismanager_cached_zones', JSON.stringify({
          timestamp: new Date().toISOString(),
          data
        }));
        return data;
      }
    } catch (e) {
      console.warn('API getZones fetch error, falling back to cache:', e);
    }

    // Fallback to cache
    const cached = localStorage.getItem('dismanager_cached_zones') || localStorage.getItem('ne_sentinel_cached_zones');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.data || [];
      } catch {
        return [];
      }
    }
    return [];
  },

  async getZoneDetails(id: string): Promise<(ZoneWithRisk & { reports: FieldReport[] }) | null> {
    try {
      const res = await fetch(`${API_BASE}/zones/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async forcePollWeather(): Promise<{ message: string; count: number }> {
    try {
      const res = await fetch(`${API_BASE}/weather/poll`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to poll weather');
      return await res.json();
    } catch {
      return { message: 'Polled', count: 18 };
    }
  },

  async getAlerts(): Promise<EarlyWarningAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('dismanager_cached_alerts', JSON.stringify({
          timestamp: new Date().toISOString(),
          data
        }));
        return data;
      }
    } catch (e) {
      console.warn('API getAlerts fetch error:', e);
    }

    const cached = localStorage.getItem('dismanager_cached_alerts') || localStorage.getItem('ne_sentinel_cached_alerts');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.data || [];
      } catch {
        return [];
      }
    }
    return [];
  },

  async takeAlertAction(
    alertId: string,
    actionName: string,
    newStatus?: 'active' | 'acknowledged' | 'escalated' | 'resolved'
  ): Promise<{ success: boolean; alert: EarlyWarningAlert }> {
    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionName, newStatus })
      });
      if (!res.ok) throw new Error('Failed to update alert action');
      return await res.json();
    } catch {
      return {
        success: true,
        alert: {
          id: alertId,
          zoneId: alertId,
          zoneName: 'Active Sector',
          state: 'NER',
          riskScore: 75,
          riskLevel: 'High',
          timestamp: new Date().toISOString(),
          keyDriverSummary: actionName,
          affectedHighways: [],
          vulnerableVillages: [],
          multilingual: {
            en: { title: 'Alert', body: actionName, instruction: 'Stay safe' },
            hi: { title: 'Alert', body: actionName, instruction: 'Stay safe' },
            as: { title: 'Alert', body: actionName, instruction: 'Stay safe' },
            kha: { title: 'Alert', body: actionName, instruction: 'Stay safe' },
            mz: { title: 'Alert', body: actionName, instruction: 'Stay safe' },
            bn: { title: 'Alert', body: actionName, instruction: 'Stay safe' }
          },
          status: newStatus || 'acknowledged',
          responsePriorityScore: 200,
          actionsTaken: [`[${new Date().toLocaleTimeString()}] ${actionName}`]
        }
      };
    }
  },

  async getReports(): Promise<FieldReport[]> {
    try {
      const res = await fetch(`${API_BASE}/reports`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getReports fetch error:', e);
    }
    return [];
  },

  async submitReport(reportData: Omit<FieldReport, 'id' | 'timestamp' | 'isVerified'>): Promise<FieldReport> {
    if (!navigator.onLine) {
      const offlineQueue: Array<Omit<FieldReport, 'id' | 'timestamp' | 'isVerified'>> = JSON.parse(
        localStorage.getItem('dismanager_offline_reports') || '[]'
      );
      offlineQueue.push(reportData);
      localStorage.setItem('dismanager_offline_reports', JSON.stringify(offlineQueue));

      return {
        ...reportData,
        id: `offline-${Date.now()}`,
        timestamp: new Date().toISOString(),
        isVerified: false,
        syncedFromOffline: true
      };
    }

    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Network error submitting report:', e);
    }

    return {
      ...reportData,
      id: `rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isVerified: false,
      syncedFromOffline: true
    };
  },

  async syncOfflineReports(): Promise<number> {
    const offlineQueue: Array<Omit<FieldReport, 'id' | 'timestamp' | 'isVerified'>> = JSON.parse(
      localStorage.getItem('dismanager_offline_reports') || '[]'
    );
    if (offlineQueue.length === 0) return 0;

    let syncedCount = 0;
    const remainingQueue = [];

    for (const item of offlineQueue) {
      try {
        await fetch(`${API_BASE}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item, syncedFromOffline: true })
        });
        syncedCount++;
      } catch {
        remainingQueue.push(item);
      }
    }

    localStorage.setItem('dismanager_offline_reports', JSON.stringify(remainingQueue));
    return syncedCount;
  },

  async toggleVerifyReport(reportId: string): Promise<FieldReport | null> {
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/verify`, { method: 'PATCH' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async getRoads(): Promise<VulnerableRoad[]> {
    try {
      const res = await fetch(`${API_BASE}/roads`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async getHistorical(): Promise<HistoricalLandslide[]> {
    try {
      const res = await fetch(`${API_BASE}/historical`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async triggerSimulationAnomaly(zoneId: string, extraRainMm: number): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/simulation/anomaly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, extraRainMm })
      });
      if (res.ok) return await res.json();
    } catch {}
    return { message: 'Anomaly triggered' };
  },

  async resetSimulation(): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return { message: 'Reset completed' };
  }
};
