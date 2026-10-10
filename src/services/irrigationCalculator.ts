import { GrowthStage, Language } from '../types';

/**
 * Standard Area Conversion Constants
 * 1 acre = 4046.86 m²
 * 1 hectare = 10,000 m²
 */
export const AREA_CONVERSIONS = {
  acre: 4046.86,
  hectare: 10000,
  m2: 1.0,
} as const;

export type AreaUnitType = keyof typeof AREA_CONVERSIONS;

/**
 * Standard Irrigation Method Efficiencies (FAO-56 Irrigation & Drainage Guidelines)
 */
export const METHOD_EFFICIENCIES = {
  drip: 0.90, // 90% application efficiency
  sprinkler: 0.75, // 75% application efficiency
  flood: 0.50, // 50% application efficiency
  rain_fed: 1.00, // 100% natural precipitation utilization (non-pumped)
} as const;

export type IrrigationMethodType = keyof typeof METHOD_EFFICIENCIES | 'custom';

/**
 * Standard Crop Coefficient (Kc) Table across phenological growth stages
 */
export const CROP_KC_TABLE: Record<string, Record<GrowthStage, number>> = {
  Tomato: {
    seedling: 0.60,
    vegetative: 0.85,
    flowering: 1.15,
    fruiting: 1.15,
    maturity: 0.80,
  },
  Rice: {
    seedling: 1.05,
    vegetative: 1.15,
    flowering: 1.25,
    fruiting: 1.20,
    maturity: 0.90,
  },
  Wheat: {
    seedling: 0.40,
    vegetative: 0.80,
    flowering: 1.15,
    fruiting: 1.10,
    maturity: 0.35,
  },
  Maize: {
    seedling: 0.45,
    vegetative: 0.85,
    flowering: 1.20,
    fruiting: 1.15,
    maturity: 0.55,
  },
  Cotton: {
    seedling: 0.45,
    vegetative: 0.80,
    flowering: 1.15,
    fruiting: 1.10,
    maturity: 0.65,
  },
  Potato: {
    seedling: 0.50,
    vegetative: 0.80,
    flowering: 1.15,
    fruiting: 1.10,
    maturity: 0.75,
  },
};

/**
 * Helper to fetch Kc for a given crop and stage with fallback
 */
export function getRecommendedKc(cropName: string, growthStage: GrowthStage): number {
  const cropTable = CROP_KC_TABLE[cropName] || CROP_KC_TABLE.Tomato;
  return cropTable[growthStage] ?? 0.85;
}

/**
 * Irrigation Calculator Inputs Interface
 */
export interface IrrigationCalculatorInputs {
  crop: string;
  growth_stage: GrowthStage | string;
  et0: number; // Reference Evapotranspiration (mm or mm/day)
  kc: number; // Crop Coefficient Kc
  area: number; // Field area value
  area_unit: AreaUnitType; // 'acre' | 'hectare' | 'm2'
  irrigation_efficiency: number; // Ratio 0..1 OR Percentage 1..100
  pump_flow_rate?: number; // Litres per hour (L/h)
  recent_rainfall?: number; // Recent rainfall (mm)
  irrigation_method?: IrrigationMethodType;
}

/**
 * Validation Error Map
 */
export interface IrrigationValidationErrors {
  crop?: string;
  growth_stage?: string;
  et0?: string;
  kc?: string;
  area?: string;
  area_unit?: string;
  irrigation_efficiency?: string;
  pump_flow_rate?: string;
  recent_rainfall?: string;
  general?: string;
}

/**
 * Step Breakdown for Explanation
 */
export interface CalculationStep {
  step_number: number;
  title: string;
  formula: string;
  calculation: string;
  result: string;
  description: string;
}

/**
 * Complete Irrigation Calculation Result
 */
