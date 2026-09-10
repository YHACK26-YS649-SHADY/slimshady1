/**
 * NE-SENTINEL LIVE WEATHER INTEGRATION SERVICE
 * ============================================
 * Fetches real-time rainfall, forecast accumulation, humidity, temperature, and wind.
 * 
 * Hierarchy:
 * 1. Explicit API Key (WEATHER_API_KEY) -> WeatherAPI / OpenWeatherMap
 * 2. Zero-config Live Fallback -> Open-Meteo API (Free global live meteorological data)
 * 3. Offline / Disconnected Fallback -> Realistic seeded simulated stream with physical noise
 */

import { WeatherTelemetry } from '../models/risk_model.js';

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

export class WeatherService {
  private cache: Map<string, ZoneWeatherProfile> = new Map();
  private simulatedAnomalies: Map<string, { extraRainMm: number; durationMinutes: number; startedAt: number }> = new Map();

  /**
   * Fetch weather for given lat/lon coordinates.
   */
  public async getWeatherForCoordinates(
    zoneId: string,
    lat: number,
    lon: number
  ): Promise<ZoneWeatherProfile> {
    const cached = this.cache.get(zoneId);
    // Cache for 10 minutes unless invalidated
    if (cached && (Date.now() - new Date(cached.current.lastUpdated).getTime() < 10 * 60 * 1000)) {
      return this.applySimulatedAnomalies(cached);
    }

    const apiKey = process.env.WEATHER_API_KEY;

    // 1. Try Live WeatherAPI.com if key is present
    if (apiKey && apiKey !== 'YOUR_WEATHER_API_KEY' && apiKey.length > 5) {
      try {
        const liveProfile = await this.fetchFromWeatherAPI(zoneId, lat, lon, apiKey);
        if (liveProfile) {
          this.cache.set(zoneId, liveProfile);
          return this.applySimulatedAnomalies(liveProfile);
        }
      } catch (err) {
        console.warn(`[WeatherService] WeatherAPI.com error for ${zoneId}, falling back to Open-Meteo:`, (err as Error).message);
      }
    }

    // 2. Try Live Open-Meteo API (Completely free, live real-world weather without API key)
    try {
      const openMeteoProfile = await this.fetchFromOpenMeteo(zoneId, lat, lon);
      if (openMeteoProfile) {
        this.cache.set(zoneId, openMeteoProfile);
        return this.applySimulatedAnomalies(openMeteoProfile);
      }
    } catch (err) {
      console.warn(`[WeatherService] Open-Meteo error for ${zoneId}, falling back to simulated engine:`, (err as Error).message);
    }

    // 3. Fallback to seeded realistic synthetic weather
    const simulatedProfile = this.generateSimulatedWeather(zoneId, lat, lon);
    this.cache.set(zoneId, simulatedProfile);
    return this.applySimulatedAnomalies(simulatedProfile);
  }

