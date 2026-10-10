'use client';

import React, { useState } from 'react';
import { ScanResult, Language } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { SafetyBanner } from '../SafetyBanner';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  BookmarkCheck,
  UserCheck,
  Camera,
  CheckCircle2,
  HelpCircle,
  FileText,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface ScanResultViewProps {
  language: Language;
  result: ScanResult;
  onSaveToTimeline: () => void;
  onAskExpert: () => void;
  onScanAnother: () => void;
  onGoToTimeline: () => void;
}

export const ScanResultView: React.FC<ScanResultViewProps> = ({
  language,
  result,
  onSaveToTimeline,
  onAskExpert,
  onScanAnother,
  onGoToTimeline,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const [saved, setSaved] = useState(false);
  const [expertEscalated, setExpertEscalated] = useState(false);

  const isLowConfidence = result.confidence < 50 || result.confidence_level === 'low';

  const handleSave = () => {
    onSaveToTimeline();
    setSaved(true);
  };

  const handleEscalate = () => {
    onAskExpert();
    setExpertEscalated(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-agri-dark">
            {t('scanResultTitle')}
          </h1>
          <p className="text-xs text-agri-dark/70 mt-0.5">
            Crop: <span className="font-semibold text-agri-primary">{result.crop_name}</span> • Triage ID: #{result.id.slice(-6)}
          </p>
        </div>

        <button
          onClick={onScanAnother}
          className="px-4 py-2 rounded-xl border border-gray-200 hover:border-agri-primary text-xs font-semibold text-agri-dark flex items-center gap-1.5 self-start sm:self-auto btn-press"
        >
          <Camera className="w-4 h-4 text-agri-primary" />
          <span>{t('scanAnother')}</span>
        </button>
      </div>

      {/* MANDATORY LOW CONFIDENCE WARNING WHEN CONFIDENCE < 50% */}
      {isLowConfidence && (
        <div className="bg-amber-100/90 border-2 border-amber-400 rounded-3xl p-5 flex items-start gap-3.5 shadow-md animate-in fade-in">
          <AlertTriangle className="w-6 h-6 text-amber-800 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-amber-950">
              {t('lowReliabilityTitle')}
            </h3>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed">
              {t('lowConfidenceDisclaimer')}
            </p>
          </div>
        </div>
      )}

      {/* Two-Column Diagnostic Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card">
        {/* Left Column: Image & Quality Gauge */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black/5 aspect-square flex items-center justify-center">
            {result.image_url ? (
              <img
                src={result.image_url}
                alt="Uploaded Leaf"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
          </div>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
            <div>
              <p className="text-gray-500">{t('qualityScore')}</p>
              <p className="font-bold text-agri-dark text-sm mt-0.5">
                {result.image_quality}%
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                result.image_quality >= 80
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {result.image_quality >= 80 ? t('optimalContrast') : t('suboptimalLighting')}
            </span>
          </div>
        </div>

        {/* Right Column: Findings, Symptoms & Recommended Action */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            {/* Confidence Badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  result.confidence_level === 'high'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : result.confidence_level === 'medium'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {result.confidence_level === 'high' && <CheckCircle2 className="w-4 h-4" />}
                {result.confidence_level === 'medium' && <Activity className="w-4 h-4" />}
                {result.confidence_level === 'low' && <AlertTriangle className="w-4 h-4" />}
                <span>
                  {result.confidence}% {t('confidence')} (
                  {result.confidence_level === 'high'
                    ? t('confidenceWordHigh')
                    : result.confidence_level === 'medium'
                    ? t('confidenceWordMedium')
                    : t('confidenceWordLow')}
                  )
                </span>
              </span>

              <span className="text-[11px] text-gray-400">
                {new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Possible Issue Title */}
            <h2 className="text-xl sm:text-2xl font-black text-agri-dark capitalize">
              {result.result_category.replace('_', ' ')}
            </h2>

            {/* Observed Symptoms List */}
            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-agri-dark/70 mb-2">
                {t('observedSymptoms')}
              </h3>
              <ul className="space-y-1.5">
                {result.observed_symptoms.map((symp, i) => (
                  <li key={i} className="text-xs text-agri-dark flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-agri-primary mt-1.5 flex-shrink-0" />
                    <span>{symp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agronomic Explanation */}
            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-agri-dark/70 mb-1">
                {t('explanation')}
              </h3>
              <p className="text-xs text-agri-dark/85 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-100">
                {result.explanation}
              </p>
            </div>

            {/* Recommended Next Step Card */}
            <div className="mt-4 bg-[#f0fdf4] border border-[#bbf7d0] p-3.5 rounded-2xl">
              <div className="flex items-center gap-1.5 mb-1 text-agri-primary font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('recommendedNextStep')}</span>
              </div>
              <p className="text-xs text-agri-dark font-medium leading-relaxed">
                {result.recommended_next_step}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleSave}
              disabled={saved}
              className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all btn-press ${
                saved
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-agri-primary hover:bg-agri-accent text-white shadow-md shadow-agri-primary/20'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{saved ? t('resultSavedToast') : t('saveResultToTimeline')}</span>
            </button>

            <button
              onClick={handleEscalate}
              disabled={expertEscalated}
              className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all btn-press ${
                expertEscalated
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : 'bg-white hover:bg-gray-50 text-purple-900 border-purple-300'
              }`}
            >
              <UserCheck className="w-4 h-4 text-purple-700" />
              <span>{expertEscalated ? t('expertEscalatedToast') : t('askExpert')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MANDATORY PRODUCT SAFETY RULE CARD */}
      <div className="bg-red-50/70 border border-red-200/80 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-red-950 leading-relaxed">
          <p className="font-bold text-red-900 mb-0.5">
            {t('safetyRuleTitle')}
          </p>
          <p>{t('photoSafetyRule')}</p>
        </div>
      </div>

      {/* Next Flow Helper */}
      <div className="bg-white p-4 rounded-3xl border border-[#dde7df] flex items-center justify-between">
        <span className="text-xs text-gray-600">{t('wantToSeePastRecords')}</span>
        <button
          onClick={onGoToTimeline}
          className="text-xs font-bold text-agri-primary hover:underline flex items-center gap-1"
        >
          <span>{t('viewTimeline')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
