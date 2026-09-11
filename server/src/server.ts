import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { ZoneData, riskModelInstance, RiskEvaluationResult } from './models/risk_model.js';
import { weatherServiceInstance, ZoneWeatherProfile } from './services/weatherService.js';
import { alertServiceInstance, EarlyWarningAlert } from './services/alertService.js';
import { reportServiceInstance, FieldReport } from './services/reportService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Resilient static seed dataset loader
function loadSeedDataset<T>(filename: string): T {
  const possiblePaths = [
    path.join(__dirname, 'data', filename),
    path.join(__dirname, '..', 'src', 'data', filename),
    path.join(__dirname, 'src', 'data', filename),
    path.join(process.cwd(), 'server', 'src', 'data', filename),
    path.join(process.cwd(), 'src', 'data', filename),
    path.join(process.cwd(), 'data', filename)
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {
      // Continue to next path
    }
  }
  console.warn(`[DisManager] Seed dataset ${filename} not found in searched paths, returning empty fallback.`);
  return [] as unknown as T;
}

const nerZones: ZoneData[] = loadSeedDataset<ZoneData[]>('ner_zones.json');
const historicalLandslides = loadSeedDataset<any[]>('historical_landslides.json');
const vulnerableRoads = loadSeedDataset<any[]>('vulnerable_roads.json');

// Create HTTP and WebSocket servers
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Store active WebSocket connections
const clients: Set<WebSocket> = new Set();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log(`[WebSocket] Client connected. Total active: ${clients.size}`);

  // Send current active alerts immediately upon connection
  const activeAlerts = alertServiceInstance.getActiveAlerts();
  ws.send(JSON.stringify({ type: 'INITIAL_ALERTS', alerts: activeAlerts }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WebSocket] Client disconnected. Total active: ${clients.size}`);
  });
});

function broadcastToClients(message: object) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Recalculates risk for all monitored NER zones and updates alerts.
 */
async function evaluateAllZones(broadcastUpdates = false): Promise<Array<{ zone: ZoneData; weather: ZoneWeatherProfile; risk: RiskEvaluationResult }>> {
  const results = [];

  for (const zone of nerZones) {
    const weatherProfile = await weatherServiceInstance.getWeatherForCoordinates(zone.id, zone.lat, zone.lon);
    const groundEvidence = reportServiceInstance.getZoneGroundEvidence(zone.id);

    const riskResult = riskModelInstance.evaluate(
      zone,
      weatherProfile.current,
      groundEvidence.reportCount,
      groundEvidence.hasSevere
    );

    // Process alerts only if newly triggered or escalated
    const { alert, isNewOrEscalated } = alertServiceInstance.processZoneEvaluation(zone, riskResult);
    if (isNewOrEscalated && alert && (alert.riskLevel === 'High' || alert.riskLevel === 'Critical')) {
      broadcastToClients({ type: 'NEW_ALERT', alert });
    }

    results.push({
      zone,
      weather: weatherProfile,
      risk: riskResult
    });
  }

  if (broadcastUpdates) {
    broadcastToClients({ type: 'ZONES_UPDATED', timestamp: new Date().toISOString() });
  }
  return results;
}

// REST API Endpoints

// 1. Health check & Data Source Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'DisManager Landslide & Disaster Early Warning System',
    region: 'North Eastern Region (NER), India',
    monitoredZonesCount: nerZones.length,
    activeAlertsCount: alertServiceInstance.getActiveAlerts().length,
    hasWeatherApiKey: Boolean(process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY !== 'YOUR_WEATHER_API_KEY'),
    openMeteoAvailable: true,
    timestamp: new Date().toISOString()
  });
});

// 2. Monitored Zones with Real-time Risk & Weather
app.get('/api/zones', async (req, res) => {
  try {
    const zonesWithRisk = await evaluateAllZones();
    res.json(zonesWithRisk);
  } catch (err) {
    console.error('[API] /api/zones error:', err);
    res.status(500).json({ error: 'Failed to evaluate zones' });
  }
});

// 3. Single Zone Details with Time Series
app.get('/api/zones/:id', async (req, res) => {
  const zone = nerZones.find(z => z.id === req.params.id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found' });
  }

  try {
    const weatherProfile = await weatherServiceInstance.getWeatherForCoordinates(zone.id, zone.lat, zone.lon);
    const groundEvidence = reportServiceInstance.getZoneGroundEvidence(zone.id);
    const reports = reportServiceInstance.getReportsForZone(zone.id);

    const riskResult = riskModelInstance.evaluate(
      zone,
      weatherProfile.current,
      groundEvidence.reportCount,
      groundEvidence.hasSevere
    );

    res.json({
      zone,
      weather: weatherProfile,
      risk: riskResult,
      reports
    });
  } catch (err) {
    console.error(`[API] /api/zones/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch zone details' });
  }
});

