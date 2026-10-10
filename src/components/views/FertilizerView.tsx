'use client';

import React, { useMemo, useEffect } from 'react';
import { Field, Crop, SoilTest, Language } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { storageService } from '../../services/storageService';
import { SafetyBanner } from '../SafetyBanner';
import { generateFertilizerRecommendation } from '../../services/fertilizerService';
import {
  FlaskConical,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  PlusCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface FertilizerViewProps {
  language: Language;
  fields: Field[];
  activeField: Field;
  crop?: Crop;
  soilTest?: SoilTest;
  isOnline?: boolean;
  onOpenSoilModal: () => void;
  onSelectField: (id: string) => void;
}

export const FertilizerView: React.FC<FertilizerViewProps> = ({
  language,
  fields,
  activeField,
  crop,
  soilTest,
  isOnline = true,
  onOpenSoilModal,
  onSelectField,
}) => {
  const t = (key: string) => getTranslation(language, key);

  const fallbackCrop: Crop = crop || {
    id: 'crop-temp',
    field_id: activeField.id,
    crop_name: 'Tomato',
    sowing_date: '2026-08-10',
    growth_stage: 'vegetative',
  };

  const rec = useMemo(() => {
    return generateFertilizerRecommendation(activeField, fallbackCrop, soilTest);
  }, [activeField, fallbackCrop, soilTest]);

  // Persist fertilizer recommendation locally for offline access
  useEffect(() => {
    if (rec) {
      storageService.saveLatestRecommendations({ fertilizerRec: rec });
    }
  }, [rec]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-agri-dark">
          {t('fertilizerTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-agri-dark/70 mt-1">
          {t('fertilizerSubtitle')}
        </p>
      </div>

      <SafetyBanner language={language} />

      {/* Offline Saved Recommendations Advisory Banner */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm">{t('offlineRecBannerTitle')}</span>
            <p className="text-amber-900/80 leading-relaxed mt-0.5">
              {t('offlineRecBannerDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Field Selector & Soil Test Status Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#dde7df] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            {t('activeField')}
          </label>
          <select
            value={activeField.id}
            onChange={(e) => onSelectField(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold bg-white focus:ring-2 focus:ring-agri-primary"
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.area} {f.area_unit})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
          {soilTest ? (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Lab Report: {soilTest.test_date}</span>
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{t('noSoilTestWarning')}</span>
            </div>
          )}

          <button
            onClick={onOpenSoilModal}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 btn-press whitespace-nowrap"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{soilTest ? t('updateSoilTestBtn') : t('enterSoilTestBtn')}</span>
          </button>
        </div>
      </div>

      {/* STRICT SAFETY STATE: When soil test is missing */}
      {!rec.has_soil_test ? (
        <div className="bg-amber-50/90 border-2 border-amber-400 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-7 h-7 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-black text-amber-950">
                {t('educationalModeTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed font-semibold">
                "{rec.safety_warning}"
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-amber-300 text-xs text-amber-950 leading-relaxed">
            <p className="font-bold text-amber-900 mb-1">
              {t('safetyProtocolLabel')}
            </p>
            <p>{t('noSoilTestDataNotice')}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
              {t('safeGeneralAdviceLabel')}
            </h3>
            <ul className="space-y-2 text-xs text-amber-900">
              {rec.split_guidance.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onOpenSoilModal}
              className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all shadow-md btn-press flex items-center gap-2"
            >
              <span>{t('enterSoilTestBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* SOIL-TEST GROUNDED RECOMMENDATION CARD */
        <div className="space-y-5">
          {/* Diagnostic & Calculated NPK Target */}
          <div className="bg-white rounded-3xl p-6 border border-[#dde7df] shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  {t('soilGroundedAdvisoryBadge')}
                </span>
                <h2 className="text-xl font-black text-agri-dark mt-0.5">
                  Nutrient Plan for {fallbackCrop.crop_name} ({activeField.area} {activeField.area_unit}s)
                </h2>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                {t('highScientificConfidence')}
              </span>
            </div>

            {/* Target Nutrients Grid */}
            <div className="grid grid-cols-3 gap-3 my-2">
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100 text-center">
                <span className="text-xs font-bold text-purple-800">{t('totalNitrogenLabel')}</span>
                <p className="text-2xl font-black text-purple-950 mt-1">
                  {rec.recommended_nutrients.nitrogen_kg_ha} <span className="text-xs font-medium">kg</span>
                </p>
                <span className="text-[10px] text-purple-700 mt-0.5 block">Split across 3 doses</span>
              </div>

              <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-center">
                <span className="text-xs font-bold text-blue-800">{t('totalPhosphorusLabel')}</span>
                <p className="text-2xl font-black text-blue-950 mt-1">
                  {rec.recommended_nutrients.phosphorus_kg_ha} <span className="text-xs font-medium">kg</span>
                </p>
                <span className="text-[10px] text-blue-700 mt-0.5 block">100% at basal stage</span>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 text-center">
                <span className="text-xs font-bold text-emerald-800">{t('totalPotashLabel')}</span>
                <p className="text-2xl font-black text-emerald-950 mt-1">
                  {rec.recommended_nutrients.potassium_kg_ha} <span className="text-xs font-medium">kg</span>
                </p>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">Split (Basal + Flowering)</span>
              </div>
            </div>

            <p className="text-xs text-agri-dark/80 bg-gray-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
              {rec.explanation}
            </p>
          </div>

          {/* Split Application Guidance */}
          <div className="bg-white rounded-3xl p-6 border border-[#dde7df] shadow-card space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-agri-primary" />
              <h3 className="font-bold text-sm text-agri-dark uppercase tracking-wider">
                {t('recommendedSplit')}
              </h3>
            </div>

            <div className="space-y-2.5">
              {rec.split_guidance.map((step, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-xs text-agri-dark">
                  <span className="w-5 h-5 rounded-full bg-agri-light text-agri-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Warning */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-4 text-xs text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold">{t('safetyAdvisoryPrefix')} </span>
              {rec.safety_warning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
