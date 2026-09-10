# 🛡️ NE-Sentinel: AI-Enabled Landslide & Disaster Early-Warning Platform for North Eastern India (NER)

**NE-Sentinel** is a mission-critical, full-stack geospatial early-warning and disaster management platform engineered specifically for the vulnerable mountainous geomorphology and high-precipitation regimes of the **North Eastern Region (NER) of India** (*Sikkim, Meghalaya, Mizoram, Nagaland, Arunachal Pradesh, Assam, Manipur, and Tripura*).

---

## 🚀 Key Features

1. **Live Real-Time Weather Integration**:
   - Fetches live precipitation ($mm/hr$), 24h/48h/7-day cumulative rainfall accumulation, relative humidity, temperature, and wind speed.
   - Dual-tiered architecture:
     - Direct authentication via `WEATHER_API_KEY` (WeatherAPI.com / OpenWeatherMap).
     - Automatic zero-config live real-world fallback to **Open-Meteo Global Radar API** (free, no sign-up required, live high-resolution models for NER coordinates).
     - Graceful fallback to physics-calibrated synthetic stream if fully disconnected — **the dashboard never crashes**.

2. **Explainable AI/ML Landslide Risk Engine**:
   - Multi-criteria physics-informed model calibrated against Geological Survey of India (GSI) and NDMA historical disaster records in NER.
   - Core Formula:
     $$\text{Hazard Score } S = w_{\text{rain}} \cdot S_{\text{rain}} + w_{\text{soil}} \cdot S_{\text{soil}} + w_{\text{slope}} \cdot S_{\text{slope}} + w_{\text{geo}} \cdot S_{\text{geo}} + w_{\text{sat}} \cdot S_{\text{sat}} + w_{\text{crowd}} \cdot S_{\text{crowd}}$$
   - Weights & Thresholds:
     - **Precipitation Load (35%)**: Current flash intensity + 24h antecedent rainfall.
     - **Soil Moisture Saturation (25%)**: Dynamic NASA SMAP exponential decay model ($\theta(t) = \theta_0 e^{-\lambda \Delta t} + \alpha P \cos(\theta)$).
     - **Slope Gradient & Topography (18%)**: Critical angle of repose ($20^\circ - 52^\circ$).
     - **Geological Fault & Thrust Proximity (12%)**: Shear zone & fractured rock index.
     - **Satellite Earth Observation (10%)**: Sentinel-1 InSAR phase coherence loss & Sentinel-2 NDVI vegetation loss.
     - **Crowdsourced Ground Verification (+5 to +20 pts boost)**: Real-time eyewitness tension fissure evidence.
   - Clean, commented implementation in `server/src/models/risk_model.ts` and inspectable Python ML reference in `server/src/models/risk_model.py`.

3. **Leaflet GIS Command Center**:
   - Tactical dark-mode geospatial map centered on NER coordinates (`[26.2°N, 92.8°E]`).
   - Toggleable layers: Landslide Hazard Zones, Live Rainfall Radar, Soil Moisture Saturation, Historical Landslides, Vulnerable Arterial Highways (NH-10, NH-29, NH-06, NH-02, NH-37, etc.), and Citizen Ground Pins.
   - Dynamic Highway Risk Intersections: Highlights arterial roads at risk of imminent blockage.

4. **Public & Community Emergency Portal**:
   - Streamlined, high-contrast hazard status for citizens.
   - **1-Click Multilingual Audio & Text Warnings**: Generates and broadcasts alerts in **English, Hindi (हिन्दी), Assamese (অসমীয়া), Khasi (Ka Ktien Khasi), Mizo, and Bengali (বাংলা)**.
   - Emergency Helplines (112, 1070, 1077, NDRF, SDMA) & designated safe relief shelters.
   - Instant WhatsApp Community Broadcast generator.

5. **Authority Incident Commander HUD**:
   - **Response Priority Matrix**: Automatically triages active sectors by $\text{Risk Score} \times \log_{10}(\text{Population}) \times \text{Infra Weight}$.
   - Quick Action Dispatch buttons: Deploy SDRF, Close Highway, Issue CAP Evacuation Order.
   - **24-Hour Rainfall vs. Soil Saturation Time-Series Chart** (Recharts).
   - **Live Weather Simulation Sandbox**: Test scenario injection (*"Trigger Cloudburst +150mm"*) to demonstrate real-time risk escalation and emergency alerts to hackathon judges.
   - **Crowdsourced Verification Queue**: Review field photos, crack widths, and calibrate the AI engine.

