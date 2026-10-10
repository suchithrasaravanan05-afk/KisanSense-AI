'use client';

import React, { useState, useEffect } from 'react';
import { Field, FieldActivity, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  Loader2,
  ThumbsUp,
  HelpCircle,
  ThumbsDown,
  Check,
  FileText,
  ShieldAlert,
} from 'lucide-react';

export type FeedbackOutcome = 'helpful' | 'resolved' | 'unsure' | 'harmful';

export interface FarmerFeedbackSubmission {
  completed: boolean;
  feedback?: FeedbackOutcome;
  notes?: string;
  activity_date: string;
  activity_id?: string;
  new_activity_title?: string;
}

interface ModalFarmerFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: FieldActivity | null;
  activities?: FieldActivity[];
  activeField: Field;
  language: Language;
  onSaveFeedback: (submission: FarmerFeedbackSubmission) => Promise<boolean>;
}

export const ModalFarmerFeedback: React.FC<ModalFarmerFeedbackProps> = ({
  isOpen,
  onClose,
  activity,
  activities = [],
  activeField,
  language,
  onSaveFeedback,
}) => {
  const t = (key: string) => getTranslation(language, key);

  // Target activity selection (if not opened for a specific activity)
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activity?.id || '');

  // Form states
  const [completed, setCompleted] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<FeedbackOutcome | undefined>('helpful');
  const [notes, setNotes] = useState<string>('');
  const [activityDate, setActivityDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Status states: idle | loading | success | error
  const [submissionState, setSubmissionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Field activities filtered for active field
  const fieldActivities = activities.filter((a) => a.field_id === activeField.id);
  const currentTargetActivity = activity || fieldActivities.find((a) => a.id === selectedActivityId);

  // Sync state whenever activity or open state changes
  useEffect(() => {
    if (activity) {
      setSelectedActivityId(activity.id);
      setCompleted(activity.completed !== undefined ? activity.completed : true);
      setFeedback(activity.farmer_feedback || 'helpful');
      setNotes(activity.notes || '');
      setActivityDate(
        activity.activity_date
          ? activity.activity_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    } else if (fieldActivities.length > 0) {
      const first = fieldActivities[0];
      setSelectedActivityId(first.id);
      setCompleted(first.completed !== undefined ? first.completed : true);
      setFeedback(first.farmer_feedback || 'helpful');
      setNotes(first.notes || '');
      setActivityDate(
        first.activity_date
          ? first.activity_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    } else {
      setSelectedActivityId('');
      setCompleted(true);
      setFeedback('helpful');
      setNotes('');
      setActivityDate(new Date().toISOString().split('T')[0]);
    }
    setSubmissionState('idle');
    setErrorMessage('');
  }, [activity, isOpen, activeField.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Date must be valid
    if (!activityDate || isNaN(new Date(activityDate).getTime())) {
      setSubmissionState('error');
      setErrorMessage(t('feedbackSaveError'));
      return;
    }

    setSubmissionState('loading');
    setErrorMessage('');

    try {
      const success = await onSaveFeedback({
        completed,
        feedback,
        notes: notes.trim(),
        activity_date: new Date(activityDate).toISOString(),
        activity_id: currentTargetActivity?.id,
        new_activity_title: currentTargetActivity ? undefined : 'Farmer Recommendation Outcome',
      });

      if (success) {
        setSubmissionState('success');
        setTimeout(() => {
          onClose();
          setSubmissionState('idle');
        }, 1200);
      } else {
        setSubmissionState('error');
        setErrorMessage(t('feedbackSaveError'));
      }
    } catch (err: any) {
      setSubmissionState('error');
      setErrorMessage(err?.message || t('feedbackSaveError'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full relative shadow-2xl border border-gray-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-agri-primary bg-agri-light px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              {activeField.name} ({activeField.area} {activeField.area_unit})
            </span>
            <h2 id="feedback-modal-title" className="text-lg sm:text-xl font-black text-agri-dark">
              {t('feedbackModalTitle')}
            </h2>
            <p className="text-xs text-agri-dark/70 mt-0.5">
              {t('feedbackModalSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EMPTY STATE: When no recommendations or activities exist for this field */}
        {!currentTargetActivity && fieldActivities.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-agri-dark">
              {t('feedbackModalEmptyPrompt')}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-agri-primary text-white text-xs font-bold btn-press shadow-xs"
              >
                {t('openDashboard')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Target Activity Selector (if multiple activities exist and none was pre-selected) */}
            {!activity && fieldActivities.length > 1 && (
              <div>
                <label
                  htmlFor="feedback-activity-select"
                  className="block text-xs font-bold text-agri-dark mb-1"
                >
                  {t('selectActivityOrRec')}
                </label>
                <select
                  id="feedback-activity-select"
                  value={selectedActivityId}
                  onChange={(e) => {
                    setSelectedActivityId(e.target.value);
                    const selected = fieldActivities.find((a) => a.id === e.target.value);
                    if (selected) {
                      setCompleted(selected.completed !== undefined ? selected.completed : true);
                      setFeedback(selected.farmer_feedback || 'helpful');
                      setNotes(selected.notes || '');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-agri-primary"
                >
                  {fieldActivities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.title} ({new Date(act.activity_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Activity Summary Card */}
            {currentTargetActivity && (
              <div className="bg-[#f8faf8] border border-gray-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-agri-light text-agri-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-agri-dark truncate">
                    {currentTargetActivity.title}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                    {currentTargetActivity.description}
                  </p>
                </div>
              </div>
            )}

            {/* 1. Status: Done vs Not done */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1.5">
                {t('recommendationStatusLabel')} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-status-done"
                  onClick={() => setCompleted(true)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    completed
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('statusDone')}</span>
                </button>

                <button
                  type="button"
                  id="btn-status-not-done"
                  onClick={() => setCompleted(false)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    !completed
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>{t('statusNotDone')}</span>
                </button>
              </div>
            </div>

            {/* 2. Did the recommendation help? */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1.5">
                {t('didItHelpLabel')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'helpful', label: t('feedbackHelpfulOption'), icon: ThumbsUp, color: 'hover:border-emerald-500' },
                  { id: 'resolved', label: t('feedbackResolvedOption'), icon: Check, color: 'hover:border-emerald-500' },
                  { id: 'unsure', label: t('feedbackUnsureOption'), icon: HelpCircle, color: 'hover:border-amber-500' },
                  { id: 'harmful', label: t('feedbackHarmfulOption'), icon: ThumbsDown, color: 'hover:border-rose-500' },
                ].map((item) => {
                  const isSelected = feedback === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`btn-feedback-${item.id}`}
                      onClick={() => setFeedback(item.id as FeedbackOutcome)}
                      className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                        isSelected
                          ? 'bg-agri-primary text-white border-agri-primary shadow-xs'
                          : `bg-gray-50 text-gray-700 border-gray-200 ${item.color}`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Activity Date & Optional Farmer Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-feedback-date"
                  className="block text-xs font-bold text-agri-dark mb-1"
                >
                  {t('activityDateLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-feedback-date"
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-agri-dark focus:ring-2 focus:ring-agri-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-farmer-notes"
                  className="block text-xs font-bold text-agri-dark mb-1"
                >
                  {t('optionalNotesLabel')}
                </label>
                <textarea
                  id="input-farmer-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-agri-primary resize-none"
                />
              </div>
            </div>

            {/* MANDATORY AGRONOMIC DISCLAIMER: Do NOT display feedback as proof */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="leading-tight">
                <strong>Agronomic Notice:</strong> {t('feedbackDisclaimerNotice')}
              </p>
            </div>

            {/* ERROR STATE BANNER */}
            {submissionState === 'error' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage || t('feedbackSaveError')}</span>
              </div>
            )}

            {/* SUCCESS STATE BANNER */}
            {submissionState === 'success' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-center gap-2 font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{t('feedbackSaveSuccess')}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submissionState === 'loading'}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors btn-press"
              >
                {t('cancelBtn')}
              </button>

              <button
                type="submit"
                id="btn-save-feedback"
                disabled={submissionState === 'loading' || submissionState === 'success'}
                className="px-5 py-2.5 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-xs font-bold transition-all shadow-md btn-press flex items-center gap-2 disabled:opacity-60"
              >
                {submissionState === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('savingFeedback')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('saveFeedbackBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
