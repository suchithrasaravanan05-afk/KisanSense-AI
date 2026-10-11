'use client';

import React, { useState } from 'react';
import {
  Field,
  FieldActivity,
  Language,
  ActivityType,
  FieldFeedbackRecord,
  FeedbackOutcome,
  FeedbackStatus,
} from '../../types';
import { getTranslation } from '../../i18n/translations';
import { SafetyBanner } from '../SafetyBanner';
import {
  History,
  Camera,
  Droplets,
  FlaskConical,
  CheckCircle2,
  Calendar,
  Filter,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ShieldCheck,
  Check,
  XCircle,
  MessageSquare,
  ShieldAlert,
  PlusCircle,
  Clock,
  Sparkles,
  Sprout,
  MinusCircle,
  AlertTriangle,
  Trash2,
  Edit3,
  Maximize2,
  X,
  FileText,
} from 'lucide-react';

interface TimelineViewProps {
  language: Language;
  fields: Field[];
  activeField: Field;
  activities: FieldActivity[];
  feedbacks?: FieldFeedbackRecord[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSubmitFeedback: (id: string, feedback: 'helpful' | 'unsure' | 'harmful' | 'resolved') => void;
  onSelectField: (id: string) => void;
  onOpenFeedbackModal?: (activity?: FieldActivity, feedback?: FieldFeedbackRecord) => void;
  onDeleteFeedback?: (id: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  language,
  fields,
  activeField,
  activities,
  feedbacks = [],
  onToggleComplete,
  onSubmitFeedback,
  onSelectField,
  onOpenFeedbackModal,
  onDeleteFeedback,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const [filterType, setFilterType] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter activities for this field
  const filtered = activities
    .filter((a) => a.field_id === activeField.id)
    .filter((a) => (filterType === 'all' ? true : a.type === filterType));

  // Helper to find feedback record for an activity
  const findFeedbackForActivity = (act: FieldActivity): FieldFeedbackRecord | undefined => {
    if (act.feedback_id) {
      const match = feedbacks.find((f) => f.id === act.feedback_id);
      if (match) return match;
    }
    return feedbacks.find((f) => f.recommendation_id === act.id);
  };

  // Outcome Badge renderer
  const getOutcomeBadge = (outcome?: FeedbackOutcome) => {
    switch (outcome) {
      case 'improved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <ThumbsUp className="w-3 h-3 text-emerald-700" />
            <span>{t('outcomeImproved')}</span>
          </span>
        );
      case 'no_change':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
            <MinusCircle className="w-3 h-3 text-blue-700" />
            <span>{t('outcomeNoChange')}</span>
          </span>
        );
      case 'got_worse':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
            <AlertTriangle className="w-3 h-3 text-rose-700" />
            <span>{t('outcomeGotWorse')}</span>
          </span>
        );
      case 'too_early':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
            <HelpCircle className="w-3 h-3 text-amber-700" />
            <span>{t('outcomeTooEarly')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Action status badge renderer
  const getActionStatusBadge = (status?: FeedbackStatus, completed?: boolean) => {
    if (status === 'done' || (!status && completed)) {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          <span>{t('statusDoneFull')}</span>
        </span>
      );
    }
    if (status === 'partly_done') {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>{t('statusPartlyDone')}</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
        <XCircle className="w-3 h-3 text-rose-700" />
        <span>{t('statusNotDoneFull')}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Header with Title and Record Outcome CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-agri-dark">
            {t('timelineTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-agri-dark/70 mt-1">
            {t('timelineSubtitle')}
          </p>
        </div>

        {onOpenFeedbackModal && (
          <button
            type="button"
            id="btn-log-feedback-header"
            onClick={() => onOpenFeedbackModal()}
            className="px-4 py-2.5 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-xs font-bold transition-all shadow-md btn-press flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('recordOutcomeBtn')}</span>
          </button>
        )}
      </div>

      <SafetyBanner language={language} />

      {/* Mandatory Agronomic Notice regarding farmer feedback */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 shadow-xs">
        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-amber-900">{t('agronomicNoticeTitle')}: </strong>
          <span>{t('agronomicDisclaimerBody')}</span>
        </div>
      </div>

      {/* Field selector & Filter tabs */}
      <div className="bg-white p-4 rounded-3xl border border-[#dde7df] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {t('activeField')}
          </label>
          <select
            id="timeline-field-select"
            value={activeField.id}
            onChange={(e) => onSelectField(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold bg-white focus:ring-2 focus:ring-agri-primary"
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.area} {f.area_unit})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: t('filterAll') },
            { id: 'scan', label: t('filterScans') },
            { id: 'irrigation', label: t('filterIrrigation') },
            { id: 'fertilizer', label: t('filterFertilizer') },
            { id: 'soil_test', label: t('filterSoilTests') },
            { id: 'expert_note', label: t('filterExpert') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-agri-primary text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#dde7df] shadow-sm space-y-3">
          <History className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-sm text-agri-dark">{t('noActivitiesMatchFilter')}</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {t('logActivityToPopulate')}
          </p>
          {onOpenFeedbackModal && (
            <button
              type="button"
              onClick={() => onOpenFeedbackModal()}
              className="mt-2 px-4 py-2 rounded-xl bg-agri-primary text-white text-xs font-bold inline-flex items-center gap-1.5 btn-press shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('recordOutcomeBtn')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#dde7df]">
          {filtered.map((act) => {
            const feedbackRecord = findFeedbackForActivity(act);
            const effectiveStatus = feedbackRecord?.status || act.feedback_status || (act.completed ? 'done' : 'not_done');
            const effectiveOutcome = feedbackRecord?.outcome || act.outcome;
            const effectiveOutcomeDate = feedbackRecord?.outcome_date || act.outcome_date;
            const effectiveOutcomeNote = feedbackRecord?.outcome_note || act.outcome_note;
            const effectiveFollowUpImage = feedbackRecord?.follow_up_image_url || act.follow_up_image_url;
            const effectiveCompletedDate = feedbackRecord?.completed_date || act.completed_date;
            const effectiveActualQty = feedbackRecord?.actual_quantity ?? act.actual_quantity;
            const effectiveActualUnit = feedbackRecord?.actual_unit || act.actual_unit || act.unit;
            const effectiveFarmerNote = feedbackRecord?.farmer_note || act.farmer_note || act.notes;

            return (
              <div
                key={act.id}
                id={`timeline-card-${act.id}`}
                className="relative bg-white rounded-3xl p-5 border border-[#dde7df] shadow-card hover:shadow-hover transition-all space-y-3.5"
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-5 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                    act.type === 'scan'
                      ? 'bg-emerald-600 text-white'
                      : act.type === 'irrigation'
                      ? 'bg-blue-600 text-white'
                      : act.type === 'fertilizer'
                      ? 'bg-purple-600 text-white'
                      : act.type === 'soil_test'
                      ? 'bg-amber-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {act.type === 'scan' && <Camera className="w-4 h-4" />}
                  {act.type === 'irrigation' && <Droplets className="w-4 h-4" />}
                  {act.type === 'fertilizer' && <FlaskConical className="w-4 h-4" />}
                  {act.type === 'soil_test' && <CheckCircle2 className="w-4 h-4" />}
                  {act.type === 'expert_note' && <ShieldCheck className="w-4 h-4" />}
                </div>

                {/* Card Top: Title, Date, Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {act.type === 'scan'
                          ? t('activityScan')
                          : act.type === 'irrigation'
                          ? t('activityIrrigation')
                          : act.type === 'fertilizer'
                          ? t('activityFertilizer')
                          : act.type === 'soil_test'
                          ? t('activitySoilTest')
                          : act.type === 'weather_event'
                          ? t('activityWeatherEvent')
                          : act.type === 'expert_note'
                          ? t('activityExpertNote')
                          : (act.type as string).replace('_', ' ')}
                      </span>

                      {/* Status Badge (Done / Partly done / Not done) */}
                      {getActionStatusBadge(effectiveStatus, act.completed)}

                      {/* Outcome Badge if recorded */}
                      {getOutcomeBadge(effectiveOutcome)}
                    </div>

                    <h3 className="font-black text-base text-agri-dark mt-1">
                      {act.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(act.activity_date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {/* Quick Toggle Done / Not Done Button */}
                    <button
                      type="button"
                      onClick={() => onToggleComplete(act.id, !act.completed)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center gap-1 btn-press ${
                        act.completed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{act.completed ? t('statusDone') : t('markCompleted')}</span>
                    </button>
                  </div>
                </div>

                {/* 1. ORIGINAL RECOMMENDATION CONTENT */}
                <div className="flex flex-col sm:flex-row items-start gap-3 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                  {act.image_url && (
                    <div className="relative group cursor-pointer flex-shrink-0" onClick={() => setPreviewImage(act.image_url || null)}>
                      <img
                        src={act.image_url}
                        alt="Activity attachment"
                        className="w-18 h-18 rounded-xl object-cover border border-gray-200 shadow-xs"
                      />
                      <span className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <FileText className="w-3 h-3" />
                      <span>{t('originalRecommendationLabel')}</span>
                      {act.quantity && act.unit && (
                        <span className="text-gray-700 bg-gray-200/70 px-2 py-0.2 rounded-full font-bold">
                          {act.quantity.toLocaleString()} {act.unit}
                        </span>
                      )}
                    </div>
                    <p className="text-agri-dark/80 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>

                {/* 2. FARMER REPORTED ACTION (DISTINCT SECTION) */}
                {(feedbackRecord || act.feedback_status || effectiveFarmerNote || effectiveActualQty) && (
                  <div className="bg-[#f9faf8] p-3.5 rounded-2xl border border-[#e1e9e2] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-agri-primary" />
                        <span className="font-bold text-[11px] text-agri-dark uppercase tracking-wider">
                          {t('farmerReportedActionLabel')}
                        </span>
                      </div>

                      {effectiveCompletedDate && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>
                            Completed: {new Date(effectiveCompletedDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-700">
                      <div>
                        <span className="font-semibold text-gray-500">Status: </span>
                        <strong className="text-agri-dark">
                          {effectiveStatus === 'done'
                            ? t('statusDoneFull')
                            : effectiveStatus === 'partly_done'
                            ? t('statusPartlyDone')
                            : t('statusNotDoneFull')}
                        </strong>
                      </div>

                      {effectiveActualQty !== undefined && effectiveActualQty !== null && (
                        <div>
                          <span className="font-semibold text-gray-500">Actual Amount: </span>
                          <strong className="text-agri-dark">
                            {effectiveActualQty.toLocaleString()} {effectiveActualUnit || ''}
                          </strong>
                        </div>
                      )}
                    </div>

                    {effectiveFarmerNote && (
                      <div className="bg-white/80 border-l-2 border-agri-primary p-2 rounded-r-xl text-[11px] text-agri-dark">
                        <span className="font-bold text-[10px] text-agri-primary uppercase tracking-wider block mb-0.5">
                          {t('farmerNotesLabel')}
                        </span>
                        <p className="italic text-gray-700 leading-relaxed">
                          "{effectiveFarmerNote}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. REPORTED CROP OUTCOME (DISTINCT SECTION) */}
                {effectiveOutcome ? (
                  <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-bold text-[11px] text-emerald-900 uppercase tracking-wider">
                          {t('cropOutcomeLabel')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getOutcomeBadge(effectiveOutcome)}
                        {effectiveOutcomeDate && (
                          <span className="text-[10px] text-emerald-800 font-medium">
                            {new Date(effectiveOutcomeDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {effectiveOutcomeNote && (
                      <p className="text-[11px] text-emerald-950 leading-relaxed italic bg-white/70 p-2 rounded-xl border border-emerald-100">
                        "{effectiveOutcomeNote}"
                      </p>
                    )}

                    {effectiveFollowUpImage && (
                      <div className="pt-1 flex items-center gap-2">
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => setPreviewImage(effectiveFollowUpImage)}
                        >
                          <img
                            src={effectiveFollowUpImage}
                            alt="Follow-up crop observation"
                            className="w-16 h-16 rounded-xl object-cover border border-emerald-300 shadow-xs"
                          />
                          <span className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800">
                          Follow-up photo attached
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Helpful Empty State when outcome is pending / missing */
                  <div className="bg-amber-50/40 border border-dashed border-amber-200 p-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-900">
                      <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-[11px] font-semibold">
                        {t('outcomeNotYetRecorded')} — Has your crop improved?
                      </span>
                    </div>

                    {onOpenFeedbackModal && (
                      <button
                        type="button"
                        id={`btn-record-outcome-${act.id}`}
                        onClick={() => onOpenFeedbackModal(act, feedbackRecord)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all shadow-xs btn-press self-start sm:self-auto flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{t('recordOutcomeBtn')}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Card Actions Footer: Record/Edit Outcome, Delete */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Delete feedback record action with confirmation */}
                    {(feedbackRecord || act.feedback_id) && onDeleteFeedback && (
                      <>
                        {deleteConfirmId !== act.id ? (
                          <button
                            type="button"
                            id={`btn-delete-feedback-${act.id}`}
                            onClick={() => setDeleteConfirmId(act.id)}
                            className="text-[11px] text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1"
                            title={t('deleteFeedbackBtn')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{t('deleteFeedbackBtn')}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl animate-fadeIn">
                            <span className="text-[10px] text-rose-800 font-bold px-1">Sure?</span>
                            <button
                              type="button"
                              onClick={() => {
                                const fbId = feedbackRecord?.id || act.feedback_id;
                                if (fbId) onDeleteFeedback(fbId);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold"
                            >
                              Yes, delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 rounded-lg bg-gray-200 text-gray-700 text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {onOpenFeedbackModal && (
                    <button
                      type="button"
                      id={`btn-open-feedback-modal-${act.id}`}
                      onClick={() => onOpenFeedbackModal(act, feedbackRecord)}
                      className="px-3.5 py-1.5 rounded-xl bg-agri-light text-agri-primary hover:bg-agri-primary hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 btn-press shadow-xs"
                    >
                      {effectiveOutcome ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{t('updateOutcomeBtn')}</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{t('recordOutcomeBtn')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged crop observation"
              className="w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