  /**
   * Fetch from live Open-Meteo API (Real-world high-resolution meteorological models)
   */
  private async fetchFromOpenMeteo(
    zoneId: string,
    lat: number,
    lon: number
  ): Promise<ZoneWeatherProfile | null> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&hourly=precipitation,temperature_2m,relative_humidity_2m,wind_speed_10m&daily=precipitation_sum,rain_sum&timezone=Asia%2FKolkata&past_days=2&forecast_days=7`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!resp.ok) return null;
      const data = await resp.json();

      const currentRain = Number(data.current?.precipitation || data.current?.rain || 0);
      const temp = Number(data.current?.temperature_2m || 22);
      const humidity = Number(data.current?.relative_humidity_2m || 75);
      const wind = Number(data.current?.wind_speed_10m || 10);

      // Sum 24h, 48h, 7d from daily arrays
      const dailyRain: number[] = data.daily?.precipitation_sum || [0, 0, 0, 0, 0, 0, 0];
      const rain24h = dailyRain[0] !== undefined ? dailyRain[0] : currentRain * 8;
      const rain48h = (dailyRain[0] || 0) + (dailyRain[1] || 0);
      const rain7d = dailyRain.slice(0, 7).reduce((a, b) => a + (b || 0), 0);

      // Generate hourly history from past_days
      const hourlyTimes: string[] = data.hourly?.time || [];
      const hourlyRain: number[] = data.hourly?.precipitation || [];
      const hourlyTemp: number[] = data.hourly?.temperature_2m || [];
      const hourlyHum: number[] = data.hourly?.relative_humidity_2m || [];
      const hourlyWind: number[] = data.hourly?.wind_speed_10m || [];

      const hourlyHistory: WeatherTimeSeriesPoint[] = [];
      const forecastHourly: WeatherTimeSeriesPoint[] = [];

      const nowIso = new Date().toISOString();

      for (let i = 0; i < hourlyTimes.length; i++) {
        const timeStr = hourlyTimes[i];
        const pt: WeatherTimeSeriesPoint = {
          timestamp: timeStr,
          rainfall_mm: hourlyRain[i] || 0,
          humidity_pct: hourlyHum[i] || 70,
          temperature_c: hourlyTemp[i] || 20,
          wind_kmh: hourlyWind[i] || 10,
          soil_moisture_est: Math.min(100, Math.max(20, 45 + (hourlyRain[i] || 0) * 4))
        };

        if (timeStr <= nowIso) {
          hourlyHistory.push(pt);
        } else if (forecastHourly.length < 24) {
          forecastHourly.push(pt);
        }
      }

      return {
        zoneId,
        lat,
        lon,
        current: {
          current_rainfall_mm_hr: currentRain,
          rainfall_24h_mm: Math.round(rain24h * 10) / 10,
          rainfall_48h_mm: Math.round(rain48h * 10) / 10,
          rainfall_7d_mm: Math.round(rain7d * 10) / 10,
          humidity_pct: humidity,
          temperature_c: temp,
          wind_speed_kmh: wind,
          dataSource: 'live-openmeteo',
          lastUpdated: new Date().toISOString()
        },
        forecast24h_mm: Math.round((dailyRain[1] || rain24h * 0.9) * 10) / 10,
        forecast48h_mm: Math.round(((dailyRain[1] || 0) + (dailyRain[2] || 0)) * 10) / 10,
        forecast7d_mm: Math.round(rain7d * 10) / 10,
        hourlyHistory: hourlyHistory.slice(-24),
        forecastHourly,
        dataSource: 'live-openmeteo',
        statusMessage: 'Live real-time weather feed from Open-Meteo Global Satellite/Radar'
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  /**
   * Fetch from WeatherAPI.com (if user provided key)
   */
  private async fetchFromWeatherAPI(
    zoneId: string,
    lat: number,
    lon: number,
    apiKey: string
  ): Promise<ZoneWeatherProfile | null> {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=3&aqi=no`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();

    const current = data.current;
    const forecastDay0 = data.forecast?.forecastday?.[0]?.day;
    const forecastDay1 = data.forecast?.forecastday?.[1]?.day;

    const currentRain = current?.precip_mm || 0;
    const rain24h = forecastDay0?.totalprecip_mm || currentRain * 6;
    const rain48h = rain24h + (forecastDay1?.totalprecip_mm || 15);