// 4. Live Weather for arbitrary lat/lon coordinates
app.get('/api/weather/:lat/:lon', async (req, res) => {
  const lat = parseFloat(req.params.lat);
  const lon = parseFloat(req.params.lon);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid lat/lon coordinates' });
  }

  try {
    const profile = await weatherServiceInstance.getWeatherForCoordinates('custom-coord', lat, lon);
    res.json(profile);
  } catch (err) {
    console.error('[API] /api/weather/:lat/:lon error:', err);
    res.status(500).json({ error: 'Weather fetch failed' });
  }
});

// 5. Force Poll / Refresh All
app.post('/api/weather/poll', async (req, res) => {
  try {
    const results = await evaluateAllZones();
    res.json({ message: 'Polled and recalculated all NER zones', count: results.length });
  } catch (err) {
    res.status(500).json({ error: 'Polling failed' });
  }
});

// 6. Alerts & Response Priority Queue
app.get('/api/alerts', (req, res) => {
  const alerts = alertServiceInstance.getActiveAlerts();
  res.json(alerts);
});

// 7. Authority Action on Alert
app.post('/api/alerts/:id/action', (req, res) => {
  const { actionName, newStatus } = req.body;
  if (!actionName) {
    return res.status(400).json({ error: 'actionName required' });
  }

  const updatedAlert = alertServiceInstance.updateAlertAction(req.params.id, actionName, newStatus);
  if (!updatedAlert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  broadcastToClients({ type: 'ALERT_UPDATED', alert: updatedAlert });
  res.json({ success: true, alert: updatedAlert });
});

// 8. Crowdsourced Field Reports
app.get('/api/reports', (req, res) => {
  res.json(reportServiceInstance.getAllReports());
});

app.post('/api/reports', async (req, res) => {
  try {
    const reportData = req.body;
    if (!reportData.latitude || !reportData.longitude || !reportData.description) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }

    // Associate with closest zone if not specified
    if (!reportData.zoneId) {
      let closestZone = nerZones[0];
      let minDistance = Infinity;
      for (const z of nerZones) {
        const d = Math.hypot(z.lat - reportData.latitude, z.lon - reportData.longitude);
        if (d < minDistance) {
          minDistance = d;
          closestZone = z;
        }
      }
      reportData.zoneId = closestZone.id;
    }

    const created = reportServiceInstance.addReport(reportData);

    // Re-evaluate affected zone so risk score immediately updates
    const zone = nerZones.find(z => z.id === reportData.zoneId);
    if (zone) {
      const weatherProfile = await weatherServiceInstance.getWeatherForCoordinates(zone.id, zone.lat, zone.lon);
      const groundEvidence = reportServiceInstance.getZoneGroundEvidence(zone.id);
      const riskResult = riskModelInstance.evaluate(
        zone,
        weatherProfile.current,
        groundEvidence.reportCount,
        groundEvidence.hasSevere
      );
      alertServiceInstance.processZoneEvaluation(zone, riskResult);
    }

    broadcastToClients({ type: 'NEW_FIELD_REPORT', report: created });
    res.status(201).json(created);
  } catch (err) {
    console.error('[API] /api/reports error:', err);
    res.status(500).json({ error: 'Failed to create field report' });
  }
});

app.patch('/api/reports/:id/verify', (req, res) => {
  const updated = reportServiceInstance.toggleVerification(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Report not found' });
  }
  broadcastToClients({ type: 'REPORT_VERIFIED', report: updated });
  res.json(updated);
});

// 9. Vulnerable Roads & Historical Disasters
app.get('/api/roads', (req, res) => {
  res.json(vulnerableRoads);
});

app.get('/api/historical', (req, res) => {
  res.json(historicalLandslides);
});

// 10. Simulation Sandbox Controls (For hackathon judges and scenario testing)
app.post('/api/simulation/anomaly', async (req, res) => {
  const { zoneId, extraRainMm, durationMinutes } = req.body;
  if (!zoneId || !extraRainMm) {
    return res.status(400).json({ error: 'zoneId and extraRainMm are required' });
  }

  weatherServiceInstance.triggerSimulationAnomaly(zoneId, extraRainMm, durationMinutes || 30);
  const updatedZones = await evaluateAllZones(true);

  res.json({
    message: `Simulation anomaly triggered on ${zoneId}: +${extraRainMm}mm precipitation`,
    updatedZones
  });
});

app.post('/api/simulation/reset', async (req, res) => {
  weatherServiceInstance.clearAllAnomalies();
  const updatedZones = await evaluateAllZones(true);
  res.json({ message: 'All simulation anomalies cleared. Reverted to live data.', count: updatedZones.length });
});

// Initial run and scheduled 15-min polling
evaluateAllZones().then(() => {
  console.log('[DisManager Engine] Initial risk evaluation completed across all 18 NER zones.');
});

setInterval(() => {
  console.log('[DisManager Engine] Scheduled 15-minute risk & weather update...');
  evaluateAllZones(true);
}, 15 * 60 * 1000);

// Start Server
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`📡 DisManager Early Warning Server active on port ${PORT}`);
  console.log(`⚡ WebSocket Stream ready at ws://localhost:${PORT}/ws`);
  console.log(`📍 Monitored NER Zones: ${nerZones.length}`);
  console.log(`=======================================================`);
});

export { app, server };
export default app;
