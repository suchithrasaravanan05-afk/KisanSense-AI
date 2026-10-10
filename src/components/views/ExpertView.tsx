'use client';

import React, { useState } from 'react';
import { ExpertReview, Language, ResultCategory } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { SafetyBanner } from '../SafetyBanner';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ExpertViewProps {
  language: Language;
  reviews: ExpertReview[];
  onUpdateReview: (id: string, updates: Partial<ExpertReview>) => void;
}

export const ExpertView: React.FC<ExpertViewProps> = ({
  language,
  reviews,
  onUpdateReview,
}) => {
  const t = (key: string) => getTranslation(language, key);

  const [activeReviewId, setActiveReviewId] = useState<string>(reviews[0]?.id || '');
  const [expertNotes, setExpertNotes] = useState<string>('');
  const [correctedDiagnosis, setCorrectedDiagnosis] = useState<ResultCategory>('fungal_disease');
  const [status, setStatus] = useState<'pending' | 'in_review' | 'resolved'>('in_review');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeReview = reviews.find((r) => r.id === activeReviewId) || reviews[0];

  const handleSelectReview = (rev: ExpertReview) => {
    setActiveReviewId(rev.id);
    setExpertNotes(rev.expert_notes || '');
    setCorrectedDiagnosis(rev.corrected_result || rev.ai_category);
    setStatus(rev.review_status);
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview) return;

    onUpdateReview(activeReview.id, {
      expert_notes: expertNotes,
      corrected_result: correctedDiagnosis,
      review_status: status,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-agri-dark">
          {t('expertPortalTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-agri-dark/70 mt-1">
          {t('expertPortalSubtitle')}
        </p>
      </div>

      <SafetyBanner language={language} variant="info" />

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#dde7df]">
          <p className="text-sm text-gray-500">{t('queueEmpty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Worklist Column (Left 4 cols) */}
          <div className="md:col-span-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t('escalationQueueLabel')} ({reviews.length})
            </h2>

            <div className="space-y-2.5">
              {reviews.map((rev) => {
                const isSelected = rev.id === activeReview?.id;
                return (
                  <button
                    key={rev.id}
                    onClick={() => handleSelectReview(rev)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 btn-press ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-400 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={rev.image_url}
                      alt={rev.crop_name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-agri-dark truncate">
                          {rev.crop_name} • {rev.field_name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            rev.review_status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rev.review_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {t('farmerLabel')}: {rev.farmer_name}
                      </p>
                      <p className="text-[10px] text-purple-700 font-semibold mt-1">
                        AI: {rev.ai_category} ({rev.ai_confidence}% conf.)
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expert Review Workspace (Right 7 cols) */}
          {activeReview && (
            <div className="md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    Case #{activeReview.id.slice(-6)}
                  </span>
                  <h3 className="text-base font-extrabold text-agri-dark mt-0.5">
                    {activeReview.farmer_name} — {activeReview.field_name}
                  </h3>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activeReview.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Leaf Image & AI Triage */}
              <div className="flex flex-col sm:flex-row gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <img
                  src={activeReview.image_url}
                  alt="Escalated Leaf"
                  className="w-24 h-24 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-agri-dark">
                    {t('initialAiHypothesisLabel')} <span className="capitalize text-purple-800">{activeReview.ai_category.replace('_', ' ')}</span>
                  </p>
                  <p className="text-gray-500">
                    {t('confidenceRatingLabel')} <span className="font-semibold text-agri-dark">{activeReview.ai_confidence}%</span>
                  </p>
                  <p className="text-gray-500">
                    {t('targetCropLabel')} <span className="font-semibold text-agri-dark">{activeReview.crop_name}</span>
                  </p>
                  <p className="text-amber-800 bg-amber-50 p-1.5 rounded-lg text-[10px] border border-amber-200 mt-1">
                    {t('markedForHumanVerification')}
                  </p>
                </div>
              </div>

              {/* Expert Evaluation Form */}
              <form onSubmit={handleSave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-agri-dark mb-1">
                    {t('correctedDiagnosis')}
                  </label>
                  <select
                    value={correctedDiagnosis}
                    onChange={(e) => setCorrectedDiagnosis(e.target.value as ResultCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="fungal_disease">Fungal Disease (Early Blight / Blast / Rust)</option>
                    <option value="pest_damage">Pest Damage (Chewing / Sucking Pests)</option>
                    <option value="nitrogen_stress">Nutrient Deficiency (Nitrogen / Zinc)</option>
                    <option value="water_stress">Moisture / Water Stress</option>
                    <option value="healthy">Healthy Canopy (False Alarm)</option>
                    <option value="uncertain">Inconclusive Photo (Request Rescan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-agri-dark mb-1">
                    {t('expertPrescriptionLabel')}
                  </label>
                  <textarea
                    rows={4}
                    value={expertNotes}
                    onChange={(e) => setExpertNotes(e.target.value)}
                    placeholder={t('expertNotesPlaceholder')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-agri-dark mb-1">
                    {t('reviewStatusLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pending', 'in_review', 'resolved'] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setStatus(st)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          status === st
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {st === 'pending'
                          ? t('statusPending')
                          : st === 'in_review'
                          ? t('statusInReview')
                          : t('statusResolved')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {savedSuccess ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {t('recommendationDispatched')}
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 btn-press"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t('saveReviewBtn')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