export interface IrrigationCalculatorResult {
  is_valid: boolean;
  errors: IrrigationValidationErrors;
  inputs: {
    crop: string;
    growth_stage: string;
    et0: number;
    kc: number;
    area: number;
    area_unit: AreaUnitType;
    area_m2: number;
    irrigation_efficiency: number; // normalized 0..1
    efficiency_percentage: number; // 0..100
    pump_flow_rate: number;
    recent_rainfall: number;
    irrigation_method: IrrigationMethodType;
  };
  calculations: {
    etc_mm: number; // ET0 * Kc
    effective_rainfall_mm: number;
    net_depth_mm: number; // max(0, etc_mm - recent_rainfall)
    water_volume_litres: number; // (net_depth_mm * area_m2) / efficiency
    gross_water_volume_litres: number; // (etc_mm * area_m2) / efficiency
    water_volume_m3: number;
    irrigation_time_hours: number;
    irrigation_time_formatted: string;
    is_rain_fed: boolean;
    is_sufficient_rain: boolean;
  };
  explanation: {
    summary: string;
    steps: CalculationStep[];
  };
  estimate_disclaimer: string;
}

/**
 * Converts any supported area unit to square metres (m²)
 */
export function convertAreaToSquareMeters(area: number, unit: AreaUnitType): number {
  const factor = AREA_CONVERSIONS[unit] || AREA_CONVERSIONS.acre;
  return area * factor;
}

/**
 * Validates inputs for the irrigation calculator.
 * Returns an object mapping invalid field keys to helpful error messages.
 */
