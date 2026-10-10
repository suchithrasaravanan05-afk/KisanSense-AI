'use client';

import React, { useState } from 'react';
import {
  Field,
  Crop,
  SoilTest,
  ScanResult,
  FieldActivity,
  WeatherData,
  IrrigationRecommendation,
  Language,
  User,
  GrowthStage,
} from '../../types';
import { getTranslation } from '../../i18n/translations';
import { SafetyBanner } from '../SafetyBanner';
import {
  Camera,
  Droplets,
  FlaskConical,
  PlusCircle,
  History,
  CloudRain,
  Sun,
  CloudSun,
  Wind,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  ChevronDown,
  Layers,
  HelpCircle,
  Check,
  Globe,
  Gauge,
  AlertCircle,
  Info,
  Maximize2,
  X,
  TrendingUp,
  Sprout,
} from 'lucide-react';

interface DashboardViewProps {
  language: Language;
  user: User;
  fields: Field[];
  activeField?: Field;
  crop?: Crop;
  soilTest?: SoilTest;
  recentScan?: ScanResult;
  recentActivities: FieldActivity[];
  weather: WeatherData;
  irrigationRec?: IrrigationRecommendation;
  onNavigate: (tab: string) => void;
  onOpenAddField: () => void;
  onOpenAddCrop?: () => void;
  onOpenSoilModal: () => void;
  onRefreshWeather: () => void;
  weatherLoading: boolean;
  onSelectField?: (id: string) => void;
  onLogIrrigation?: (volumeLitres: number, notes: string) => void;
  onLanguageChange?: (lang: Language) => void;
  weatherError?: boolean;
}

