import {
  Field,
  Crop,
  GrowthStage,
  IrrigationRecommendation,
  WeatherData,
} from '../types';

import {
  calculateIrrigation,
  CROP_KC_TABLE,
  METHOD_EFFICIENCIES,
  AREA_CONVERSIONS,
  getRecommendedKc,
  ESTIMATE_DISCLAIMER,
  PRESET_TEST_CASES,
  validateIrrigationInputs,
  convertAreaToSquareMeters,
  formatHoursToHms,
} from './irrigationCalculator';

// Re-export core calculator capabilities
export {
  CROP_KC_TABLE,
  METHOD_EFFICIENCIES as IRRIGATION_EFFICIENCY,
  AREA_CONVERSIONS,
  getRecommendedKc,
  ESTIMATE_DISCLAIMER,
  PRESET_TEST_CASES,
  calculateIrrigation,
  validateIrrigationInputs,
  convertAreaToSquareMeters,
  formatHoursToHms,
};

export function calculateIrrigationRecommendation(
  field: Field,
  crop: Crop,
  weather: WeatherData,
  manualSoilMoisturePct?: number
): IrrigationRecommendation {
  const cropKc = getRecommendedKc(crop.crop_name, crop.growth_stage);
  const et0 = weather.et0 || 4.5;
  const efficiency = METHOD_EFFICIENCIES[field.irrigation_method] || 0.75;
  const flowRate = field.flow_rate && field.flow_rate > 0 ? field.flow_rate : 3000;
  
  // Rain discount: Open-Meteo rain * 0.7 effective rain factor
  const effectiveRain = (weather.rain_amount || 0) * 0.7;

  // Run calculation
  const calc = calculateIrrigation({
    crop: crop.crop_name,
    growth_stage: crop.growth_stage,
    et0,
    kc: cropKc,
    area: field.area,
    area_unit: field.area_unit,
    irrigation_efficiency: efficiency,
    pump_flow_rate: flowRate,
    recent_rainfall: effectiveRain,
    irrigation_method: field.irrigation_method,
  });

  let netDepth_mm = calc.calculations.net_depth_mm;
  let water_volume_litres = calc.calculations.water_volume_litres;
  let irrigation_time_hours = calc.calculations.irrigation_time_hours;

  // Soil moisture dampener if provided (> 70% moisture)
  if (manualSoilMoisturePct && manualSoilMoisturePct > 70) {
    netDepth_mm = Math.round(netDepth_mm * 0.4 * 10) / 10;
    water_volume_litres = Math.round((netDepth_mm * calc.inputs.area_m2) / efficiency);
    irrigation_time_hours = Math.round((water_volume_litres / flowRate) * 10) / 10;
  }

  // Rain forecast warning
  let rain_forecast_warning: string | undefined;
  if (weather.rain_probability >= 50 && weather.rain_amount >= 5) {
    rain_forecast_warning = `Significant rainfall (${weather.rain_amount} mm, ${weather.rain_probability}% probability) forecast in next 48h. Consider delaying irrigation to conserve diesel/electricity.`;
  }

  // Practical agronomic tips
  const tips: string[] = [];
  if (field.irrigation_method === 'flood') {
    tips.push('Flood irrigation incurs ~50% evaporation and percolation losses. Consider converting to drip or furrow dividing.');
  } else if (field.irrigation_method === 'drip') {
    tips.push('Inspect drip drippers for salt deposits or clogging. Flush sub-mains weekly.');
  } else if (field.irrigation_method === 'sprinkler') {
    tips.push('Operate sprinklers during low wind conditions to maintain uniform distribution across nozzles.');
  } else if (field.irrigation_method === 'rain_fed') {
    tips.push('Practice in-situ rainwater harvesting, mulching, and broad bed furrows to conserve soil moisture.');
  }
  tips.push('Irrigate early in the morning (6:00 AM - 8:30 AM) or after sunset to minimize atmospheric evaporation loss.');
  if (crop.growth_stage === 'flowering') {
    tips.push('Flowering is a critical moisture-sensitive stage. Avoid prolonged root drought stress to prevent flower drop.');
  }

  return {
    id: `rec-irr-${Date.now()}`,
    field_id: field.id,
    crop_name: crop.crop_name,
    growth_stage: crop.growth_stage,
    etc_mm: calc.calculations.etc_mm,
    net_depth_mm: netDepth_mm,
    water_volume_litres,
    irrigation_time_hours,
    recommended_time: 'Tomorrow, 06:30 AM - 09:00 AM',
    efficiency_applied: efficiency,
    rain_forecast_warning,
    is_estimate: true,
    is_demo: weather.is_demo,
    explanation: calc.explanation.summary,
    tips,
    created_at: new Date().toISOString(),
  };
}