export function validateIrrigationInputs(
  inputs: Partial<IrrigationCalculatorInputs>,
  language: Language = 'en'
): IrrigationValidationErrors {
  const errors: IrrigationValidationErrors = {};
  const isTa = language === 'ta';
  const isHi = language === 'hi';

  // 1. Crop validation
  if (!inputs.crop || typeof inputs.crop !== 'string' || inputs.crop.trim().length === 0) {
    errors.crop = isTa ? 'தயவுசெய்து பயிரின் பெயரைத் தேர்ந்தெடுக்கவும் அல்லது உள்ளிடவும்.' : isHi ? 'कृपया फसल का नाम चुनें या दर्ज करें।' : 'Please select or enter a crop name.';
  }

  // 2. Growth stage validation
  if (!inputs.growth_stage || typeof inputs.growth_stage !== 'string' || inputs.growth_stage.trim().length === 0) {
    errors.growth_stage = isTa ? 'தயவுசெய்து பயிர் வளர்ச்சி நிலையைத் தேர்ந்தெடுக்கவும்.' : isHi ? 'कृपया फसल की विकास अवस्था चुनें।' : 'Please select a growth stage.';
  }

  // 3. ET0 validation
  if (inputs.et0 === undefined || inputs.et0 === null || Number.isNaN(inputs.et0)) {
    errors.et0 = isTa ? 'ஆவியாதல் (ET₀) மதிப்பு தேவை.' : isHi ? 'संदर्भ वाष्पोत्सर्जन (ET₀) मान आवश्यक है।' : 'Reference Evapotranspiration (ET₀) is required.';
  } else if (typeof inputs.et0 !== 'number' || inputs.et0 < 0) {
    errors.et0 = isTa ? 'ET₀ நேர்மறை எண்ணாக (≥ 0 mm) இருக்க வேண்டும்.' : isHi ? 'ET₀ एक गैर-नकारात्मक संख्या (≥ 0 mm) होनी चाहिए।' : 'ET₀ must be a non-negative number (≥ 0 mm).';
  } else if (inputs.et0 > 50) {
    errors.et0 = isTa ? 'ET₀ மதிப்பு மிக அதிகமாக உள்ளது (> 50 mm/day).' : isHi ? 'ET₀ मान बहुत अधिक प्रतीत होता है (> 50 mm/day)।' : 'ET₀ value appears unrealistically high (> 50 mm/day).';
  }

  // 4. Kc validation
  if (inputs.kc === undefined || inputs.kc === null || Number.isNaN(inputs.kc)) {
    errors.kc = isTa ? 'பயிர் காரணி (Kc) தேவை.' : isHi ? 'फसल गुणांक (Kc) आवश्यक है।' : 'Crop coefficient (Kc) is required.';
  } else if (typeof inputs.kc !== 'number' || inputs.kc <= 0) {
    errors.kc = isTa ? 'பயிர் காரணி (Kc) 0-ஐ விட அதிகமாக இருக்க வேண்டும்.' : isHi ? 'फसल गुणांक (Kc) 0 से अधिक होना चाहिए।' : 'Crop coefficient (Kc) must be greater than 0.';
  } else if (inputs.kc > 3.0) {
    errors.kc = isTa ? 'பயிர் காரணி (Kc) 3.0 அல்லது குறைவாக இருக்க வேண்டும்.' : isHi ? 'फसल गुणांक (Kc) 3.0 या उससे कम होना चाहिए।' : 'Crop coefficient (Kc) must be 3.0 or less.';
  }

  // 5. Area validation
  if (inputs.area === undefined || inputs.area === null || Number.isNaN(inputs.area)) {
    errors.area = isTa ? 'நிலத்தின் பரப்பளவு தேவை.' : isHi ? 'खेत का क्षेत्रफल आवश्यक है।' : 'Field area is required.';
  } else if (typeof inputs.area !== 'number' || inputs.area <= 0) {
    errors.area = isTa ? 'நிலத்தின் பரப்பளவு 0-ஐ விட அதிகமாக இருக்க வேண்டும்.' : isHi ? 'खेत का क्षेत्रफल 0 से अधिक होना चाहिए।' : 'Field area must be greater than 0.';
  }

  // 6. Area unit validation
  if (!inputs.area_unit || !AREA_CONVERSIONS[inputs.area_unit]) {
    errors.area_unit = isTa ? "பரப்பளவு அலகு 'acre', 'hectare', அல்லது 'm2' ஆக இருக்க வேண்டும்." : isHi ? "क्षेत्रफल इकाई 'acre', 'hectare', या 'm2' होनी चाहिए।" : "Area unit must be 'acre', 'hectare', or 'm2'.";
  }

  // 7. Efficiency validation
  if (inputs.irrigation_efficiency === undefined || inputs.irrigation_efficiency === null || Number.isNaN(inputs.irrigation_efficiency)) {
    errors.irrigation_efficiency = isTa ? 'பாசன திறன் தேவை.' : isHi ? 'सिंचाई दक्षता आवश्यक है।' : 'Irrigation efficiency is required.';
  } else if (typeof inputs.irrigation_efficiency !== 'number' || inputs.irrigation_efficiency <= 0) {
    errors.irrigation_efficiency = isTa ? 'பாசன திறன் 0-ஐ விட அதிகமாக இருக்க வேண்டும்.' : isHi ? 'सिंचाई दक्षता 0 से अधिक होनी चाहिए।' : 'Irrigation efficiency must be greater than 0.';
  } else if (inputs.irrigation_efficiency > 100) {
    errors.irrigation_efficiency = isTa ? 'பாசன திறன் 100%-ஐ விட அதிகமாக இருக்க முடியாது.' : isHi ? 'सिंचाई दक्षता 100% से अधिक नहीं हो सकती।' : 'Irrigation efficiency cannot exceed 100% (or 1.0).';
  }

  // 8. Pump flow rate validation
  const isRainFed = inputs.irrigation_method === 'rain_fed' || inputs.irrigation_efficiency === 1.0;
  if (!isRainFed) {
    if (inputs.pump_flow_rate === undefined || inputs.pump_flow_rate === null || Number.isNaN(inputs.pump_flow_rate)) {
      errors.pump_flow_rate = isTa ? 'அழுத்த பாசனத்திற்கு பம்ப் ஓட்ட விகிதம் தேவை.' : isHi ? 'दबाव सिंचाई के लिए पंप प्रवाह दर आवश्यक है।' : 'Pump flow rate is required for pressurized irrigation.';
    } else if (typeof inputs.pump_flow_rate !== 'number' || inputs.pump_flow_rate <= 0) {
      errors.pump_flow_rate = isTa ? 'பம்ப் ஓட்ட விகிதம் 0 லிட்டர்/மணிக்கு அதிகமாக இருக்க வேண்டும்.' : isHi ? 'पंप प्रवाह दर 0 लीटर/घंटा से अधिक होनी चाहिए।' : 'Pump flow rate must be greater than 0 Litres per hour.';
    }
  } else if (inputs.pump_flow_rate !== undefined && inputs.pump_flow_rate < 0) {
    errors.pump_flow_rate = isTa ? 'பம்ப் ஓட்ட விகிதம் எதிர்மறையாக இருக்கக்கூடாது.' : isHi ? 'पंप प्रवाह दर नकारात्मक नहीं हो सकती।' : 'Pump flow rate cannot be negative.';
  }

  // 9. Recent rainfall validation
  if (inputs.recent_rainfall !== undefined && inputs.recent_rainfall !== null) {
    if (typeof inputs.recent_rainfall !== 'number' || Number.isNaN(inputs.recent_rainfall) || inputs.recent_rainfall < 0) {
      errors.recent_rainfall = isTa ? 'சமீபத்திய மழையளவு நேர்மறை எண்ணாக (≥ 0 mm) இருக்க வேண்டும்.' : isHi ? 'हाल की वर्षा एक गैर-नकारात्मक संख्या (≥ 0 mm) होनी चाहिए।' : 'Recent rainfall must be a non-negative number (≥ 0 mm).';
    }
  }

  return errors;
}