    return {
      zoneId,
      lat,
      lon,
      current: {
        current_rainfall_mm_hr: currentRain,
        rainfall_24h_mm: rain24h,
        rainfall_48h_mm: rain48h,
        rainfall_7d_mm: rain48h * 2.2,
        humidity_pct: current?.humidity || 80,
        temperature_c: current?.temp_c || 22,
        wind_speed_kmh: current?.wind_kph || 12,
        dataSource: 'live-weatherapi',
        lastUpdated: new Date().toISOString()
      },
      forecast24h_mm: forecastDay1?.totalprecip_mm || 25,
      forecast48h_mm: rain48h,
      forecast7d_mm: rain48h * 2.5,
      hourlyHistory: [],
      forecastHourly: [],
      dataSource: 'live-weatherapi',
      statusMessage: 'Live authenticated feed via WeatherAPI.com'
    };
  }

  /**
   * Generate realistic, physically consistent simulated weather
   */
  private generateSimulatedWeather(
    zoneId: string,
    lat: number,
    lon: number
  ): ZoneWeatherProfile {
    // Generate deterministic seed variation based on lat/lon
    const seed = Math.sin(lat * 100 + lon * 50);
    const isHighMonsoonZone = zoneId.includes('ml') || zoneId.includes('sk') || zoneId.includes('as-01') || zoneId.includes('mz-01');

    const baseRain = isHighMonsoonZone ? 12.5 + seed * 8 : 4.0 + seed * 3;
    const currentRain = Math.max(0, Math.round((baseRain + Math.random() * 4) * 10) / 10);
    const rain24h = Math.round((currentRain * 7.5 + 25 + seed * 15) * 10) / 10;
    const rain48h = Math.round((rain24h * 1.8 + 10) * 10) / 10;
    const rain7d = Math.round((rain48h * 2.4 + 40) * 10) / 10;
    const humidity = Math.min(98, Math.round(75 + seed * 18 + Math.random() * 5));
    const temp = Math.round((24 - (lat - 23) * 1.2 + seed * 3) * 10) / 10;
    const wind = Math.round(8 + seed * 6 + Math.random() * 4);

    const hourlyHistory: WeatherTimeSeriesPoint[] = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const ptTime = new Date(now - i * 3600 * 1000).toISOString();
      const hRain = Math.max(0, currentRain * 0.8 + Math.sin(i * 0.6) * 4);
      hourlyHistory.push({
        timestamp: ptTime,
        rainfall_mm: Math.round(hRain * 10) / 10,
        humidity_pct: Math.min(100, Math.round(humidity + Math.cos(i) * 5)),
        temperature_c: Math.round((temp + Math.sin(i * 0.3) * 2) * 10) / 10,
        wind_kmh: wind,
        soil_moisture_est: Math.min(100, Math.round(55 + (rain24h / 150) * 35))
      });
    }

    const forecastHourly: WeatherTimeSeriesPoint[] = [];
    for (let i = 1; i <= 24; i++) {
      const ptTime = new Date(now + i * 3600 * 1000).toISOString();
      const fRain = Math.max(0, currentRain * 0.9 + Math.cos(i * 0.5) * 5);
      forecastHourly.push({
        timestamp: ptTime,
        rainfall_mm: Math.round(fRain * 10) / 10,
        humidity_pct: Math.min(100, Math.round(humidity + Math.sin(i) * 4)),
        temperature_c: Math.round((temp - Math.sin(i * 0.3) * 2) * 10) / 10,
        wind_kmh: wind,
        soil_moisture_est: Math.min(100, Math.round(60 + (rain48h / 200) * 35))
      });
    }

    return {
      zoneId,
      lat,
      lon,
      current: {
        current_rainfall_mm_hr: currentRain,
        rainfall_24h_mm: rain24h,
        rainfall_48h_mm: rain48h,
        rainfall_7d_mm: rain7d,
        humidity_pct: humidity,
        temperature_c: temp,
        wind_speed_kmh: wind,
        dataSource: 'simulated-fallback',
        lastUpdated: new Date().toISOString()
      },
      forecast24h_mm: Math.round(rain24h * 1.1 * 10) / 10,
      forecast48h_mm: Math.round(rain48h * 1.2 * 10) / 10,
      forecast7d_mm: rain7d,
      hourlyHistory,
      forecastHourly,
      dataSource: 'simulated-fallback',
      statusMessage: 'Using physics-calibrated synthetic meteorological stream'
    };
  }

  /**
   * Allows injecting a simulation anomaly (e.g. Cloudburst +150mm) for hackathon demo!
   */
  public triggerSimulationAnomaly(zoneId: string, extraRainMm: number, durationMinutes: number = 30) {
    this.simulatedAnomalies.set(zoneId, {
      extraRainMm,
      durationMinutes,
      startedAt: Date.now()
    });
    // Invalidate cached profile
    this.cache.delete(zoneId);
  }

  public clearAllAnomalies() {
    this.simulatedAnomalies.clear();
    this.cache.clear();
  }

  private applySimulatedAnomalies(profile: ZoneWeatherProfile): ZoneWeatherProfile {
    const anomaly = this.simulatedAnomalies.get(profile.zoneId);
    if (!anomaly) return profile;

    const elapsedMin = (Date.now() - anomaly.startedAt) / 60000;
    if (elapsedMin > anomaly.durationMinutes) {
      this.simulatedAnomalies.delete(profile.zoneId);
      return profile;
    }

    // Apply anomaly injection
    const boostedProfile = JSON.parse(JSON.stringify(profile)) as ZoneWeatherProfile;
    boostedProfile.current.current_rainfall_mm_hr += Math.round((anomaly.extraRainMm / 3) * 10) / 10;
    boostedProfile.current.rainfall_24h_mm += anomaly.extraRainMm;
    boostedProfile.current.rainfall_48h_mm += anomaly.extraRainMm;
    boostedProfile.current.humidity_pct = 98;
    boostedProfile.statusMessage = `⚠️ [ACTIVE SIMULATION INJECTION] Cloudburst Anomaly (+${anomaly.extraRainMm}mm precipitation)`;

    return boostedProfile;
  }
}

export const weatherServiceInstance = new WeatherService();
