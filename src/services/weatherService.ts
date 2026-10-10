import { WeatherData } from '../types';
import { demoWeatherData } from '../data/mockData';
import { storageService } from './storageService';

let simulateWeatherFailure = false;

export const setSimulateWeatherFailure = (val: boolean) => {
  simulateWeatherFailure = val;
};

export const getSimulateWeatherFailure = () => simulateWeatherFailure;

/**
 * Formats elapsed age of cached weather data into a friendly localized string.
 */
export function formatWeatherAge(timestamp: string, lang: 'en' | 'ta' | 'hi' = 'en'): string {
  if (!timestamp) return lang === 'ta' ? 'பழைய தரவு' : lang === 'hi' ? 'पुराना डेटा' : 'Stale data';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMins / 60);

  if (lang === 'ta') {
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} நாட்களுக்கு முன்`;
    }
    if (diffHours >= 1) {
      return `${diffHours} மணிநேரத்திற்கு முன்`;
    }
    return `${diffMins} நிமிடங்களுக்கு முன்`;
  }

  if (lang === 'hi') {
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} दिन पहले`;
    }
    if (diffHours >= 1) {
      return `${diffHours} घंटे पहले`;
    }
    return `${diffMins} मिनट पहले`;
  }

  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    return `${days}d ago`;
  }
  if (diffHours >= 1) {
    return `${diffHours}h ago`;
  }
  return `${diffMins}m ago`;
}

/**
 * Fetches live weather from Open-Meteo or recovers previously cached weather
 * with explicit stale markings when in offline / low-connectivity environments.
 */
export async function fetchWeatherData(
  latitude: number = 20.7453,
  longitude: number = 78.6022,
  cityName: string = 'Wardha, Maharashtra',
  lang: 'en' | 'ta' | 'hi' = 'en'
): Promise<WeatherData> {
  const isBrowserOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  // 1. If simulated failure or browser is offline, return cached stale data immediately
  if (simulateWeatherFailure || isBrowserOffline) {
    const cached = storageService.getCachedWeather();
    if (cached) {
      const ageStr = formatWeatherAge(cached.timestamp, lang);
      return {
        ...cached,
        latitude,
        longitude,
        city_name: cityName,
        is_stale: true,
        stale_since: cached.timestamp,
        cached_age_display: ageStr,
      };
    }

    return {
      ...demoWeatherData,
      latitude,
      longitude,
      city_name: cityName,
      is_demo: true,
      is_stale: true,
      stale_since: demoWeatherData.timestamp,
      cached_age_display: lang === 'ta' ? 'மாதிரி ஆஃப்லைன் தரவு' : lang === 'hi' ? 'डेमो ऑफलाइन डेटा' : 'Demo offline cache',
    };
  }

  // 2. Attempt live network fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=precipitation_probability,precipitation,et0_fao_evapotranspiration&forecast_days=2&timezone=auto`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();

    const currentTemp = data.current?.temperature_2m ?? 28;
    const currentHumidity = data.current?.relative_humidity_2m ?? 60;
    const currentWind = data.current?.wind_speed_10m ?? 12;

    // Calculate next 48h rain accumulation
    const rainHourly: number[] = data.hourly?.precipitation || [];
    const rainProbHourly: number[] = data.hourly?.precipitation_probability || [];
    const et0Hourly: number[] = data.hourly?.et0_fao_evapotranspiration || [];

    const totalRainNext48h = rainHourly.slice(0, 48).reduce((acc, val) => acc + (val || 0), 0);
    const maxRainProb = Math.max(...rainProbHourly.slice(0, 48), 0);

    // Sum daily et0 or estimate from hourly sum
    const dailyEt0 = et0Hourly.length >= 24
      ? et0Hourly.slice(0, 24).reduce((acc, val) => acc + (val || 0), 0)
      : 4.5;

    const liveWeather: WeatherData = {
      latitude,
      longitude,
      city_name: cityName,
      temperature: Math.round(currentTemp * 10) / 10,
      relative_humidity: Math.round(currentHumidity),
      rain_probability: maxRainProb,
      rain_amount: Math.round(totalRainNext48h * 10) / 10,
      wind_speed: Math.round(currentWind * 10) / 10,
      et0: Math.round(dailyEt0 * 10) / 10 || 4.6,
      is_demo: false,
      is_stale: false,
      timestamp: new Date().toISOString(),
    };

    // Cache the successful live weather reading for offline resilience
    storageService.setCachedWeather(liveWeather);

    return liveWeather;
  } catch (error) {
    console.warn('[WeatherService] Live weather fetch failed or timed out. Falling back to cached data.', error);

    const cached = storageService.getCachedWeather();
    if (cached) {
      const ageStr = formatWeatherAge(cached.timestamp, lang);
      return {
        ...cached,
        latitude,
        longitude,
        city_name: cityName,
        is_stale: true,
        stale_since: cached.timestamp,
        cached_age_display: ageStr,
      };
    }

    return {
      ...demoWeatherData,
      latitude,
      longitude,
      city_name: cityName,
      is_demo: true,
      is_stale: true,
      stale_since: demoWeatherData.timestamp,
      cached_age_display: lang === 'ta' ? 'மாதிரி ஆஃப்லைன் தரவு' : lang === 'hi' ? 'डेमो ऑफलाइन डेटा' : 'Demo offline cache',
    };
  }
}
