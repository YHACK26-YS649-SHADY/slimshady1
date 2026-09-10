export interface ZoneData {
  id: string;
  name: string;
  state: string;
  district: string;
  lat: number;
  lon: number;
  elevation_m: number;
  slope_deg: number;
  geology_fault_score: number;
  soil_type: string;
  vegetation_loss_pct: number;
  sar_coherence_loss: number;
  population_exposure: number;
  critical_infrastructure: string[];
  historical_events_count: number;
  vulnerable_villages: string[];
  designated_shelters?: {
    name: string;
    capacity: number;
    phone: string;
    address: string;
  }[];
}

export interface WeatherTelemetry {
  current_rainfall_mm_hr: number;
  rainfall_24h_mm: number;
  rainfall_48h_mm: number;
  rainfall_7d_mm: number;
  humidity_pct: number;
  temperature_c: number;
  wind_speed_kmh: number;
  dataSource: 'live-weatherapi' | 'live-openmeteo' | 'simulated-fallback';
  lastUpdated: string;
}

export interface WeatherTimeSeriesPoint {
  timestamp: string;
  rainfall_mm: number;
  humidity_pct: number;
  temperature_c: number;
  wind_kmh: number;
  soil_moisture_est: number;
}

export interface ZoneWeatherProfile {
  zoneId: string;
  lat: number;
  lon: number;
  current: WeatherTelemetry;
  forecast24h_mm: number;
  forecast48h_mm: number;
  forecast7d_mm: number;
  hourlyHistory: WeatherTimeSeriesPoint[];
  forecastHourly: WeatherTimeSeriesPoint[];
  dataSource: 'live-weatherapi' | 'live-openmeteo' | 'simulated-fallback';
  statusMessage: string;
}

export interface FeatureContributions {
  rainfall: number;
  soil_saturation: number;
  slope_terrain: number;
  geology_faults: number;
  satellite_displacement: number;
  crowdsourced_boost: number;
}

export interface RiskEvaluationResult {
  zoneId: string;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  simulatedSoilMoisturePct: number;
  featureContributions: FeatureContributions;
  keyDrivers: string[];
  primaryDriver?: string;
  factorOfSafety?: number;
  recommendedActions: string[];
  responsePriorityScore: number;
  calculatedAt: string;
}

export interface ZoneWithRisk {
  zone: ZoneData;
  weather: ZoneWeatherProfile;
  risk: RiskEvaluationResult;
}

export interface MultilingualAlertContent {
  en: { title: string; body: string; instruction: string };
  hi: { title: string; body: string; instruction: string };
  as: { title: string; body: string; instruction: string };
  kha: { title: string; body: string; instruction: string };
  mz: { title: string; body: string; instruction: string };
  bn: { title: string; body: string; instruction: string };
}

export interface EarlyWarningAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  state: string;
  riskScore: number;
  riskLevel: 'Moderate' | 'High' | 'Critical';
  timestamp: string;
  keyDriverSummary: string;
  affectedHighways: string[];
  vulnerableVillages: string[];
  multilingual: MultilingualAlertContent;
  status: 'active' | 'acknowledged' | 'escalated' | 'resolved';
  responsePriorityScore: number;
  actionsTaken: string[];
}

export interface FieldReport {
  id: string;
  zoneId?: string;
  latitude: number;
  longitude: number;
  reporterName: string;
  reporterRole: 'Citizen' | 'Aapda Mitra Volunteer' | 'Forest Guard' | 'Highway Patrol' | 'SDRF Officer';
  severity: 'Minor Slump' | 'Moderate Cracking' | 'Severe Fissure' | 'Active Debris Flow / Mudslide';
  crackWidthCm?: number;
  hasWaterSeepage: boolean;
  hasRetainingWallDamage: boolean;
  affectedRoadName?: string;
  description: string;
  photoUrl?: string;
  timestamp: string;
  isVerified: boolean;
  syncedFromOffline: boolean;
}

export interface VulnerableRoad {
  id: string;
  name: string;
  code: string;
  type: string;
  length_km: number;
  associated_zone_ids: string[];
  critical_assets: string[];
  coordinates: [number, number][]; // [lon, lat] pairs
}

export interface HistoricalLandslide {
  id: string;
  zoneId: string;
  location: string;
  date: string;
  severity: 'Moderate' | 'High' | 'Critical';
  casualties: number;
  displaced: number;
  rainfall_trigger_mm_24h: number;
  description: string;
  infrastructure_damage: string;
  lat: number;
  lon: number;
}

export interface SystemHealth {
  status: string;
  platform: string;
  region: string;
  monitoredZonesCount: number;
  activeAlertsCount: number;
  hasWeatherApiKey: boolean;
  openMeteoAvailable: boolean;
  timestamp: string;
}
