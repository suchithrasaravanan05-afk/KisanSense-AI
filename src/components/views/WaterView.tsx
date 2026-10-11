'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Field, Crop, WeatherData, Language, GrowthStage, FieldFeedbackRecord } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { storageService } from '../../services/storageService';
import { SafetyBanner } from '../SafetyBanner';
import {
  calculateIrrigation,
  validateIrrigationInputs,
  convertAreaToSquareMeters,
  getRecommendedKc,
  PRESET_TEST_CASES,
  CROP_KC_TABLE,
  AREA_CONVERSIONS,
  METHOD_EFFICIENCIES,
  AreaUnitType,
  IrrigationMethodType,
  IrrigationCalculatorInputs,
} from '../../services/irrigationCalculator';
import {
  Droplets,
  Clock,
  CloudRain,
  Sun,
  AlertTriangle,
  CheckCircle2,
  BookmarkCheck,
  Info,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Compass,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

interface WaterViewProps {
  language: Language;
  fields: Field[];
  activeField: Field;
  crop?: Crop;
  weather: WeatherData;
  onLogIrrigation: (volumeLitres: number, notes: string) => void;
  onSelectField: (id: string) => void;
  feedbacks?: FieldFeedbackRecord[];
  onOpenFeedbackModal?: (activity?: any, feedback?: any, recommendation?: any) => void;
}

export const WaterView: React.FC<WaterViewProps> = ({
  language,
  fields,
  activeField,
  crop,
  weather,
  onLogIrrigation,
  onSelectField,
  feedbacks = [],
  onOpenFeedbackModal,
}) => {
  const t = (key: string) => getTranslation(language, key);

  // Active form inputs (stored as strings for precise farmer editing)
  const [cropName, setCropName] = useState<string>(crop?.crop_name || 'Tomato');
  const [growthStage, setGrowthStage] = useState<GrowthStage>(crop?.growth_stage || 'flowering');
  const [et0, setEt0] = useState<string>(String(weather.et0 || 4.5));
  const [kc, setKc] = useState<string>(() => {
    const recommended = getRecommendedKc(crop?.crop_name || 'Tomato', crop?.growth_stage || 'flowering');
    return String(recommended);
  });
  const [isKcAuto, setIsKcAuto] = useState<boolean>(true);
  const [area, setArea] = useState<string>(String(activeField.area || 1.0));
  const [areaUnit, setAreaUnit] = useState<AreaUnitType>((activeField.area_unit as AreaUnitType) || 'acre');
  const [irrigationMethod, setIrrigationMethod] = useState<IrrigationMethodType>(
    (activeField.irrigation_method as IrrigationMethodType) || 'drip'
  );
  const [efficiencyPct, setEfficiencyPct] = useState<string>(() => {
    const defaultEff = METHOD_EFFICIENCIES[activeField.irrigation_method as keyof typeof METHOD_EFFICIENCIES] ?? 0.90;
    return String(Math.round(defaultEff * 100));
  });
  const [pumpFlowRate, setPumpFlowRate] = useState<string>(
    activeField.flow_rate && activeField.flow_rate > 0 ? String(activeField.flow_rate) : '3000'
  );
  const [recentRainfall, setRecentRainfall] = useState<string>(
    weather.rain_amount ? String(Math.round(weather.rain_amount * 10) / 10) : '0'
  );

  // UI States
  const [showExplanation, setShowExplanation] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [logged, setLogged] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Auto-update Kc when crop or stage changes if user hasn't overridden
  const handleCropChange = (newCrop: string) => {
    setCropName(newCrop);
    setActivePreset(null);
    if (isKcAuto) {
      const newKc = getRecommendedKc(newCrop, growthStage);
      setKc(String(newKc));
    }
  };

  const handleStageChange = (newStage: GrowthStage) => {
    setGrowthStage(newStage);
    setActivePreset(null);
    if (isKcAuto) {
      const newKc = getRecommendedKc(cropName, newStage);
      setKc(String(newKc));
    }
  };

  const handleKcManualChange = (val: string) => {
    setKc(val);
    setIsKcAuto(false);
    setActivePreset(null);
  };

  const handleResetKcAuto = () => {
    const recommended = getRecommendedKc(cropName, growthStage);
    setKc(String(recommended));
    setIsKcAuto(true);
  };

  const handleMethodChange = (method: IrrigationMethodType) => {
    setIrrigationMethod(method);
    setActivePreset(null);
    if (method !== 'custom') {
      const std = METHOD_EFFICIENCIES[method];
      setEfficiencyPct(String(Math.round(std * 100)));
      if (method === 'rain_fed') {
        setPumpFlowRate('0');
      } else if (pumpFlowRate === '0' || !pumpFlowRate) {
        setPumpFlowRate('3000');
      }
    }
  };

  // Preset Loaders for Quick Verification
  const loadPreset = (presetKey: 'drip' | 'sprinkler' | 'flood' | 'rain_fed') => {
    const preset = PRESET_TEST_CASES[presetKey];
    setCropName(preset.inputs.crop);
    setGrowthStage(preset.inputs.growth_stage as GrowthStage);
    setEt0(String(preset.inputs.et0));
    setKc(String(preset.inputs.kc));
    setIsKcAuto(false);
    setArea(String(preset.inputs.area));
    setAreaUnit(preset.inputs.area_unit);
    setIrrigationMethod(preset.inputs.irrigation_method);
    setEfficiencyPct(String(Math.round(preset.inputs.irrigation_efficiency * 100)));
    setPumpFlowRate(String(preset.inputs.pump_flow_rate));
    setRecentRainfall(String(preset.inputs.recent_rainfall));
    setActivePreset(presetKey);
    setLogged(false);
    setHasInteracted(true);
  };

  // Sync to current field defaults
  const handleSyncFromField = () => {
    setCropName(crop?.crop_name || 'Tomato');
    setGrowthStage(crop?.growth_stage || 'flowering');
    setEt0(String(weather.et0 || 4.5));
    const autoKc = getRecommendedKc(crop?.crop_name || 'Tomato', crop?.growth_stage || 'flowering');
    setKc(String(autoKc));
    setIsKcAuto(true);
    setArea(String(activeField.area || 1.0));
    setAreaUnit((activeField.area_unit as AreaUnitType) || 'acre');
    const method = (activeField.irrigation_method as IrrigationMethodType) || 'drip';
    setIrrigationMethod(method);
    const eff = METHOD_EFFICIENCIES[method as keyof typeof METHOD_EFFICIENCIES] ?? 0.90;
    setEfficiencyPct(String(Math.round(eff * 100)));
    setPumpFlowRate(activeField.flow_rate && activeField.flow_rate > 0 ? String(activeField.flow_rate) : '3000');
    setRecentRainfall(weather.rain_amount ? String(Math.round(weather.rain_amount * 10) / 10) : '0');
    setActivePreset(null);
    setLogged(false);
  };

  // Simulate missing inputs to demonstrate error validation
  const handleSimulateMissingInputs = () => {
    setCropName('');
    setEt0('');
    setKc('');
    setArea('');
    setEfficiencyPct('');
    setPumpFlowRate('');
    setActivePreset('error_demo');
    setHasInteracted(true);
  };

  // Live Conversion of Area
  const parsedArea = parseFloat(area);
  const liveAreaM2 = useMemo(() => {
    if (isNaN(parsedArea) || parsedArea <= 0) return 0;
    return Math.round(convertAreaToSquareMeters(parsedArea, areaUnit));
  }, [parsedArea, areaUnit]);

  // Prepared inputs for calculation
  const calculationInputs: Partial<IrrigationCalculatorInputs> = useMemo(() => {
    return {
      crop: cropName.trim(),
      growth_stage: growthStage,
      et0: et0.trim() === '' ? NaN : parseFloat(et0),
      kc: kc.trim() === '' ? NaN : parseFloat(kc),
      area: area.trim() === '' ? NaN : parseFloat(area),
      area_unit: areaUnit,
      irrigation_efficiency: efficiencyPct.trim() === '' ? NaN : parseFloat(efficiencyPct),
      pump_flow_rate: pumpFlowRate.trim() === '' ? NaN : parseFloat(pumpFlowRate),
      recent_rainfall: recentRainfall.trim() === '' ? 0 : parseFloat(recentRainfall),
      irrigation_method: irrigationMethod,
    };
  }, [
    cropName,
    growthStage,
    et0,
    kc,
    area,
    areaUnit,
    efficiencyPct,
    pumpFlowRate,
    recentRainfall,
    irrigationMethod,
  ]);

  // Validation
  const validationErrors = useMemo(() => {
    return validateIrrigationInputs(calculationInputs, language);
  }, [calculationInputs, language]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  // Calculation Result
  const calcResult = useMemo(() => {
    return calculateIrrigation(calculationInputs, language);
  }, [calculationInputs, language]);

  // Persist latest recommendation for offline access
  useEffect(() => {
    if (!hasErrors && calcResult.calculations.water_volume_litres > 0) {
      storageService.saveLatestRecommendations({
        irrigationRec: {
          id: `irrig-rec-${activeField.id}`,
          field_id: activeField.id,
          crop_name: cropName,
          growth_stage: growthStage,
          etc_mm: calcResult.calculations.etc_mm,
          net_depth_mm: calcResult.calculations.net_depth_mm,
          water_volume_litres: calcResult.calculations.water_volume_litres,
          irrigation_time_hours: calcResult.calculations.irrigation_time_hours,
          recommended_time: '06:00 AM - 09:00 AM',
          efficiency_applied: calcResult.inputs.irrigation_efficiency,
          is_estimate: true,
          is_demo: !!weather.is_demo,
          explanation: calcResult.explanation.summary,
          tips: [calcResult.estimate_disclaimer || 'Apply early morning or evening to minimize evaporation losses.'],
          created_at: new Date().toISOString(),
        },
      });
    }
  }, [calcResult, hasErrors, activeField.id, cropName, growthStage, weather.is_demo]);

  // Handle Log to timeline
  const handleLog = () => {
    if (hasErrors) return;
    const vol = calcResult.calculations.water_volume_litres;
    const hrs = calcResult.calculations.irrigation_time_hours;
    const notes = `Applied ${calcResult.calculations.net_depth_mm} mm via ${irrigationMethod} (${vol.toLocaleString()} Litres, ~${hrs} hrs run-time for ${cropName} ${growthStage}).`;
    onLogIrrigation(vol, notes);
    setLogged(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 md:pb-12 text-agri-dark">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Droplets className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-agri-dark tracking-tight">
              {t('waterPlannerTitle')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-agri-dark/70 mt-1 max-w-2xl">
            {t('waterPlannerSubtitle')}
          </p>
        </div>

        {/* Sync from active field button */}
        <button
          onClick={handleSyncFromField}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#dde7df] hover:border-sky-300 hover:bg-sky-50 text-xs font-semibold text-agri-dark shadow-xs transition-colors self-start sm:self-auto"
          title="Reset inputs to match active field profile and live weather"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
          <span>{t('syncFieldWeather')}</span>
        </button>
      </div>

      <SafetyBanner language={language} />

      {/* Preset Test Cases Bar */}
      <div className="bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-teal-50/60 rounded-2xl p-4 border border-blue-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              {t('quickPresetsTitle')}
            </span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium">
            {t('quickPresetsDesc')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {/* Preset 1: Drip */}
          <button
            id="preset-btn-drip"
            onClick={() => loadPreset('drip')}
            className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
              activePreset === 'drip'
                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                : 'bg-white hover:bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">💧 {t('presetDrip')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                activePreset === 'drip' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
              }`}>90%</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${activePreset === 'drip' ? 'text-blue-100' : 'text-blue-700/80'}`}>
              Tomato • 1 Acre
            </p>
          </button>

          {/* Preset 2: Sprinkler */}
          <button
            id="preset-btn-sprinkler"
            onClick={() => loadPreset('sprinkler')}
            className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
              activePreset === 'sprinkler'
                ? 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-300'
                : 'bg-white hover:bg-sky-50 border-sky-200 text-sky-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">💦 {t('presetSprinkler')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                activePreset === 'sprinkler' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'
              }`}>75%</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${activePreset === 'sprinkler' ? 'text-sky-100' : 'text-sky-700/80'}`}>
              Wheat • 2 Hectares
            </p>
          </button>

          {/* Preset 3: Flood */}
          <button
            id="preset-btn-flood"
            onClick={() => loadPreset('flood')}
            className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
              activePreset === 'flood'
                ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                : 'bg-white hover:bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">🌊 {t('presetFlood')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                activePreset === 'flood' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
              }`}>50%</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${activePreset === 'flood' ? 'text-amber-100' : 'text-amber-700/80'}`}>
              Rice • 1.5 Acres
            </p>
          </button>

          {/* Preset 4: Rain-fed */}
          <button
            id="preset-btn-rainfed"
            onClick={() => loadPreset('rain_fed')}
            className={`p-2.5 rounded-xl border text-left transition-all btn-press ${
              activePreset === 'rain_fed'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                : 'bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">🌧️ {t('presetRainfed')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                activePreset === 'rain_fed' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>100%</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${activePreset === 'rain_fed' ? 'text-emerald-100' : 'text-emerald-700/80'}`}>
              Maize • 3 Acres
            </p>
          </button>

          {/* Demo Error Simulation */}
          <button
            id="preset-btn-simulate-error"
            onClick={handleSimulateMissingInputs}
            className={`col-span-2 sm:col-span-4 lg:col-span-1 p-2.5 rounded-xl border text-left transition-all btn-press ${
              activePreset === 'error_demo'
                ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                : 'bg-white hover:bg-rose-50 border-rose-200 text-rose-950'
            }`}
            title="Clear required fields to test error validation messages"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">⚠️ {t('presetTestErrors')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                activePreset === 'error_demo' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
              }`}>QA</span>
            </div>
            <p className={`text-[11px] mt-1 truncate ${activePreset === 'error_demo' ? 'text-rose-100' : 'text-rose-700/80'}`}>
              {t('simulateMissing')}
            </p>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Input Panel */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#dde7df] shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-agri-primary" />
            <h2 className="text-base font-bold text-agri-dark">
              {t('calcParamsTitle')}
            </h2>
          </div>
          <span className="text-xs text-agri-dark/60">
            {t('activeField')}: <strong className="text-agri-dark">{activeField.name}</strong> ({activeField.location_name})
          </span>
        </div>

        {/* Stale Weather / Offline Advisory Banner */}
        {weather.is_stale && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{t('staleWeatherBadge')}</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  {weather.cached_age_display || 'Offline'}
                </span>
              </div>
              <p className="text-amber-900/80 leading-relaxed">
                {t('staleWeatherNotice')}
              </p>
            </div>
          </div>
        )}

        {/* Inline Helpful Error Banner if invalid */}
        {hasErrors && (
          <div
            id="validation-error-summary"
            className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900 animate-fadeIn"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">{t('validationErrorsTitle')}</p>
              <p className="text-rose-800">
                {t('validationErrorsDesc')}
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-rose-700 font-medium pt-1">
                {Object.values(validationErrors).map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Inputs Form: 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Group 1: Crop & Atmosphere */}
          <div className="bg-[#fbfdf9] p-4 sm:p-5 rounded-2xl border border-[#dde7df] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-agri-primary flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              {t('cropAtmosphereTitle')}
            </h3>

            {/* Crop Selector */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('cropName')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="input-crop"
                value={cropName}
                onChange={(e) => handleCropChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold bg-white focus:ring-2 focus:ring-sky-500 ${
                  validationErrors.crop ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                }`}
              >
                <option value="Tomato">Tomato (टमाटर)</option>
                <option value="Rice">Rice / Paddy (धान / चावल)</option>
                <option value="Wheat">Wheat (गेहूं)</option>
                <option value="Maize">Maize (मक्का)</option>
                <option value="Cotton">Cotton (कपास)</option>
                <option value="Potato">Potato (आलू)</option>
              </select>
              {validationErrors.crop && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.crop}</p>
              )}
            </div>

            {/* Growth Stage Selector */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('growthStage')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="input-growth-stage"
                value={growthStage}
                onChange={(e) => handleStageChange(e.target.value as GrowthStage)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold bg-white focus:ring-2 focus:ring-sky-500 ${
                  validationErrors.growth_stage ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                }`}
              >
                <option value="seedling">{t('stageSeedling')} (Seedling)</option>
                <option value="vegetative">{t('stageVegetative')} (Vegetative)</option>
                <option value="flowering">{t('stageFlowering')} (Flowering)</option>
                <option value="fruiting">{t('stageFruiting')} (Fruiting)</option>
                <option value="maturity">{t('stageMaturity')} (Maturity)</option>
              </select>
              {validationErrors.growth_stage && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.growth_stage}</p>
              )}
            </div>

            {/* Crop Coefficient Kc (Editable with Auto badge) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-agri-dark">
                  {t('cropCoefficientLabel')} <span className="text-rose-500">*</span>
                </label>
                {!isKcAuto ? (
                  <button
                    type="button"
                    onClick={handleResetKcAuto}
                    className="text-[10px] text-sky-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    {t('resetToAuto')}
                  </button>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {t('autoSuggested')}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="input-kc"
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="3.0"
                  value={kc}
                  onChange={(e) => handleKcManualChange(e.target.value)}
                  placeholder="e.g. 1.15"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 ${
                    validationErrors.kc ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">
                  ratio
                </span>
              </div>
              {validationErrors.kc && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.kc}</p>
              )}
              <p className="text-[11px] text-agri-dark/60 mt-1">
                {t('kcDesc')}
              </p>
            </div>

            {/* Reference Evapotranspiration ET0 */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                Reference Evapotranspiration (ET₀) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-et0"
                  type="number"
                  step="0.1"
                  min="0"
                  value={et0}
                  onChange={(e) => {
                    setEt0(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="e.g. 4.5"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 ${
                    validationErrors.et0 ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">
                  mm/day
                </span>
              </div>
              {validationErrors.et0 && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.et0}</p>
              )}
              <p className="text-[11px] text-agri-dark/60 mt-1">
                {t('et0Desc')}
              </p>
            </div>

            {/* Recent Rainfall */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('recentRainfallLabel')}
              </label>
              <div className="relative">
                <input
                  id="input-recent-rainfall"
                  type="number"
                  step="0.1"
                  min="0"
                  value={recentRainfall}
                  onChange={(e) => {
                    setRecentRainfall(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="0.0"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 ${
                    validationErrors.recent_rainfall ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">
                  mm
                </span>
              </div>
              {validationErrors.recent_rainfall && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.recent_rainfall}</p>
              )}
              <p className="text-[11px] text-agri-dark/60 mt-1">
                {t('rainfallCreditDesc')}
              </p>
            </div>
          </div>

          {/* Group 2: Field Area & Irrigation System */}
          <div className="bg-[#fbfdf9] p-4 sm:p-5 rounded-2xl border border-[#dde7df] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-600" />
              {t('fieldHardwareTitle')}
            </h3>

            {/* Field Area & Unit */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-agri-dark mb-1">
                  {t('area')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-area"
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="e.g. 2.5"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 ${
                    validationErrors.area ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
                {validationErrors.area && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.area}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-agri-dark mb-1">
                  {t('areaUnit')} <span className="text-rose-500">*</span>
                </label>
                <select
                  id="input-area-unit"
                  value={areaUnit}
                  onChange={(e) => {
                    setAreaUnit(e.target.value as AreaUnitType);
                    setActivePreset(null);
                  }}
                  className="w-full px-2.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="acre">Acres</option>
                  <option value="hectare">Hectares</option>
                  <option value="m2">m² (Sq.m)</option>
                </select>
              </div>
            </div>

            {/* Area Conversion Badge Display */}
            <div className="bg-white rounded-xl p-3 border border-sky-200/80 flex items-center justify-between text-xs">
              <span className="text-sky-900 font-medium">{t('convertedAreaLabel')}</span>
              <span id="converted-area-badge" className="font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                {liveAreaM2 > 0 ? liveAreaM2.toLocaleString() : '—'} m² ({t('squareMetresUnit')})
              </span>
            </div>

            {/* Irrigation Method Selector */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('irrigationMethod')}
              </label>
              <select
                id="input-irrigation-method"
                value={irrigationMethod}
                onChange={(e) => handleMethodChange(e.target.value as IrrigationMethodType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="drip">{t('methodDrip')}</option>
                <option value="sprinkler">{t('methodSprinkler')}</option>
                <option value="flood">{t('methodFlood')}</option>
                <option value="rain_fed">{t('methodRainfed')}</option>
                <option value="custom">Custom System Efficiency</option>
              </select>
            </div>

            {/* Irrigation Efficiency Input */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                Application Efficiency (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-efficiency"
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={efficiencyPct}
                  onChange={(e) => {
                    setEfficiencyPct(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="e.g. 90"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 ${
                    validationErrors.irrigation_efficiency ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">
                  % efficiency
                </span>
              </div>
              {validationErrors.irrigation_efficiency && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.irrigation_efficiency}</p>
              )}
              <p className="text-[11px] text-agri-dark/60 mt-1">
                {t('efficiencyDesc')}
              </p>
            </div>

            {/* Pump Flow Rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-agri-dark">
                  {t('flowRate')} {irrigationMethod !== 'rain_fed' && <span className="text-rose-500">*</span>}
                </label>
                {irrigationMethod === 'rain_fed' && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    {t('notApplicableRainfed')}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="input-pump-flow-rate"
                  type="number"
                  step="100"
                  min="0"
                  disabled={irrigationMethod === 'rain_fed'}
                  value={pumpFlowRate}
                  onChange={(e) => {
                    setPumpFlowRate(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="e.g. 3000"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-sky-500 ${
                    irrigationMethod === 'rain_fed'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : validationErrors.pump_flow_rate
                      ? 'border-rose-400 bg-rose-50/30'
                      : 'border-gray-200'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">
                  Litres / Hour
                </span>
              </div>
              {validationErrors.pump_flow_rate && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.pump_flow_rate}</p>
              )}
              <p className="text-[11px] text-agri-dark/60 mt-1">
                {t('pumpRateDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calculated Results Showcase Card */}
      {!hasErrors ? (
        <div
          id="calculation-results-card"
          className="bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#082f49] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-sky-800 relative overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-400/20 text-sky-200 rounded-2xl border border-sky-400/30">
                <Droplets className="w-6 h-6 text-sky-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t('estimatedOutputTitle')}
                </h2>
                <p className="text-xs text-sky-200">
                  {cropName} ({growthStage}) • {calcResult.inputs.area} {calcResult.inputs.area_unit}s ({calcResult.inputs.area_m2.toLocaleString()} m²)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                {t('estimateFaoBadge')}
              </span>
            </div>
          </div>

          {/* Sufficient Rain Callout Banner if applicable */}
          {calcResult.calculations.is_sufficient_rain && (
            <div className="mt-4 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-100">
              <CloudRain className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-200">{t('sufficientRainTitle')}</p>
                <p className="mt-0.5">
                  {calcResult.explanation.summary}
                </p>
              </div>
            </div>
          )}

          {/* Rain-fed Notice Banner if applicable */}
          {calcResult.calculations.is_rain_fed && !calcResult.calculations.is_sufficient_rain && (
            <div className="mt-4 bg-sky-500/20 border border-sky-400/40 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-sky-100">
              <Info className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-sky-200">{t('rainfedNoticeTitle')}</p>
                <p className="mt-0.5">
                  {calcResult.explanation.summary}
                </p>
              </div>
            </div>
          )}

          {/* Big 4-Metric Grid with Clear Units */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-5">
            {/* Metric 1: ETc */}
            <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
              <p className="text-xs text-sky-200 font-medium">{t('cropEtcNeed')}</p>
              <p id="metric-etc-mm" className="text-2xl sm:text-3xl font-black text-white mt-1">
                {calcResult.calculations.etc_mm} <span className="text-xs font-bold text-sky-300">mm</span>
              </p>
              <p className="text-[10px] text-sky-300/80 mt-1">ET₀ ({calcResult.inputs.et0}) × Kc ({calcResult.inputs.kc})</p>
            </div>

            {/* Metric 2: Net Depth Required */}
            <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
              <p className="text-xs text-sky-200 font-medium">{t('netDepthRequired')}</p>
              <p id="metric-net-depth-mm" className="text-2xl sm:text-3xl font-black text-sky-200 mt-1">
                {calcResult.calculations.net_depth_mm} <span className="text-xs font-bold text-sky-300">mm</span>
              </p>
              <p className="text-[10px] text-sky-300/80 mt-1">
                {calcResult.inputs.recent_rainfall > 0
                  ? `${t('afterRainDeduction')} (-${calcResult.inputs.recent_rainfall}mm)`
                  : t('noRainDeduction')}
              </p>
            </div>

            {/* Metric 3: Total Water Volume in Litres */}
            <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
              <p className="text-xs text-sky-200 font-medium">{t('waterVolume')}</p>
              <p id="metric-volume-litres" className="text-2xl sm:text-3xl font-black text-cyan-300 mt-1">
                {calcResult.calculations.water_volume_litres.toLocaleString()}{' '}
                <span className="text-xs font-bold text-sky-300">Litres</span>
              </p>
              <p className="text-[10px] text-sky-300/80 mt-1">
                ~{calcResult.calculations.water_volume_m3.toLocaleString()} m³ ({calcResult.inputs.efficiency_percentage}% efficiency)
              </p>
            </div>

            {/* Metric 4: Pump Operating Time */}
            <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-xs border border-white/10">
              <p className="text-xs text-sky-200 font-medium">{t('pumpRunTime')}</p>
              <p id="metric-run-time-hours" className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">
                {calcResult.calculations.irrigation_time_hours}{' '}
                <span className="text-xs font-bold text-sky-300">Hours</span>
              </p>
              <p id="metric-run-time-formatted" className="text-[10px] text-emerald-200 font-bold mt-1">
                {calcResult.calculations.is_rain_fed
                  ? t('rainfedZeroHours')
                  : `~${calcResult.calculations.irrigation_time_formatted} at ${calcResult.inputs.pump_flow_rate.toLocaleString()} L/h`}
              </p>
            </div>
          </div>

          {/* Live Formula Summary Strip */}
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/15 text-xs text-sky-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-300 flex-shrink-0" />
              <span className="font-semibold">{t('calcBreakdownStrip')}</span>
              <span className="font-mono text-[11px]">
                ETc = {calcResult.inputs.et0} × {calcResult.inputs.kc} = {calcResult.calculations.etc_mm} mm
              </span>
            </div>
            <span className="text-[11px] font-mono bg-sky-900/60 text-sky-200 px-3 py-1 rounded-xl border border-sky-700">
              Net: {calcResult.calculations.net_depth_mm} mm × {calcResult.inputs.area_m2.toLocaleString()} m² ÷ {calcResult.inputs.irrigation_efficiency}
            </span>
          </div>

          {/* Action Row */}
          <div className="mt-5 pt-4 border-t border-sky-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-sky-300 italic max-w-lg">
              {calcResult.estimate_disclaimer}
            </p>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              {onOpenFeedbackModal && (
                <button
                  type="button"
                  id="btn-water-record-outcome"
                  onClick={() => {
                    const existingFb = feedbacks.find(
                      (f) => f.recommendation_type === 'irrigation' && f.field_id === activeField.id
                    );
                    onOpenFeedbackModal(undefined, existingFb, {
                      title: `Irrigation: ${calcResult.calculations.net_depth_mm}mm (${calcResult.calculations.water_volume_litres.toLocaleString()}L)`,
                      type: 'irrigation',
                      description: `Recommended volume: ${calcResult.calculations.water_volume_litres} Litres. ${calcResult.explanation.summary}`,
                      suggestedQuantity: calcResult.calculations.water_volume_litres,
                      suggestedUnit: 'Litres',
                    });
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white transition-all btn-press shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('recordOutcomeBtn')}</span>
                </button>
              )}

              <button
                id="btn-log-irrigation"
                onClick={handleLog}
                disabled={logged}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all btn-press shadow-md ${
                  logged
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-sky-400 hover:bg-sky-300 text-sky-950 hover:shadow-lg'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{logged ? t('irrigationLoggedToast') : t('logIrrigationDone')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Disabled Results Placeholder Card when errors exist */
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-700">{t('awaitingValidInputsTitle')}</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {t('awaitingValidInputsDesc')}
          </p>
        </div>
      )}

      {/* Step-by-Step Explanation Accordion Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card">
        <button
          id="btn-toggle-explanation"
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-agri-dark">
                {t('stepByStepTitle')}
              </h3>
              <p className="text-xs text-agri-dark/60">
                {t('stepByStepSubtitle')}
              </p>
            </div>
          </div>
          <span className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            {showExplanation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>

        {showExplanation && (
          <div id="step-by-step-explanation-list" className="mt-5 space-y-3 pt-3 border-t border-gray-100">
            {calcResult.explanation.steps.map((step) => (
              <div
                key={step.step_number}
                className="bg-[#fbfdf9] p-4 rounded-2xl border border-[#dde7df] hover:border-sky-300 transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">
                      {step.step_number}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-agri-dark">
                      {step.title}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 self-start sm:self-auto">
                    {t('resultLabel')}: {step.result}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 font-mono text-[11px] text-gray-700">
                    <span className="text-gray-400 block text-[10px] uppercase font-sans font-bold">{t('formulaLabel')}</span>
                    {step.formula}
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 font-mono text-[11px] text-sky-900">
                    <span className="text-gray-400 block text-[10px] uppercase font-sans font-bold">{t('calculationLabel')}</span>
                    {step.calculation}
                  </div>
                </div>

                <p className="text-[11px] text-agri-dark/70 pt-0.5">
                  {step.description}
                </p>
              </div>
            ))}

            {/* Units reference summary */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 text-xs text-blue-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-700 flex-shrink-0" />
              <span>
                <strong>{t('unitConsistencyNote')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Water-Saving Agronomic Advice Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-sm text-agri-dark">
            {t('agronomicEfficiencyTitle')}
          </h3>
        </div>
        <ul className="space-y-2.5 text-xs text-agri-dark/80">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              {t('timingTip')}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              {t('floweringTip')}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              {t('uniformityTip')}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