6. **Offline & Low-Connectivity PWA Support**:
   - Progressive Web App (PWA) with Service Worker caching of essential UI shell and last-synced risk telemetry.
   - Citizen field hazard reports queue locally in `IndexedDB` / `localStorage` when offline and auto-sync when connectivity restores.
   - Persistent connectivity badge (*"Live Stream"* vs *"Offline — Cached"*).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, React-Leaflet, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript (`tsx`), WebSocket (`ws`), CORS, Dotenv.
- **AI/ML Engine**: Physics-informed multi-factor scoring model (`server/src/models/risk_model.ts` & `risk_model.py`).
- **Data Integration**: Open-Meteo Global Meteorological API + WeatherAPI.com + GSI/NDMA datasets.

---

## ⚡ Quick Start & Run Instructions

### Prerequisites
- Node.js (v18+) & npm

### 1. Clone / Navigate to Directory
```bash
cd Final
```

### 2. Configure Environment (Optional)
If you have an OpenWeatherMap or WeatherAPI.com key, set it in `server/.env`:
```env
WEATHER_API_KEY=your_key_here
PORT=5000
```
*(If omitted, the platform automatically connects to Open-Meteo's live global radar with zero configuration).*

### 3. Start Full-Stack Platform
```bash
npm run dev
```
This concurrently starts:
- **Backend Server**: `http://localhost:5000` (REST & WebSocket stream at `ws://localhost:5000/ws`)
- **Frontend Dashboard**: `http://localhost:5175` (or `http://localhost:5173`)

### 4. Run Automated Test Suite
```bash
cd server
npm run test
# Or: npx tsx src/tests/integration_test.ts
```

---

## 🔬 Explainability for Judges

| Component | Source | Implementation |
|---|---|---|
| **Rainfall Data** | **LIVE** | Live Open-Meteo & WeatherAPI with hourly forecast |
| **Soil Moisture** | **SIMULATED (SMAP)** | Antecedent moisture decay formula driven by live rainfall and slope |
| **Terrain & Slopes** | **REAL STATIC (GeoJSON)** | 18 actual NER high-risk mountain sectors |
| **Satellite SAR** | **SIMULATED (InSAR)** | Phase coherence loss & NDVI change detection metrics |
| **Historical Landslides** | **REAL DOCUMENTED** | 25+ major GSI/NDMA historical records (Tupul 2022, Remal 2024, etc.) |
| **Field Reports** | **LIVE CROWDSOURCED** | Citizen GPS reporting + offline queueing |

---

## 🌐 Monitored NER Zones

1. **Gangtok - NH-10 Corridor** (East Sikkim)
2. **Mangan - Chungthang Sector** (North Sikkim)
3. **Shillong - Mawlai & Barapani Slope** (Meghalaya)
4. **Cherrapunji (Sohra) Escarpment** (Meghalaya)
5. **Jowai - Sonapur Tunnel Sector** (Meghalaya)
6. **Aizawl - Durtlang & Laipuitlang Ridge** (Mizoram)
7. **Champhai - Zokhawthar Border Hills** (Mizoram)
8. **Kohima - Dzüdza / NH-29 Bypass** (Nagaland)
9. **Mokokchung - Ungma Ridge** (Nagaland)
10. **Itanagar - Papum Pare Hills** (Arunachal Pradesh)
11. **Tawang - Sela Pass Strategic Corridor** (Arunachal Pradesh)
12. **Pasighat - Siang Valley Slopes** (Arunachal Pradesh)
13. **Haflong - Dima Hasao Railway Section** (Assam)
14. **Guwahati - Kamakhya & Narakasur Hills** (Assam)
15. **Noney - Tupul Railway Landslide Zone** (Manipur)
16. **Imphal - Mao Gate NH-02 Border** (Manipur)
17. **Baramura & Atharamura Hills Corridor** (Tripura)
18. **Darjeeling - Kalimpong / Teesta River Gorge** (NER Gateway)
