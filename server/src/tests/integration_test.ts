import { WebSocket } from 'ws';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('   NE-SENTINEL FULL-STACK AUTOMATED VERIFICATION SUITE');
  console.log('====================================================');

  const BASE_URL = 'http://localhost:5000/api';
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, (err as Error).message);
      failed++;
    }
  }

  // 1. Health Endpoint
  await test('GET /api/health - System Status & Providers', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error('Unhealthy status');
    if (data.monitoredZonesCount !== 18) throw new Error(`Expected 18 zones, got ${data.monitoredZonesCount}`);
  });

  // 2. Monitored Zones
  let zoneId = '';
  await test('GET /api/zones - 18 NER Monitored Zones with Live Weather & Risk', async () => {
    const res = await fetch(`${BASE_URL}/zones`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length !== 18) throw new Error(`Expected 18 zones array, got ${data.length}`);
    zoneId = data[0].zone.id;
    if (typeof data[0].risk.riskScore !== 'number') throw new Error('Missing riskScore');
    if (!data[0].risk.featureContributions) throw new Error('Missing explainable feature contributions');
  });

  // 3. Single Zone Details
  await test(`GET /api/zones/${zoneId} - Deep-Dive Telemetry & Time Series`, async () => {
    const res = await fetch(`${BASE_URL}/zones/${zoneId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.zone.id !== zoneId) throw new Error('Zone ID mismatch');
    if (!data.weather.hourlyHistory) throw new Error('Missing hourlyHistory');
  });

  // 4. Arbitrary Coordinate Weather Fetch
  await test('GET /api/weather/27.3389/88.6065 - Live Weather Fetch', async () => {
    const res = await fetch(`${BASE_URL}/weather/27.3389/88.6065`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.current.current_rainfall_mm_hr !== 'number') throw new Error('Missing current rain');
  });

  // 5. Active Alerts & Multilingual Verification
  let alertId = '';
  await test('GET /api/alerts - CAP Multilingual Alerts & Priority Queue', async () => {
    const res = await fetch(`${BASE_URL}/alerts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected array of alerts');
    if (data.length > 0) {
      alertId = data[0].zoneId;
      const m = data[0].multilingual;
      if (!m.en || !m.hi || !m.as || !m.kha || !m.mz || !m.bn) {
        throw new Error('Missing one or more regional language translations (EN, HI, AS, KHA, MZ, BN)');
      }
    }
  });

  // 6. Authority Action on Alert
  if (alertId) {
    await test(`POST /api/alerts/${alertId}/action - Incident Command Action Dispatch`, async () => {
      const res = await fetch(`${BASE_URL}/alerts/${alertId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionName: 'Dispatched SDRF Rescue Contingent', newStatus: 'escalated' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('Action execution failed');
    });
  }

  // 7. Crowdsourced Field Report Submission & Risk Recalibration
  let createdReportId = '';
  await test('POST /api/reports - Crowdsourced Field Hazard Submission', async () => {
    const res = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoneId: 'ner-sk-01',
        latitude: 27.3450,
        longitude: 88.6120,
        reporterName: 'Dorjee Sherpa',
        reporterRole: 'Citizen',
        severity: 'Severe Fissure',
        crackWidthCm: 25,
        hasWaterSeepage: true,
        hasRetainingWallDamage: true,
        affectedRoadName: 'NH-10 Ranipool Sinking Zone',
        description: 'New 25cm tensile fissure opening with active muddy seepage across retaining structure.',
        syncedFromOffline: false
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.id) throw new Error('Missing report ID');
    createdReportId = data.id;
  });

  // 8. Field Report Verification
  if (createdReportId) {
    await test(`PATCH /api/reports/${createdReportId}/verify - Authority Verification`, async () => {
      const res = await fetch(`${BASE_URL}/reports/${createdReportId}/verify`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.isVerified) throw new Error('Report verification status not updated');
    });
  }

  // 9. Vulnerable Roads & Historical Catalogs
  await test('GET /api/roads & /api/historical - Geospatial Infrastructure Data', async () => {
    const [roadsRes, histRes] = await Promise.all([
      fetch(`${BASE_URL}/roads`),
      fetch(`${BASE_URL}/historical`)
    ]);
    if (!roadsRes.ok || !histRes.ok) throw new Error('Failed to fetch roads or historical data');
    const roads = await roadsRes.json();
    const hist = await histRes.json();
    if (roads.length < 5) throw new Error('Expected at least 5 critical highway corridors');
    if (hist.length < 5) throw new Error('Expected historical landslide events');
  });

  // 10. Simulation Sandbox (Cloudburst Anomaly Injection & Reset)
  await test('POST /api/simulation/anomaly & reset - Hackathon Sandbox Engine', async () => {
    const injRes = await fetch(`${BASE_URL}/simulation/anomaly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId: 'ner-sk-01', extraRainMm: 150 })
    });
    if (!injRes.ok) throw new Error('Anomaly injection failed');

    // Verify reset
    const resetRes = await fetch(`${BASE_URL}/simulation/reset`, { method: 'POST' });
    if (!resetRes.ok) throw new Error('Reset failed');
  });

  // 11. WebSocket Live Connection
  await test('WebSocket ws://localhost:5000/ws - Real-Time Broadcast Stream', async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:5000/ws');
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timed out'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timer);
        ws.close();
        resolve();
      });

      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });

  console.log('====================================================');
  console.log(`📊 TEST RESULTS: ${passed} Passed | ${failed} Failed`);
  console.log('====================================================');
}

runTests();