type PreviewState = 'normal' | 'loading' | 'empty' | 'weather_error';

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  user,
  fields,
  activeField,
  crop,
  soilTest,
  recentScan,
  recentActivities,
  weather,
  irrigationRec,
  onNavigate,
  onOpenAddField,
  onOpenAddCrop,
  onOpenSoilModal,
  onRefreshWeather,
  weatherLoading,
  onSelectField,
  onLogIrrigation,
  onLanguageChange,
  weatherError = false,
}) => {
  const t = (key: string) => getTranslation(language, key);

  // Preview state toggle for testing loading, empty, and error states
  const [previewState, setPreviewState] = useState<PreviewState>('normal');
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [quickLogSuccess, setQuickLogSuccess] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greetingMorning');
    if (hour < 17) return t('greetingAfternoon');
    return t('greetingEvening');
  };

  // Crop Emoji & Color helper
  const getCropMeta = (cropName?: string) => {
    switch (cropName?.toLowerCase()) {
      case 'tomato':
        return { emoji: '🍅', color: 'from-rose-500 to-red-600', bg: 'bg-rose-50 border-rose-200 text-rose-900' };
      case 'rice':
        return { emoji: '🌾', color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50 border-amber-200 text-amber-900' };
      case 'wheat':
        return { emoji: '🌾', color: 'from-amber-600 to-amber-700', bg: 'bg-amber-50 border-amber-200 text-amber-900' };
      case 'maize':
        return { emoji: '🌽', color: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-50 border-yellow-200 text-yellow-900' };
      case 'cotton':
        return { emoji: '🌿', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900' };
      case 'potato':
        return { emoji: '🥔', color: 'from-amber-700 to-orange-800', bg: 'bg-amber-50 border-amber-200 text-amber-900' };
      default:
        return { emoji: '🌱', color: 'from-emerald-600 to-green-700', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900' };
    }
  };

  // Growth Stage steps
  const growthStages: { stage: GrowthStage; key: string }[] = [
    { stage: 'seedling', key: 'stageSeedling' },
    { stage: 'vegetative', key: 'stageVegetative' },
    { stage: 'flowering', key: 'stageFlowering' },
    { stage: 'fruiting', key: 'stageFruiting' },
    { stage: 'maturity', key: 'stageMaturity' },
  ];

  const currentStageIndex = growthStages.findIndex((s) => s.stage === crop?.growth_stage);
  const activeStageIdx = currentStageIndex >= 0 ? currentStageIndex : 2;

  // Calculate days since sowing
  const getDaysSinceSowing = () => {
    if (!crop?.sowing_date) return null;
    const sow = new Date(crop.sowing_date).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - sow) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  // Quick log irrigation action
  const handleQuickLogWater = () => {
    if (!irrigationRec) return;
    if (onLogIrrigation) {
      onLogIrrigation(
        irrigationRec.water_volume_litres,
        `Quick-logged from dashboard: ${irrigationRec.net_depth_mm}mm recommended depth applied.`
      );
    }
    setQuickLogSuccess(true);
    setTimeout(() => setQuickLogSuccess(false), 4000);
  };

  // Fertilizer tip tailored to growth stage
  const getStageFertilizerTip = (stage?: GrowthStage) => {
    switch (stage) {
      case 'flowering':
        return t('stageFertilizerFlowering');
      case 'vegetative':
        return t('stageFertilizerVegetative');
      case 'fruiting':
        return t('stageFertilizerFruiting');
      default:
        return t('stageFertilizerDefault');
    }
  };

  // Health diagnosis color & badge helper
  const getDiagnosisBadge = (cat?: string) => {
    switch (cat) {
      case 'healthy':
        return {
          label: t('diagnosedHealthy'),
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dotClass: 'bg-emerald-500',
        };
      case 'fungal_disease':
        return {
          label: t('diagnosedFungal'),
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          dotClass: 'bg-amber-500',
        };
      case 'water_stress':
        return {
          label: t('diagnosedWater'),
          badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
          dotClass: 'bg-blue-500',
        };
      case 'nitrogen_stress':
        return {
          label: t('diagnosedNitrogen'),
          badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300',
          dotClass: 'bg-yellow-600',
        };
      case 'pest_damage':
        return {
          label: t('diagnosedPest'),
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
          dotClass: 'bg-rose-500',
        };
      default:
        return {
          label: t('diagnosedUncertain'),
          badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
          dotClass: 'bg-purple-500',
        };
    }
  };

  // Check if simulated states are active
  const isSimulatedLoading = previewState === 'loading' || weatherLoading;
  const isSimulatedEmpty = previewState === 'empty' || (!activeField && fields.length === 0);
  const isSimulatedWeatherError = previewState === 'weather_error' || weatherError;

  // ----------------------------------------------------
  // 1. EMPTY STATE (When no fields are registered)
  // ----------------------------------------------------
  if (isSimulatedEmpty || (!activeField && fields.length === 0)) {
    return (
      <div className="space-y-6 pb-20 md:pb-8">
        <SafetyBanner language={language} />

        {/* State Simulator Switcher */}
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-gray-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-agri-primary" />
            {t('demoStateSimulator')}:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPreviewState('normal')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                previewState === 'normal'
                  ? 'bg-agri-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('stateNormal')}
            </button>
            <button
              onClick={() => setPreviewState('loading')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                previewState === 'loading'
                  ? 'bg-agri-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('stateLoading')}
            </button>
            <button
              onClick={() => setPreviewState('empty')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                previewState === 'empty'
                  ? 'bg-agri-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('stateEmptyField')}
            </button>
            <button
              onClick={() => setPreviewState('weather_error')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                previewState === 'weather_error'
                  ? 'bg-agri-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('stateWeatherError')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#dde7df] shadow-sm text-center max-w-2xl mx-auto my-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-green-50 text-agri-primary flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-200">
            <PlusCircle className="w-10 h-10 stroke-[1.75]" />
          </div>

          <span className="inline-block text-xs font-bold uppercase tracking-wider text-agri-primary bg-agri-light px-3 py-1 rounded-full mb-3">
            {t('welcomeFirstStep')}
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-agri-dark">
            {t('noFields')}
          </h2>

          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
            {t('welcomeDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-8 text-left max-w-lg mx-auto text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
              <span className="text-base">💧</span>
              <div>
                <p className="font-bold text-agri-dark">{t('smartWaterPillTitle')}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">{t('smartWaterPillDesc')}</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5">
              <span className="text-base">📸</span>
              <div>
                <p className="font-bold text-agri-dark">{t('leafScanPillTitle')}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">{t('leafScanPillDesc')}</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-2.5">
              <span className="text-base">🧪</span>
              <div>
                <p className="font-bold text-agri-dark">{t('soilPillTitle')}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">{t('soilPillDesc')}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAddField}
            className="px-8 py-4 rounded-2xl bg-agri-primary hover:bg-agri-accent text-white font-bold text-base shadow-lg shadow-agri-primary/25 transition-all btn-press inline-flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>{t('addField')}</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. LOADING SKELETON STATE
  // ----------------------------------------------------
  if (isSimulatedLoading) {
    return (
      <div className="space-y-6 pb-20 md:pb-8 animate-pulse">
        {/* State Simulator Switcher */}
        <div className="bg-white/80 p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-gray-500 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-agri-primary" />
            {t('loadingDashboard')}
          </span>
          <button
            onClick={() => setPreviewState('normal')}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            {t('stateNormal')}
          </button>
        </div>

        {/* Hero Card Skeleton */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded-full" />
              <div className="w-56 h-8 bg-gray-300 rounded-xl" />
              <div className="w-72 h-3.5 bg-gray-200 rounded-full" />
            </div>
            <div className="w-28 h-16 bg-gray-100 rounded-2xl" />
          </div>
          <div className="w-full h-12 bg-gray-100 rounded-2xl" />
        </div>

        {/* Irrigation Hero Skeleton */}
        <div className="bg-blue-950/40 p-6 rounded-3xl border border-blue-900/30 space-y-4">
          <div className="w-48 h-5 bg-blue-800/50 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-20 bg-blue-900/40 rounded-2xl" />
            <div className="h-20 bg-blue-900/40 rounded-2xl" />
            <div className="h-20 bg-blue-900/40 rounded-2xl" />
          </div>
        </div>

        {/* Two-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 h-56" />
          <div className="bg-white p-6 rounded-3xl border border-gray-200 h-56" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  // Active crop helper
  const cropMeta = getCropMeta(crop?.crop_name);
  const daysSinceSowing = getDaysSinceSowing();

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Safety Notice Banner */}
      <SafetyBanner language={language} />

      {/* Interactive QA State & Language Quick Switcher Bar */}
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-[#dde7df] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-agri-dark/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-agri-primary" />
            {t('demoStateSimulator')}:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setPreviewState('normal')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                (previewState as string) === 'normal'
                  ? 'bg-agri-primary text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('stateNormal')}
            </button>
            <button
              onClick={() => setPreviewState('loading')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                (previewState as string) === 'loading'
                  ? 'bg-agri-primary text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('stateLoading')}
            </button>
            <button
              onClick={() => setPreviewState('empty')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                (previewState as string) === 'empty'
                  ? 'bg-agri-primary text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('stateEmptyField')}
            </button>
            <button
              onClick={() => setPreviewState('weather_error')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                (previewState as string) === 'weather_error'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('stateWeatherError')}
            </button>
          </div>
        </div>

        {/* Quick Language Select on Dashboard */}
        {onLanguageChange && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-gray-200 bg-gray-50 hover:bg-agri-light transition-all">
            <Globe className="w-3.5 h-3.5 text-agri-primary flex-shrink-0" />
            <select
              id="dashboard-language-select"
              aria-label="Select Language"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold text-agri-dark focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. HERO CARD: PROMINENT ACTIVE FIELD & CROP SHOWCASE */}
      {/* ---------------------------------------------------- */}
      {activeField && (
        <div className="bg-gradient-to-br from-white via-white to-[#f4fbf6] rounded-3xl border border-[#cbe3d3] shadow-card p-5 sm:p-7 relative overflow-hidden">
          {/* Subtle decorative leaf background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-emerald-100/40 via-green-50/10 to-transparent pointer-events-none rounded-full translate-x-20 -translate-y-20" />

          {/* Top Row: Greeting, Active Field Title, and In-Card Field Selector */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#e2eee5] relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-agri-primary uppercase tracking-wider">
                  {getGreeting()}, {user.name}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                  {t('farmerBadge')}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-agri-dark tracking-tight">
                  {activeField.name}
                </h1>

                {/* In-Card Quick Field Switcher */}
                {fields.length > 1 && onSelectField && (
                  <div className="relative inline-block">
                    <select
                      value={activeField.id}
                      onChange={(e) => onSelectField(e.target.value)}
                      className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-agri-primary"
                      title={t('switchField')}
                    >
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.area} {f.area_unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Field Attributes Row */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 mt-2 flex-wrap font-medium">
                <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-lg border border-gray-200/70">
                  <MapPin className="w-3.5 h-3.5 text-agri-primary" />
                  {activeField.location_name}
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-gray-200/70 font-semibold text-agri-dark">
                  {activeField.area} {activeField.area_unit}s
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-gray-200/70 capitalize">
                  {t('soilLabelPrefix')}{' '}
                  <span className="font-bold text-agri-dark">{activeField.soil_type}</span>
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-gray-200/70 capitalize">
                  {t('methodLabelPrefix')}{' '}
                  <span className="font-bold text-agri-dark">{activeField.irrigation_method.replace('_', ' ')}</span>
                </span>
              </div>
            </div>

            {/* Crop & Field Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {onOpenAddCrop && (
                <button
                  onClick={onOpenAddCrop}
                  className="px-3.5 py-2 rounded-xl bg-agri-light hover:bg-[#dcfce7] text-agri-primary font-semibold text-xs border border-[#bbf7d0] flex items-center gap-1.5 transition-colors shadow-xs btn-press"
                  title={t('addCropModalTitle')}
                >
                  <Sprout className="w-4 h-4" />
                  <span>{crop ? t('addCropBtn') : t('assignCrop')}</span>
                </button>
              )}
              <button
                onClick={onOpenAddField}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-agri-primary font-semibold text-xs border border-emerald-200 flex items-center gap-1.5 transition-colors shadow-xs btn-press"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('addField')}</span>
              </button>
            </div>
          </div>

          {/* Active Crop Details & Growth Stage Progress Bar */}
          {crop ? (
            <div className="mt-5 space-y-4">
              {/* Crop Identity Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cropMeta.color} text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-900/10 flex-shrink-0`}
                  >
                    <span>{cropMeta.emoji}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-agri-dark">
                        {crop.crop_name}
                      </span>
                      {crop.variety && (
                        <span className="text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                          {crop.variety}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                      <span>
                        {t('sownOn')}: <strong className="text-gray-700">{crop.sowing_date}</strong>
                      </span>
                      {daysSinceSowing && (
                        <span>
                          • <strong className="text-emerald-700">{daysSinceSowing} {t('daysOld')}</strong>
                        </span>
                      )}
                      {crop.expected_harvest_date && (
                        <span>
                          • {t('expectedHarvestOn')}: <strong className="text-gray-700">{crop.expected_harvest_date}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t('growthStage')}
                  </span>
                  <span className="text-sm font-extrabold text-agri-primary capitalize">
                    {t(growthStages[activeStageIdx]?.key || 'stageSeedling')}
                  </span>
                </div>
              </div>

              {/* 5-Stage Growth Progress Track */}
              <div className="bg-white/80 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2.5">
                  <span className="flex items-center gap-1.5 text-agri-dark">
                    <TrendingUp className="w-4 h-4 text-agri-primary" />
                    {t('cropGrowthProgress')}
                  </span>
                  <span className="text-[11px] text-agri-primary font-bold">
                    {t('stageStepLabel')} {activeStageIdx + 1} {t('ofLabel')} 5
                  </span>
                </div>

                {/* Responsive Stepper */}
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-3.5 left-4 right-4 h-1 bg-gray-200 -z-0" />
                  <div
                    className="absolute top-3.5 left-4 h-1 bg-agri-primary transition-all duration-500 -z-0"
                    style={{ width: `${(activeStageIdx / (growthStages.length - 1)) * 90}%` }}
                  />

                  <div className="grid grid-cols-5 gap-1 relative z-10 text-center">
                    {growthStages.map((step, idx) => {
                      const isCompleted = idx < activeStageIdx;
                      const isCurrent = idx === activeStageIdx;

                      return (
                        <div key={step.stage} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-agri-primary text-white shadow-xs'
                                : isCurrent
                                ? 'bg-white text-agri-primary border-2 border-agri-primary ring-4 ring-emerald-100 shadow-sm scale-110'
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                          >
                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] sm:text-[11px] mt-1.5 leading-tight font-medium ${
                              isCurrent
                                ? 'text-agri-dark font-extrabold'
                                : isCompleted
                                ? 'text-gray-700'
                                : 'text-gray-400'
                            }`}
                          >
                            {t(step.key)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Field has no crop yet (Empty Crop State) */
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-amber-950">{t('noCropAssigned')}</p>
                  <p className="text-amber-800 text-[11px]">
                    {t('noCropGuidance')}
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenAddCrop || onOpenAddField}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap btn-press"
              >
                {t('assignCrop')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. HERO ACTION: NEXT IRRIGATION RECOMMENDATION CARD  */}
      {/* ---------------------------------------------------- */}
      {irrigationRec && (
        <div className="bg-gradient-to-br from-[#0c2340] via-[#0d2a4d] to-[#07182c] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-blue-900/60 relative overflow-hidden">
          {/* Subtle water ripple background circles */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-blue-500/10 pointer-events-none" />
          <div className="absolute right-12 bottom-0 translate-y-16 w-48 h-48 rounded-full bg-cyan-500/10 pointer-events-none" />

          {/* Card Header & Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                <Droplets className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  {t('nextIrrigationAction')}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {weather.rain_probability >= 50
                    ? t('irrigationDelayRain')
                    : t('irrigationDueToday')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] px-3 py-1 rounded-full font-semibold border ${
                  weather.is_stale
                    ? 'bg-amber-500/30 text-amber-100 border-amber-400/40'
                    : irrigationRec.is_demo
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                }`}
              >
                {weather.is_stale
                  ? `${t('offlineRecBannerTitle')} (${weather.cached_age_display || 'Offline'})`
                  : irrigationRec.is_demo
                  ? 'Demo ETc Model'
                  : 'Live ETc Calculated'}
              </span>
            </div>
          </div>

          {/* Offline Cached Recommendation Advisory */}
          {weather.is_stale && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-xs text-amber-100 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">{t('offlineRecBannerTitle')}: </span>
                <span>{t('offlineRecBannerDesc')}</span>
              </div>
            </div>
          )}

          {/* Rain Warning Alert Banner (if rain probability >= 40% or rain amount > 0) */}
          {(weather.rain_probability >= 40 || weather.rain_amount > 2) && (
            <div className="mb-4 p-3 rounded-2xl bg-blue-500/20 border border-cyan-400/40 text-xs text-cyan-100 flex items-start gap-2.5">
              <CloudRain className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">{t('rainAlertTitle')}: </span>
                <span>
                  {weather.rain_probability}% ({weather.rain_amount}mm) {t('rainAlertHoldDesc')}
                </span>
              </div>
            </div>
          )}

          {/* Key 3-Metric Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-3 py-3 border-y border-blue-800/60 relative z-10">
            {/* 1. Net Depth */}
            <div className="bg-blue-900/40 p-3.5 rounded-2xl border border-blue-700/40">
              <p className="text-xs text-blue-300 font-medium">{t('waterDepthNeedLabel')}</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                {irrigationRec.net_depth_mm} <span className="text-xs font-normal text-blue-200">mm</span>
              </p>
              <p className="text-[10px] text-blue-300/80 mt-1">
                ETc: {irrigationRec.etc_mm} mm
              </p>
            </div>

            {/* 2. Total Volume Needed */}
            <div className="bg-blue-900/40 p-3.5 rounded-2xl border border-blue-700/40">
              <p className="text-xs text-blue-300 font-medium">{t('waterVolumeNeedLabel')}</p>
              <p className="text-2xl sm:text-3xl font-black text-cyan-300 mt-1">
                {irrigationRec.water_volume_litres.toLocaleString()}{' '}
                <span className="text-xs font-normal text-blue-200">Litres</span>
              </p>
              <p className="text-[10px] text-cyan-200/80 mt-1">
                ~{Math.round(irrigationRec.water_volume_litres / 5000)} {t('tankersUnit')}
              </p>
            </div>

            {/* 3. Pump Run Time */}
            <div className="bg-blue-900/40 p-3.5 rounded-2xl border border-blue-700/40">
              <p className="text-xs text-blue-300 font-medium">{t('pumpRunTimeLabel')}</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">
                {irrigationRec.irrigation_time_hours}{' '}
                <span className="text-xs font-normal text-blue-200">Hours</span>
              </p>
              <p className="text-[10px] text-emerald-200/80 mt-1">
                @ {activeField?.flow_rate || 3000} L/hr pump
              </p>
            </div>
          </div>

          {/* Time Window & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 relative z-10">
            <div className="text-xs text-blue-200/90 leading-relaxed max-w-xl">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-300" />
                {t('recommendedWindowLabel')}: {irrigationRec.recommended_time}
              </span>
              <p className="text-[11px] text-blue-300/80 mt-0.5">
                {irrigationRec.explanation || 'Early morning pumping minimizes wind drift and soil evaporation.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Log Button */}
              <button
                onClick={handleQuickLogWater}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 btn-press shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>{quickLogSuccess ? t('waterLoggedSuccess') : t('logWaterNow')}</span>
              </button>

              {/* Full Planner Button */}
              <button
                onClick={() => onNavigate('water')}
                className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 btn-press shadow-md whitespace-nowrap"
              >
                <span>{t('viewFullPlanner')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. TWO-COLUMN GRID: WEATHER & CROP-HEALTH CONFIDENCE */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* -------------------------------------------------- */}
        {/* WIDGET A: WEATHER & RAIN PROBABILITY (WITH ERROR STATE) */}
        {/* -------------------------------------------------- */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card flex flex-col justify-between">
          <div>
            {/* Header with Title and Refresh Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm sm:text-base text-agri-dark">
                  {t('weatherSummary')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                    isSimulatedWeatherError
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : weather.is_stale
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : weather.is_demo
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isSimulatedWeatherError
                    ? 'Offline Fallback'
                    : weather.is_stale
                    ? `${t('staleWeatherBadge')} (${weather.cached_age_display || 'Cached'})`
                    : weather.is_demo
                    ? 'Demo Weather'
                    : 'Live Open-Meteo'}
                </span>
                <button
                  onClick={onRefreshWeather}
                  disabled={weatherLoading}
                  className="p-1.5 rounded-xl text-gray-500 hover:text-agri-primary hover:bg-gray-100 transition-colors"
                  title="Refresh live weather"
                >
                  <RefreshCw className={`w-4 h-4 ${weatherLoading ? 'animate-spin text-agri-primary' : ''}`} />
                </button>
              </div>
            </div>

            {/* Stale Weather Indicator Notice */}
            {weather.is_stale && !isSimulatedWeatherError && (
              <div className="my-2.5 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{t('staleWeatherBadge')}: </span>
                  <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                    {t('staleWeatherNotice')}
                  </span>
                </div>
              </div>
            )}

            {/* Weather Error State Display */}
            {isSimulatedWeatherError ? (
              <div className="my-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="font-bold">{t('weatherError')}</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {t('weatherErrorDesc')}
                </p>
                <button
                  onClick={onRefreshWeather}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-rose-700 btn-press"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('retryWeather')}</span>
                </button>
              </div>
            ) : (
              <>
                {/* Temperature & Location Row */}
                <div className="flex items-baseline justify-between my-2">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-4xl sm:text-5xl font-black text-agri-dark tracking-tight">
                      {weather.temperature}°C
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {weather.city_name || activeField?.location_name || 'Wardha, Maharashtra'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                    {weather.rain_probability > 50
                      ? t('weatherRainyCond')
                      : t('weatherDryCond')}
                  </span>
                </div>

                {/* Rain Probability Visual Meter */}
                <div className="my-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-blue-950 flex items-center gap-1.5">
                      <CloudRain className="w-4 h-4 text-blue-600" />
                      {t('rainProbability')}
                    </span>
                    <span className="text-blue-800 font-extrabold text-sm">
                      {weather.rain_probability}%{' '}
                      <span className="text-xs font-medium text-blue-600">
                        ({weather.rain_amount} mm in 48h)
                      </span>
                    </span>
                  </div>
                  {/* Progress Meter Bar */}
                  <div className="w-full h-2 bg-blue-200/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        weather.rain_probability > 60
                          ? 'bg-blue-600'
                          : weather.rain_probability > 25
                          ? 'bg-cyan-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(weather.rain_probability, 5)}%` }}
                    />
                  </div>
                </div>

                {/* Secondary Weather Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-2xl text-center">
                    <p className="text-[11px] text-gray-500">{t('humidity')}</p>
                    <p className="font-extrabold text-agri-dark text-sm mt-0.5">{weather.relative_humidity}%</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-2xl text-center">
                    <p className="text-[11px] text-gray-500">{t('windSpeed')}</p>
                    <p className="font-extrabold text-agri-dark text-sm mt-0.5">{weather.wind_speed} km/h</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-2xl text-center">
                    <p className="text-[11px] text-gray-500">{t('evapotranspiration')}</p>
                    <p className="font-extrabold text-agri-primary text-sm mt-0.5">{weather.et0} mm/d</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <p className="text-[11px] text-gray-400 mt-3 italic flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {t('evapoTip')}
          </p>
        </div>

        {/* -------------------------------------------------- */}
        {/* WIDGET B: CROP-HEALTH DIAGNOSTIC & CONFIDENCE      */}
        {/* -------------------------------------------------- */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-agri-primary" />
                <h3 className="font-bold text-sm sm:text-base text-agri-dark">
                  {t('healthConfidence')}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('scan')}
                className="text-xs font-semibold text-agri-primary hover:underline flex items-center gap-1"
              >
                <span>{t('scanLeaf')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* When a recent scan exists */}
            {recentScan ? (
              <div className="bg-[#f7fbf8] border border-emerald-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3.5">
                  {/* Thumbnail with expand preview */}
                  {recentScan.image_url ? (
                    <button
                      onClick={() => setSelectedImageModal(recentScan.image_url || null)}
                      className="relative group rounded-xl overflow-hidden border border-emerald-300 flex-shrink-0"
                      title="Click to inspect photo"
                    >
                      <img
                        src={recentScan.image_url}
                        alt="Crop leaf"
                        className="w-16 h-16 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-lg flex-shrink-0">
                      🌿
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Diagnosis & Confidence badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const meta = getDiagnosisBadge(recentScan.result_category);
                        return (
                          <span
                            className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${meta.badgeClass}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                            {meta.label}
                          </span>
                        );
                      })()}

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          recentScan.confidence >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : recentScan.confidence >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {recentScan.confidence}%{' '}
                        {recentScan.confidence >= 80
                          ? t('confidenceHigh')
                          : recentScan.confidence >= 50
                          ? t('confidenceMedium')
                          : t('confidenceLow')}
                      </span>
                    </div>

                    {/* Confidence Meter Bar */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          recentScan.confidence >= 80
                            ? 'bg-emerald-500'
                            : recentScan.confidence >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${recentScan.confidence}%` }}
                      />
                    </div>

                    <p className="text-xs text-gray-700 mt-2 line-clamp-2 leading-relaxed">
                      {recentScan.explanation}
                    </p>
                  </div>
                </div>

                {/* Symptoms pills */}
                {recentScan.observed_symptoms && recentScan.observed_symptoms.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-emerald-100/80 text-[11px]">
                    <span className="text-gray-500 font-semibold">{t('observedSymptomsLabel')}:</span>
                    {recentScan.observed_symptoms.slice(0, 3).map((sym, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700">
                        {sym}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* EMPTY SCAN STATE */
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-agri-primary flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-agri-dark">{t('noScansYet')}</p>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                  {t('noScansYetDesc')}
                </p>
                <button
                  onClick={() => onNavigate('scan')}
                  className="mt-2 px-4 py-2 rounded-xl bg-agri-primary hover:bg-agri-accent text-white font-semibold text-xs inline-flex items-center gap-1.5 btn-press shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t('scanFirstLeaf')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick buttons under Health Triage */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
            <button
              onClick={() => onNavigate('scan')}
              className="text-xs font-semibold text-agri-primary hover:underline flex items-center gap-1"
            >
              <span>{recentScan ? t('scanAnother') : t('scanFirstLeaf')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('expert')}
              className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span>{t('askAgronomist')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. SOIL-TEST & FERTILIZER REMINDER CARD              */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-700" />
            <h2 className="font-bold text-sm sm:text-base text-agri-dark">
              {t('soilNutrientTitle')}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('fertilizer')}
            className="text-xs font-semibold text-agri-primary hover:underline flex items-center gap-1"
          >
            <span>{t('navFertilizer')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* State: Soil Test on Record vs Soil Test Missing */}
        {soilTest ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Soil Test Report Summary */}
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-purple-700" />
                  {t('soilTestActive')}
                </span>
                <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                  {soilTest.test_date}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-purple-100">
                  <p className="text-[10px] text-gray-500">N (Nitrogen)</p>
                  <p className="font-bold text-purple-950 mt-0.5">{soilTest.nitrogen || 210} kg/ha</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100">
                  <p className="text-[10px] text-gray-500">P (Phosphorus)</p>
                  <p className="font-bold text-purple-950 mt-0.5">{soilTest.phosphorus || 24} kg/ha</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100">
                  <p className="text-[10px] text-gray-500">K (Potassium)</p>
                  <p className="font-bold text-purple-950 mt-0.5">{soilTest.potassium || 280} kg/ha</p>
                </div>
              </div>
              {soilTest.ph && (
                <p className="text-[11px] text-purple-900 mt-2 font-medium text-center">
                  Soil pH: <strong>{soilTest.ph}</strong> (Neutral & balanced)
                </p>
              )}
            </div>

            {/* Growth Stage Fertilizer Tip (2 columns) */}
            <div className="md:col-span-2 bg-[#f9fbf9] border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-agri-dark flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-agri-primary" />
                  {t('stageFertilizerTip')} ({crop?.growth_stage || 'Flowering'})
                </span>
                <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                  {getStageFertilizerTip(crop?.growth_stage)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-gray-100 text-xs">
                <span className="text-[11px] text-gray-500">
                  {t('splitGuidanceIcar')}
                </span>
                <button
                  onClick={() => onNavigate('fertilizer')}
                  className="font-bold text-agri-primary hover:underline"
                >
                  {t('viewSplitDosesBtn')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* EMPTY / REMINDER STATE: Missing Soil Test */
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  {t('soilTestMissing')}
                </h4>
                <p className="text-xs text-amber-900/90 mt-1 max-w-xl leading-relaxed">
                  {t('soilTestMissingWarning')}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenSoilModal}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap btn-press shadow-xs flex-shrink-0"
            >
              {t('recordSoilTestBtn')}
            </button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. QUICK-ACTION BUTTONS (FARMER TOUCH GRID)          */}
      {/* ---------------------------------------------------- */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-agri-dark/70 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-agri-primary" />
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Action 1: Scan Leaf */}
          <button
            onClick={() => onNavigate('scan')}
            className="p-4 rounded-2xl bg-white border border-[#dde7df] hover:border-emerald-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group btn-press"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-agri-primary group-hover:bg-agri-primary group-hover:text-white transition-colors flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-agri-dark">{t('actionScanTitle')}</span>
            <span className="text-[10px] text-gray-500">{t('actionScanDesc')}</span>
          </button>

          {/* Action 2: Plan Irrigation */}
          <button
            onClick={() => onNavigate('water')}
            className="p-4 rounded-2xl bg-white border border-[#dde7df] hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group btn-press"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-agri-dark">{t('actionWaterTitle')}</span>
            <span className="text-[10px] text-gray-500">{t('actionWaterDesc')}</span>
          </button>

          {/* Action 3: Record Soil Test */}
          <button
            onClick={onOpenSoilModal}
            className="p-4 rounded-2xl bg-white border border-[#dde7df] hover:border-purple-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group btn-press"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-agri-dark">{t('actionSoilTitle')}</span>
            <span className="text-[10px] text-gray-500">{t('actionSoilDesc')}</span>
          </button>

          {/* Action 4: Field Timeline */}
          <button
            onClick={() => onNavigate('timeline')}
            className="p-4 rounded-2xl bg-white border border-[#dde7df] hover:border-amber-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group btn-press"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-agri-dark">{t('actionTimelineTitle')}</span>
            <span className="text-[10px] text-gray-500">{t('actionTimelineDesc')}</span>
          </button>

          {/* Action 5: Ask Agronomist */}
          <button
            onClick={() => onNavigate('expert')}
            className="p-4 rounded-2xl bg-white border border-[#dde7df] hover:border-indigo-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group btn-press"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-agri-dark">{t('actionExpertTitle')}</span>
            <span className="text-[10px] text-gray-500">{t('actionExpertDesc')}</span>
          </button>

          {/* Action 6: Add Field */}
          <button
            onClick={onOpenAddField}
            className="p-4 rounded-2xl bg-white border border-[#dde7df] hover:border-teal-400 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-2 group btn-press"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-agri-dark">{t('actionAddFieldTitle')}</span>
            <span className="text-[10px] text-gray-500">{t('actionAddFieldDesc')}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 6. RECENT FIELD TIMELINE STREAM                      */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-agri-primary" />
            <h2 className="font-bold text-base text-agri-dark">
              {t('recentActivities')}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('timeline')}
            className="text-xs font-semibold text-agri-primary hover:underline"
          >
            {t('viewAllActivities')}
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 space-y-2">
            <p>{t('noActivitiesYet')}</p>
            <button
              onClick={() => onNavigate('timeline')}
              className="font-bold text-agri-primary hover:underline"
            >
              {t('logFirstActivityBtn')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 mt-2">
            {recentActivities.slice(0, 4).map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 text-agri-dark flex items-center justify-center flex-shrink-0 mt-0.5">
                    {act.type === 'scan' && <Camera className="w-4 h-4 text-emerald-700" />}
                    {act.type === 'irrigation' && <Droplets className="w-4 h-4 text-blue-700" />}
                    {act.type === 'fertilizer' && <FlaskConical className="w-4 h-4 text-purple-700" />}
                    {act.type === 'soil_test' && <CheckCircle2 className="w-4 h-4 text-amber-700" />}
                    {act.type === 'expert_note' && <ShieldCheck className="w-4 h-4 text-indigo-700" />}
                    {act.type === 'weather_event' && <CloudSun className="w-4 h-4 text-sky-700" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-agri-dark">{act.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{act.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(act.activity_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      act.completed
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {act.completed ? t('doneStatusBadge') : t('notDoneStatusBadge')}
                  </span>
                  {act.farmer_feedback && (
                    <span className="text-[9px] font-medium text-gray-500">
                      {act.farmer_feedback === 'helpful' ? t('feedbackHelpful') :
                       act.farmer_feedback === 'resolved' ? t('feedbackResolved') :
                       act.farmer_feedback === 'unsure' ? t('feedbackUnsure') :
                       t('feedbackHarmful')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* IMAGE PREVIEW MODAL                                   */}
      {/* ---------------------------------------------------- */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-lg w-full relative overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-agri-dark">
                {t('scannedFoliageLabel')}
              </span>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 rounded-2xl overflow-hidden bg-black/5">
              <img
                src={selectedImageModal}
                alt="Leaf scan full"
                className="w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
