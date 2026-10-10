import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '20.7453');
  const lon = parseFloat(searchParams.get('lon') || '78.6022');
  const simulateFail = searchParams.get('simulate_fail') === 'true';

  if (simulateFail) {
    return NextResponse.json({
      error: 'Simulated weather upstream API failure for testing',
      is_demo: true,
    }, { status: 503 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=precipitation_probability,precipitation,et0_fao_evapotranspiration&forecast_days=2&timezone=auto`;
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 1800 } });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    // Resilient fallback when external weather API is unreachable or offline
    const fallbackOpenMeteo = {
      latitude: lat,
      longitude: lon,
      current: {
        temperature_2m: 29.5,
        relative_humidity_2m: 62,
        wind_speed_10m: 12.0,
      },
      hourly: {
        precipitation: [0, 0, 0, 0.5, 1.0, 0, 0],
        precipitation_probability: [10, 15, 20, 25, 20, 15],
        et0_fao_evapotranspiration: Array(24).fill(0.2), // daily sum ~4.8
      },
      temperature: 29.5,
      relative_humidity: 62,
      wind_speed: 12.0,
      et0: 4.8,
      rain_probability: 25,
      rain_amount: 1.5,
      is_demo: true,
      is_stale: true,
      error_note: err.message || 'Offline fallback',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(fallbackOpenMeteo, { status: 200 });
  }
}