/**
 * Format hours into standard "Xh Ym" notation
 */
export function formatHoursToHms(hours: number): string {
  if (hours <= 0) return '0h 0m';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Standard Agricultural Disclaimer
 */
export const ESTIMATE_DISCLAIMER =
  'AI recommendations are estimates and should be verified with local agricultural extension officers or Krishi Vigyan Kendra (KVK) experts.';

/**
 * Main Calculation Engine
 */
export function calculateIrrigation(
  rawInputs: Partial<IrrigationCalculatorInputs>,
  language: Language = 'en'
): IrrigationCalculatorResult {
  const errors = validateIrrigationInputs(rawInputs, language);
  const hasErrors = Object.keys(errors).length > 0;
  const isTa = language === 'ta';
  const isHi = language === 'hi';

  // Normalize defaults even if errors exist so UI can preview safely
  const crop = rawInputs.crop || 'Tomato';
  const growth_stage = (rawInputs.growth_stage as GrowthStage) || 'flowering';
  const et0 = typeof rawInputs.et0 === 'number' && !Number.isNaN(rawInputs.et0) ? rawInputs.et0 : 4.5;
  const kc = typeof rawInputs.kc === 'number' && !Number.isNaN(rawInputs.kc) ? rawInputs.kc : getRecommendedKc(crop, growth_stage);
  const area = typeof rawInputs.area === 'number' && !Number.isNaN(rawInputs.area) ? rawInputs.area : 1.0;
  const area_unit: AreaUnitType = rawInputs.area_unit && AREA_CONVERSIONS[rawInputs.area_unit] ? rawInputs.area_unit : 'acre';

  // Normalize efficiency (handles both decimal 0.90 and percentage 90)
  let rawEff = typeof rawInputs.irrigation_efficiency === 'number' && !Number.isNaN(rawInputs.irrigation_efficiency)
    ? rawInputs.irrigation_efficiency
    : 0.90;
  if (rawEff > 1.0) {
    rawEff = rawEff / 100;
  }
  const efficiency = Math.min(1.0, Math.max(0.01, rawEff));
  const efficiencyPct = Math.round(efficiency * 100);

  const pump_flow_rate = typeof rawInputs.pump_flow_rate === 'number' && !Number.isNaN(rawInputs.pump_flow_rate)
    ? rawInputs.pump_flow_rate
    : 3000;
  const recent_rainfall = typeof rawInputs.recent_rainfall === 'number' && !Number.isNaN(rawInputs.recent_rainfall)
    ? Math.max(0, rawInputs.recent_rainfall)
    : 0;

  const irrigation_method: IrrigationMethodType = rawInputs.irrigation_method || (
    efficiencyPct >= 85 ? 'drip' :
    efficiencyPct >= 70 ? 'sprinkler' :
    efficiencyPct >= 45 ? 'flood' : 'custom'
  );

  const is_rain_fed = irrigation_method === 'rain_fed' || (efficiency >= 0.99 && (!pump_flow_rate || pump_flow_rate === 0));

  // Perform Calculations
  // 1. Crop Evapotranspiration ETc = ET0 × Kc
  const etc_mm = Math.round(et0 * kc * 100) / 100;

  // 2. Area conversion to m²
  const area_m2 = Math.round(convertAreaToSquareMeters(area, area_unit) * 100) / 100;

  // 3. Net Depth after deducting recent rainfall
  const net_depth_mm = Math.round(Math.max(0, etc_mm - recent_rainfall) * 100) / 100;
  const is_sufficient_rain = recent_rainfall >= etc_mm && etc_mm > 0;

  // 4. Water Volume in litres = net depth (mm) × area (m²) ÷ efficiency
  // (1 mm of water over 1 m² = 1 Litre)
  const rawGrossVolumeLitres = (etc_mm * area_m2) / efficiency;
  const gross_water_volume_litres = Math.round(rawGrossVolumeLitres);

  const rawNetVolumeLitres = (net_depth_mm * area_m2) / efficiency;
  const water_volume_litres = Math.round(rawNetVolumeLitres);
  const water_volume_m3 = Math.round((water_volume_litres / 1000) * 10) / 10;

  // 5. Irrigation Time in hours = water volume in litres ÷ flow rate in litres per hour
  let irrigation_time_hours = 0;
  let irrigation_time_formatted = '0h 0m';

  if (is_rain_fed) {
    irrigation_time_hours = 0;
    irrigation_time_formatted = isTa ? '0h 0m (மானாவாரி)' : isHi ? '0h 0m (वर्षा आधारित)' : '0h 0m (Rain-fed)';
  } else if (pump_flow_rate > 0 && water_volume_litres > 0) {
    const rawHours = water_volume_litres / pump_flow_rate;
    irrigation_time_hours = Math.round(rawHours * 100) / 100;
    irrigation_time_formatted = formatHoursToHms(rawHours);
  } else if (is_sufficient_rain) {
    irrigation_time_hours = 0;
    irrigation_time_formatted = isTa ? '0h 0m (மழை போதுமானது)' : isHi ? '0h 0m (पर्याप्त बारिश)' : '0h 0m (Rain Met)';
  }

  // Explanation steps breakdown
  const unitLabel = area_unit === 'acre' ? (isTa ? 'ஏக்கர்' : isHi ? 'एकड़' : 'acres') : area_unit === 'hectare' ? (isTa ? 'ஹெக்டேர்' : isHi ? 'हेक्टेयर' : 'hectares') : 'm²';
  const steps: CalculationStep[] = [
    {
      step_number: 1,
      title: isTa ? 'பயிர் நீர் ஆவியாதல் தேவை (ETc)' : isHi ? 'फसल वाष्पोत्सर्जन आवश्यकता (ETc)' : 'Crop Evapotranspiration (ETc)',
      formula: 'ETc = ET0 × Kc',
      calculation: `${et0} mm/day × ${kc} (${crop} - ${growth_stage})`,
      result: `${etc_mm} mm`,
      description: isTa
        ? `${crop} பயிருக்கு ${growth_stage} பருவத்தில் தினசரி வளிமண்டல நீர் தேவையை கணக்கிடுகிறது.`
        : isHi
        ? `${crop} फसल के लिए ${growth_stage} अवस्था में दैनिक वायुमंडलीय जल मांग की गणना करता है।`
        : `Calculates daily atmospheric water demand for ${crop} during the ${growth_stage} phase.`,
    },
    {
      step_number: 2,
      title: isTa ? 'நில பரப்பளவு மாற்றம் (m²)' : isHi ? 'खेत का क्षेत्रफल रूपांतरण (m²)' : 'Field Area Conversion',
      formula: `Area (m²) = Area (${area_unit}) × ${AREA_CONVERSIONS[area_unit]}`,
      calculation: `${area} ${unitLabel} × ${AREA_CONVERSIONS[area_unit].toLocaleString()} m²/${area_unit}`,
      result: `${area_m2.toLocaleString()} m²`,
      description: isTa
        ? `கனஅளவு கணக்கீட்டிற்காக ${area_unit}-லிருந்து சதுர மீட்டராக (m²) பரப்பளவு மாற்றப்படுகிறது.`
        : isHi
        ? `आयतन गणना के लिए ${area_unit} से वर्ग मीटर (m²) में क्षेत्रफल परिवर्तित किया गया।`
        : `Converts surface area from ${area_unit}s into square metres for volumetric calculation.`,
    },
    {
      step_number: 3,
      title: isTa ? 'நிகர பாசன ஆழம் (மழை கழிப்பு)' : isHi ? 'शुद्ध सिंचाई गहराई (वर्षा समायोजन)' : 'Net Irrigation Depth (Rainfall Adjustment)',
      formula: 'Net Depth (mm) = max(0, ETc - Recent Rainfall)',
      calculation: recent_rainfall > 0
        ? `max(0, ${etc_mm} mm - ${recent_rainfall} mm rainfall)`
        : `${etc_mm} mm - 0 mm rainfall`,
      result: `${net_depth_mm} mm`,
      description: recent_rainfall > 0
        ? (isTa ? `பயிர் தேவையிலிருந்து சமீபத்திய ${recent_rainfall} mm மழை கழிக்கப்பட்டது.` : isHi ? `फसल की मांग से हाल ही में हुई ${recent_rainfall} मिमी वर्षा को घटा दिया गया।` : `Deducted ${recent_rainfall} mm of recent precipitation from crop requirement.`)
        : (isTa ? 'சமீபத்தில் மழை பெய்யவில்லை; முழு பயிர் நீர் தேவையும் பாசனம் செய்யப்பட வேண்டும்.' : isHi ? 'हाल में वर्षा नहीं हुई; पूरी फसल वाष्पोत्सर्जन आवश्यकता की सिंचाई करनी होगी।' : 'No recent rainfall recorded; full crop evapotranspiration must be applied.'),
    },
    {
      step_number: 4,
      title: isTa ? 'மொத்த பாசன நீர் அளவு (லிட்டர்)' : isHi ? 'कुल सिंचाई जल आयतन (लीटर)' : 'Total Water Application Volume',
      formula: 'Water Volume (L) = (Net Depth in mm × Area in m²) ÷ Efficiency',
      calculation: `(${net_depth_mm} mm × ${area_m2.toLocaleString()} m²) ÷ ${efficiency}`,
      result: isTa ? `${water_volume_litres.toLocaleString()} லிட்டர் (${water_volume_m3.toLocaleString()} m³)` : isHi ? `${water_volume_litres.toLocaleString()} लीटर (${water_volume_m3.toLocaleString()} m³)` : `${water_volume_litres.toLocaleString()} Litres (${water_volume_m3.toLocaleString()} m³)`,
      description: isTa
        ? `${efficiencyPct}% அமைப்பு பயன்பாட்டு திறன் (${irrigation_method} முறை). (குறிப்பு: 1 m² பரப்பளவில் 1 mm ஆழம் = 1 லிட்டர்).`
        : isHi
        ? `${efficiencyPct}% प्रणाली अनुप्रयोग दक्षता (${irrigation_method} विधि)। (ध्यान दें: 1 m² पर 1 mm गहराई = 1 लीटर)।`
        : `Accounts for ${efficiencyPct}% system application efficiency (${irrigation_method} method). (Note: 1 mm depth over 1 m² = 1 Litre).`,
    },
    {
      step_number: 5,
      title: is_rain_fed
        ? (isTa ? 'பம்ப் இயங்கும் நேரம் (மானாவாரி நிலை)' : isHi ? 'पंप चलने का समय (वर्षा आधारित)' : 'Pump Run-Time (Rain-Fed Status)')
        : (isTa ? 'பம்ப் இயங்கும் நேரம் (மணிநேரம்)' : isHi ? 'पंप संचालन समय' : 'Pump Operating Run-Time'),
      formula: is_rain_fed
        ? (isTa ? 'பொருந்தாது (மானாவாரி நிலை)' : isHi ? 'लागू नहीं (वर्षा आधारित स्थिति)' : 'N/A (Rain-fed condition)')
        : 'Run Time (Hours) = Water Volume (L) ÷ Pump Flow Rate (L/hr)',
      calculation: is_rain_fed
        ? (isTa ? 'மானாவாரி நிலம் — மோட்டார் பம்ப் தேவையில்லை.' : isHi ? 'वर्षा आधारित खेत — मोटर पंप की आवश्यकता नहीं।' : 'Rain-fed field — no motorized tube-well pump required.')
        : `${water_volume_litres.toLocaleString()} L ÷ ${pump_flow_rate.toLocaleString()} L/hr`,
      result: is_rain_fed
        ? (isTa ? '0.00 மணிநேரம் (மானாவாரி)' : isHi ? '0.00 घंटे (वर्षा आधारित)' : '0.00 Hours (Rain-fed)')
        : (isTa ? `${irrigation_time_hours} மணிநேரம் (~${irrigation_time_formatted})` : isHi ? `${irrigation_time_hours} घंटे (~${irrigation_time_formatted})` : `${irrigation_time_hours} Hours (~${irrigation_time_formatted})`),
      description: is_rain_fed
        ? (isTa ? 'நிலம் முழுக்க இயற்கை பருவமழையை மட்டுமே சார்ந்துள்ளது.' : isHi ? 'खेत पूरी तरह से प्राकृतिक मानसूनी वर्षा पर निर्भर है।' : 'Field relies solely on natural monsoonal rainfall. Supplementary pumping is not active.')
        : (isTa ? `${pump_flow_rate.toLocaleString()} L/hr பம்ப் திறனில் ${water_volume_litres.toLocaleString()} லிட்டர் நீர் பாய்ச்ச தேவையான நேரம்.` : isHi ? `${pump_flow_rate.toLocaleString()} L/hr पंप क्षमता पर ${water_volume_litres.toLocaleString()} लीटर पानी पहुंचाने के लिए आवश्यक समय।` : `Operating duration required to deliver ${water_volume_litres.toLocaleString()} Litres at ${pump_flow_rate.toLocaleString()} L/hr pump capacity.`),
    },
  ];

  const summary = is_sufficient_rain
    ? (isTa ? `சமீபத்தில் பெய்த ${recent_rainfall} mm மழை ${crop} பயிரின் ${etc_mm} mm ETc தேவையை பூர்த்தி செய்கிறது. இன்று பாசனம் தேவையில்லை.` : isHi ? `हाल की ${recent_rainfall} मिमी वर्षा ${crop} की ${etc_mm} मिमी ETc मांग को पूरा करती है। आज सिंचाई की आवश्यकता नहीं है।` : `Recent rainfall of ${recent_rainfall} mm meets or exceeds the ${crop} ETc demand of ${etc_mm} mm. No irrigation is needed today.`)
    : is_rain_fed
    ? (isTa ? `மானாவாரி ${crop} (${growth_stage}) பயிருக்கு ${area} ${unitLabel} நிலத்தில் ${water_volume_litres.toLocaleString()} L (${net_depth_mm} mm) நீர் தேவைப்படுகிறது. மழையை சார்ந்துள்ளது.` : isHi ? `वर्षा आधारित ${crop} (${growth_stage}) को ${area} ${unitLabel} में ${water_volume_litres.toLocaleString()} L (${net_depth_mm} mm) पानी की आवश्यकता है। वर्षा पर निर्भर।` : `Rain-fed ${crop} (${growth_stage}) requires ${water_volume_litres.toLocaleString()} L (${net_depth_mm} mm) across ${area} ${unitLabel}. Relies on precipitation.`)
    : (isTa ? `${area} ${unitLabel} ${crop} பயிருக்கு மதிப்பிடப்பட்ட ${water_volume_litres.toLocaleString()} லிட்டர் (${net_depth_mm} mm நிகர ஆழம்) பாசனம் செய்யவும். பம்பை ${pump_flow_rate} L/hr வேகத்தில் சுமார் ${irrigation_time_hours} மணிநேரம் இயக்கவும்.` : isHi ? `${area} ${unitLabel} ${crop} के लिए अनुमानित ${water_volume_litres.toLocaleString()} लीटर (${net_depth_mm} मिमी शुद्ध गहराई) सिंचाई करें। पंप को ${pump_flow_rate} L/hr पर लगभग ${irrigation_time_hours} घंटे (${irrigation_time_formatted}) चलाएं।` : `Apply an estimated ${water_volume_litres.toLocaleString()} Litres (${net_depth_mm} mm net depth) to ${area} ${unitLabel} of ${crop}. Run pump at ${pump_flow_rate} L/hr for approx. ${irrigation_time_hours} hours (${irrigation_time_formatted}).`);

  const disclaimer = isTa
    ? 'AI பரிந்துரைகள் மதிப்பீடுகள் மட்டுமே. உள்ளூர் வேளாண்மை அலுவலர்கள் அல்லது வேளாண் அறிவியல் நிலைய (KVK) விஞ்ஞானிகளிடம் சரிபார்க்கப்பட வேண்டும்.'
    : isHi
    ? 'AI सिफारिशें केवल अनुमान हैं। स्थानीय कृषि अधिकारियों या कृषि विज्ञान केंद्र (KVK) वैज्ञानिकों से पुष्टि की जानी चाहिए।'
    : ESTIMATE_DISCLAIMER;

  return {
    is_valid: !hasErrors,
    errors,
    inputs: {
      crop,
      growth_stage,
      et0,
      kc,
      area,
      area_unit,
      area_m2,
      irrigation_efficiency: efficiency,
      efficiency_percentage: efficiencyPct,
      pump_flow_rate,
      recent_rainfall,
      irrigation_method,
    },
    calculations: {
      etc_mm,
      effective_rainfall_mm: recent_rainfall,
      net_depth_mm,
      water_volume_litres,
      gross_water_volume_litres,
      water_volume_m3,
      irrigation_time_hours,
      irrigation_time_formatted,
      is_rain_fed,
      is_sufficient_rain,
    },
    explanation: {
      summary,
      steps,
    },
    estimate_disclaimer: disclaimer,
  };
}

/**
 * Standard Predefined Test Cases for Drip, Sprinkler, Flood, and Rain-fed Conditions
 */
export const PRESET_TEST_CASES = {
  drip: {
    name: 'Drip Irrigation — Tomato (Flowering)',
    description: 'High efficiency drip system (90%) for water-sensitive tomato plot.',
    inputs: {
      crop: 'Tomato',
      growth_stage: 'flowering',
      et0: 5.0, // mm/day
      kc: 1.15,
      area: 1.0,
      area_unit: 'acre' as AreaUnitType,
      irrigation_efficiency: 0.90,
      pump_flow_rate: 3000, // L/hr
      recent_rainfall: 0.0, // mm
      irrigation_method: 'drip' as IrrigationMethodType,
    },
  },
  sprinkler: {
    name: 'Sprinkler Irrigation — Wheat (Vegetative)',
    description: 'Medium-high efficiency sprinkler system (75%) across wheat acreage with recent rain shower.',
    inputs: {
      crop: 'Wheat',
      growth_stage: 'vegetative',
      et0: 4.0, // mm/day
      kc: 0.80,
      area: 2.0,
      area_unit: 'hectare' as AreaUnitType,
      irrigation_efficiency: 0.75,
      pump_flow_rate: 5000, // L/hr
      recent_rainfall: 1.0, // mm
      irrigation_method: 'sprinkler' as IrrigationMethodType,
    },
  },
  flood: {
    name: 'Flood / Furrow — Rice (Flowering)',
    description: 'Traditional surface basin/flood irrigation (50% efficiency) with high crop water demand.',
    inputs: {
      crop: 'Rice',
      growth_stage: 'flowering',
      et0: 4.8, // mm/day
      kc: 1.25,
      area: 1.5,
      area_unit: 'acre' as AreaUnitType,
      irrigation_efficiency: 0.50,
      pump_flow_rate: 4000, // L/hr
      recent_rainfall: 0.0, // mm
      irrigation_method: 'flood' as IrrigationMethodType,
    },
  },
  rain_fed: {
    name: 'Rain-fed — Maize (Vegetative)',
    description: 'Rain-dependent maize cultivation with seasonal monsoon shower.',
    inputs: {
      crop: 'Maize',
      growth_stage: 'vegetative',
      et0: 4.2, // mm/day
      kc: 0.85,
      area: 3.0,
      area_unit: 'acre' as AreaUnitType,
      irrigation_efficiency: 1.00,
      pump_flow_rate: 0,
      recent_rainfall: 5.0, // mm (exceeds ETc)
      irrigation_method: 'rain_fed' as IrrigationMethodType,
    },
  },
  rain_fed_deficit: {
    name: 'Rain-fed (Partial Rain) — Maize (Vegetative)',
    description: 'Rain-dependent plot with partial rain (2.0mm vs 3.57mm ETc demand).',
    inputs: {
      crop: 'Maize',
      growth_stage: 'vegetative',
      et0: 4.2, // mm/day
      kc: 0.85,
      area: 3.0,
      area_unit: 'acre' as AreaUnitType,
      irrigation_efficiency: 1.00,
      pump_flow_rate: 0,
      recent_rainfall: 2.0, // mm
      irrigation_method: 'rain_fed' as IrrigationMethodType,
    },
  },
} as const;
