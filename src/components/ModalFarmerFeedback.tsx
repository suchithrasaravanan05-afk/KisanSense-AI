'use client';

import React, { useState, useEffect } from 'react';
import { Field, FieldActivity, Language, FeedbackStatus, FeedbackOutcome, FieldFeedbackRecord } from '../types';
import { getTranslation } from '../i18n/translations';
import { sampleImageOptions } from '../data/sampleImages';
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
  Trash2,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Droplets,
  FlaskConical,
  Sprout,
  MinusCircle,
} from 'lucide-react';

export interface FarmerFeedbackSubmission {
  id?: string;
  field_id: string;
  recommendation_id?: string;
  recommendation_title: string;
  recommendation_type: 'irrigation' | 'fertilizer' | 'scan' | 'soil_test' | 'general';
  status: FeedbackStatus;
  completed_date?: string;
  actual_quantity?: number;
  actual_unit?: string;
  farmer_note?: string;
  outcome?: FeedbackOutcome;
  outcome_date?: string;
  outcome_note?: string;
  follow_up_image_url?: string;
}

interface ModalFarmerFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: FieldActivity | null;
  activities?: FieldActivity[];
  activeField: Field;
  language: Language;
  recommendation?: {
    id?: string;
    title: string;
    type: 'irrigation' | 'fertilizer' | 'scan' | 'soil_test' | 'general';
    description?: string;
    suggestedQuantity?: number;
    suggestedUnit?: string;
    date?: string;
  } | null;
  existingFeedback?: FieldFeedbackRecord | null;
  onSaveFeedback: (submission: FarmerFeedbackSubmission) => Promise<boolean>;
  onDeleteFeedback?: (id: string) => Promise<boolean>;
}

export const ModalFarmerFeedback: React.FC<ModalFarmerFeedbackProps> = ({
  isOpen,
  onClose,
  activity,
  activities = [],
  activeField,
  language,
  recommendation,
  existingFeedback,
  onSaveFeedback,
  onDeleteFeedback,
}) => {
  const t = (key: string) => getTranslation(language, key);

  // Filter activities for this field
  const fieldActivities = activities.filter((a) => a.field_id === activeField.id);

  // Selected target activity or recommendation
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    recommendation?.id || activity?.id || ''
  );

  // Form states
  const [status, setStatus] = useState<FeedbackStatus>('done');
  const [completedDate, setCompletedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [actualQuantity, setActualQuantity] = useState<string>('');
  const [actualUnit, setActualUnit] = useState<string>('');
  const [farmerNote, setFarmerNote] = useState<string>('');

  // Outcome states
  const [outcome, setOutcome] = useState<FeedbackOutcome | undefined>(undefined);
  const [outcomeDate, setOutcomeDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [outcomeNote, setOutcomeNote] = useState<string>('');
  const [followUpImageUrl, setFollowUpImageUrl] = useState<string>('');
  const [showSamplePicker, setShowSamplePicker] = useState<boolean>(false);

  // UI status states
  const [submissionState, setSubmissionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Track active target
  const currentTargetActivity = activity || fieldActivities.find((a) => a.id === selectedActivityId);

  // Effective recommendation info
  const effectiveRecTitle =
    recommendation?.title ||
    currentTargetActivity?.title ||
    existingFeedback?.recommendation_title ||
    t('originalRecommendationLabel');

  const effectiveRecType: 'irrigation' | 'fertilizer' | 'scan' | 'soil_test' | 'general' =
    recommendation?.type ||
    (currentTargetActivity?.type === 'weather_event' || currentTargetActivity?.type === 'expert_note'
      ? 'general'
      : (currentTargetActivity?.type as any)) ||
    existingFeedback?.recommendation_type ||
    'general';

  const effectiveRecDesc =
    recommendation?.description ||
    currentTargetActivity?.description ||
    '';

  const defaultUnit =
    effectiveRecType === 'irrigation'
      ? 'Litres'
      : effectiveRecType === 'fertilizer'
      ? 'kg'
      : '';

  // Synchronize initial state when modal opens or props change
  useEffect(() => {
    if (!isOpen) return;

    // 1. If explicit existing feedback record is provided
    if (existingFeedback) {
      setStatus(existingFeedback.status);
      setCompletedDate(
        existingFeedback.completed_date
          ? existingFeedback.completed_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setActualQuantity(
        existingFeedback.actual_quantity !== undefined && existingFeedback.actual_quantity !== null
          ? String(existingFeedback.actual_quantity)
          : ''
      );
      setActualUnit(existingFeedback.actual_unit || defaultUnit);
      setFarmerNote(existingFeedback.farmer_note || '');
      setOutcome(existingFeedback.outcome);
      setOutcomeDate(
        existingFeedback.outcome_date
          ? existingFeedback.outcome_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setOutcomeNote(existingFeedback.outcome_note || '');
      setFollowUpImageUrl(existingFeedback.follow_up_image_url || '');
      setSelectedActivityId(existingFeedback.recommendation_id || '');
    }
    // 2. Or if activity has linked feedback data
    else if (activity) {
      setSelectedActivityId(activity.id);
      setStatus(activity.feedback_status || (activity.completed ? 'done' : 'not_done'));
      setCompletedDate(
        activity.completed_date
          ? activity.completed_date.split('T')[0]
          : activity.activity_date
          ? activity.activity_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setActualQuantity(
        activity.actual_quantity !== undefined && activity.actual_quantity !== null
          ? String(activity.actual_quantity)
          : activity.quantity !== undefined && activity.quantity !== null
          ? String(activity.quantity)
          : ''
      );
      setActualUnit(activity.actual_unit || activity.unit || defaultUnit);
      setFarmerNote(activity.farmer_note || activity.notes || '');
      setOutcome(activity.outcome);
      setOutcomeDate(
        activity.outcome_date
          ? activity.outcome_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setOutcomeNote(activity.outcome_note || '');
      setFollowUpImageUrl(activity.follow_up_image_url || '');
    }
    // 3. Or if custom recommendation passed (e.g., from Dashboard)
    else if (recommendation) {
      setSelectedActivityId(recommendation.id || '');
      setStatus('done');
      setCompletedDate(
        recommendation.date
          ? recommendation.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setActualQuantity(
        recommendation.suggestedQuantity !== undefined
          ? String(recommendation.suggestedQuantity)
          : ''
      );
      setActualUnit(recommendation.suggestedUnit || defaultUnit);
      setFarmerNote('');
      setOutcome(undefined);
      setOutcomeDate(new Date().toISOString().split('T')[0]);
      setOutcomeNote('');
      setFollowUpImageUrl('');
    }
    // 4. Default fallback to first field activity
    else if (fieldActivities.length > 0) {
      const first = fieldActivities[0];
      setSelectedActivityId(first.id);
      setStatus(first.feedback_status || (first.completed ? 'done' : 'not_done'));
      setCompletedDate(
        first.completed_date
          ? first.completed_date.split('T')[0]
          : first.activity_date
          ? first.activity_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setActualQuantity(first.actual_quantity ? String(first.actual_quantity) : '');
      setActualUnit(first.actual_unit || first.unit || defaultUnit);
      setFarmerNote(first.farmer_note || first.notes || '');
      setOutcome(first.outcome);
      setOutcomeDate(
        first.outcome_date
          ? first.outcome_date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setOutcomeNote(first.outcome_note || '');
      setFollowUpImageUrl(first.follow_up_image_url || '');
    } else {
      setSelectedActivityId('');
      setStatus('done');
      setCompletedDate(new Date().toISOString().split('T')[0]);
      setActualQuantity('');
      setActualUnit(defaultUnit);
      setFarmerNote('');
      setOutcome(undefined);
      setOutcomeDate(new Date().toISOString().split('T')[0]);
      setOutcomeNote('');
      setFollowUpImageUrl('');
    }

    setSubmissionState('idle');
    setErrorMessage('');
    setShowDeleteConfirm(false);
    setShowSamplePicker(false);
  }, [isOpen, activity, recommendation, existingFeedback, activeField.id]);

  if (!isOpen) return null;

  // Handle image upload from file input
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFollowUpImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Form submission handler with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: Status is required
    if (!status) {
      setSubmissionState('error');
      setErrorMessage(t('validationSelectStatus'));
      return;
    }

    // 2. Validation: Completed Date when Done or Partly Done
    if ((status === 'done' || status === 'partly_done') && (!completedDate || isNaN(new Date(completedDate).getTime()))) {
      setSubmissionState('error');
      setErrorMessage(t('validationInvalidDate'));
      return;
    }

    // 3. Validation: Actual quantity must not be negative
    let parsedQty: number | undefined = undefined;
    if (actualQuantity.trim()) {
      const num = parseFloat(actualQuantity);
      if (isNaN(num) || num < 0) {
        setSubmissionState('error');
        setErrorMessage(t('validationInvalidQuantity'));
        return;
      }
      parsedQty = num;
    }

    // 4. Validation: Outcome date if outcome is selected
    let parsedOutcomeDate: string | undefined = undefined;
    if (outcome) {
      if (!outcomeDate || isNaN(new Date(outcomeDate).getTime())) {
        setSubmissionState('error');
        setErrorMessage(t('validationInvalidDate'));
        return;
      }
      parsedOutcomeDate = new Date(outcomeDate).toISOString();
    }

    setSubmissionState('loading');
    setErrorMessage('');

    try {
      const success = await onSaveFeedback({
        id: existingFeedback?.id || currentTargetActivity?.feedback_id,
        field_id: activeField.id,
        recommendation_id: selectedActivityId || currentTargetActivity?.id || recommendation?.id,
        recommendation_title: effectiveRecTitle,
        recommendation_type: effectiveRecType,
        status,
        completed_date:
          status !== 'not_done' && completedDate
            ? new Date(completedDate).toISOString()
            : undefined,
        actual_quantity: parsedQty,
        actual_unit: actualUnit.trim() || undefined,
        farmer_note: farmerNote.trim() || undefined,
        outcome: outcome || undefined,
        outcome_date: parsedOutcomeDate,
        outcome_note: outcomeNote.trim() || undefined,
        follow_up_image_url: followUpImageUrl || undefined,
      });

      if (success) {
        setSubmissionState('success');
        setTimeout(() => {
          onClose();
          setSubmissionState('idle');
        }, 1100);
      } else {
        setSubmissionState('error');
        setErrorMessage(t('feedbackSaveError'));
      }
    } catch (err: any) {
      setSubmissionState('error');
      setErrorMessage(err?.message || t('feedbackSaveError'));
    }
  };

  // Delete feedback record handler
  const handleDelete = async () => {
    const feedbackId = existingFeedback?.id || currentTargetActivity?.feedback_id;
    if (!feedbackId || !onDeleteFeedback) return;

    setIsDeleting(true);
    try {
      const success = await onDeleteFeedback(feedbackId);
      if (success) {
        onClose();
      } else {
        setErrorMessage(t('feedbackSaveError'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('feedbackSaveError'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const hasExistingFeedback = Boolean(existingFeedback?.id || currentTargetActivity?.feedback_id);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full relative shadow-2xl border border-gray-100 my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-agri-primary bg-agri-light px-2.5 py-0.5 rounded-full inline-block">
                {activeField.name} ({activeField.area} {activeField.area_unit})
              </span>
              {hasExistingFeedback && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full inline-block">
                  {t('editFeedbackAction')}
                </span>
              )}
            </div>
            <h2 id="feedback-modal-title" className="text-lg sm:text-xl font-black text-agri-dark">
              {t('trackerTitle')}
            </h2>
            <p className="text-xs text-agri-dark/70 mt-0.5">
              {t('trackerSubtitle')}
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

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 py-3 flex-1 space-y-4">
          {/* Target Activity Selector (if multiple activities exist and none was specifically pre-selected) */}
          {!activity && !recommendation && fieldActivities.length > 1 && (
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
                    setStatus(selected.feedback_status || (selected.completed ? 'done' : 'not_done'));
                    setFarmerNote(selected.farmer_note || selected.notes || '');
                    setActualQuantity(selected.actual_quantity ? String(selected.actual_quantity) : '');
                    setOutcome(selected.outcome);
                    setOutcomeNote(selected.outcome_note || '');
                    setFollowUpImageUrl(selected.follow_up_image_url || '');
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

          {/* Target Recommendation Context Card */}
          <div className="bg-[#f8faf8] border border-gray-200/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
            <div className="w-9 h-9 rounded-xl bg-agri-light text-agri-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold shadow-xs">
              {effectiveRecType === 'irrigation' && <Droplets className="w-5 h-5 text-blue-600" />}
              {effectiveRecType === 'fertilizer' && <FlaskConical className="w-5 h-5 text-purple-600" />}
              {effectiveRecType === 'scan' && <Camera className="w-5 h-5 text-emerald-600" />}
              {effectiveRecType === 'general' && <FileText className="w-5 h-5 text-agri-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {t('originalRecommendationLabel')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-gray-200/60 text-gray-700">
                  {effectiveRecType}
                </span>
              </div>
              <p className="font-black text-agri-dark mt-0.5 truncate">
                {effectiveRecTitle}
              </p>
              {effectiveRecDesc && (
                <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                  {effectiveRecDesc}
                </p>
              )}
            </div>
          </div>

          <form id="farmer-feedback-form" onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: Recommendation Action Status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-agri-dark flex items-center gap-1">
                  <span>1. {t('statusLabel')}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-gray-500 font-medium">
                  {t('statusHelper')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Done */}
                <button
                  type="button"
                  id="btn-status-done"
                  onClick={() => setStatus('done')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
                    status === 'done'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{t('statusDoneFull')}</span>
                </button>

                {/* Partly Done */}
                <button
                  type="button"
                  id="btn-status-partly-done"
                  onClick={() => setStatus('partly_done')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
                    status === 'partly_done'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{t('statusPartlyDone')}</span>
                </button>

                {/* Not Done */}
                <button
                  type="button"
                  id="btn-status-not-done"
                  onClick={() => setStatus('not_done')}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
                    status === 'not_done'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{t('statusNotDoneFull')}</span>
                </button>
              </div>
            </div>

            {/* Inputs shown if Done or Partly Done */}
            {(status === 'done' || status === 'partly_done') && (
              <div className="bg-[#fafbf9] border border-gray-200/70 p-3.5 rounded-2xl space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Date Completed */}
                  <div>
                    <label
                      htmlFor="input-completed-date"
                      className="block text-xs font-bold text-agri-dark mb-1"
                    >
                      {t('dateCompletedLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-completed-date"
                      type="date"
                      value={completedDate}
                      onChange={(e) => setCompletedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-agri-dark focus:ring-2 focus:ring-agri-primary bg-white"
                      required
                    />
                  </div>

                  {/* Actual Amount Used & Unit */}
                  <div>
                    <label
                      htmlFor="input-actual-quantity"
                      className="block text-xs font-bold text-agri-dark mb-1"
                    >
                      {t('actualQuantityLabel')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="input-actual-quantity"
                        type="number"
                        min="0"
                        step="any"
                        placeholder={t('actualQuantityPlaceholder')}
                        value={actualQuantity}
                        onChange={(e) => setActualQuantity(e.target.value)}
                        className="w-1/2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-agri-dark focus:ring-2 focus:ring-agri-primary bg-white"
                      />
                      <input
                        id="input-actual-unit"
                        type="text"
                        placeholder={t('actualUnitPlaceholder')}
                        value={actualUnit}
                        onChange={(e) => setActualUnit(e.target.value)}
                        className="w-1/2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-agri-dark focus:ring-2 focus:ring-agri-primary bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Unit Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Quick Unit:
                  </span>
                  {['Litres', 'kg', 'bags', 'hours', 'sprays'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setActualUnit(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all ${
                        actualUnit.toLowerCase() === preset.toLowerCase()
                          ? 'bg-agri-primary text-white border-agri-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Farmer Note (Always optional) */}
            <div>
              <label
                htmlFor="input-farmer-note"
                className="block text-xs font-bold text-agri-dark mb-1"
              >
                {t('farmerNoteLabel')}
              </label>
              <textarea
                id="input-farmer-note"
                rows={2}
                value={farmerNote}
                onChange={(e) => setFarmerNote(e.target.value)}
                placeholder={t('farmerNotePlaceholder')}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-agri-primary resize-none bg-white leading-relaxed"
              />
            </div>

            {/* STEP 2: Crop Outcome Observation (Can be recorded immediately or later) */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-xs font-bold text-agri-dark flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>2. {t('outcomeSectionTitle')}</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {t('outcomeSectionSubtitle')}
                  </p>
                </div>

                {outcome && (
                  <button
                    type="button"
                    onClick={() => setOutcome(undefined)}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-600 underline"
                  >
                    Clear outcome
                  </button>
                )}
              </div>

              {/* 4 Outcome Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'improved',
                    label: t('outcomeImproved'),
                    icon: ThumbsUp,
                    activeClass: 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-md',
                    hoverClass: 'hover:border-emerald-500',
                  },
                  {
                    id: 'no_change',
                    label: t('outcomeNoChange'),
                    icon: MinusCircle,
                    activeClass: 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 shadow-md',
                    hoverClass: 'hover:border-blue-500',
                  },
                  {
                    id: 'got_worse',
                    label: t('outcomeGotWorse'),
                    icon: AlertTriangle,
                    activeClass: 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300 shadow-md',
                    hoverClass: 'hover:border-rose-500',
                  },
                  {
                    id: 'too_early',
                    label: t('outcomeTooEarly'),
                    icon: HelpCircle,
                    activeClass: 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300 shadow-md',
                    hoverClass: 'hover:border-amber-500',
                  },
                ].map((item) => {
                  const isSelected = outcome === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`btn-outcome-${item.id}`}
                      onClick={() => setOutcome(item.id as FeedbackOutcome)}
                      className={`py-2.5 px-2 rounded-2xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 text-center ${
                        isSelected
                          ? item.activeClass
                          : `bg-gray-50 text-gray-700 border-gray-200 ${item.hoverClass}`
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* If no outcome selected yet, show empty state guidance */}
              {!outcome && (
                <div className="mt-2.5 p-3 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center">
                  <p className="text-xs font-semibold text-gray-600">
                    {t('outcomeNotYetRecorded')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {t('outcomeNotYetDesc')}
                  </p>
                </div>
              )}

              {/* If outcome selected, show Date, Note, and Image upload */}
              {outcome && (
                <div className="mt-3 bg-[#f8faf8] border border-gray-200/80 p-3.5 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Outcome Date */}
                    <div>
                      <label
                        htmlFor="input-outcome-date"
                        className="block text-xs font-bold text-agri-dark mb-1"
                      >
                        {t('outcomeDateLabel')}
                      </label>
                      <input
                        id="input-outcome-date"
                        type="date"
                        value={outcomeDate}
                        onChange={(e) => setOutcomeDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-agri-dark focus:ring-2 focus:ring-agri-primary bg-white"
                      />
                    </div>

                    {/* Outcome Note */}
                    <div>
                      <label
                        htmlFor="input-outcome-note"
                        className="block text-xs font-bold text-agri-dark mb-1"
                      >
                        {t('outcomeNoteLabel')}
                      </label>
                      <textarea
                        id="input-outcome-note"
                        rows={2}
                        value={outcomeNote}
                        onChange={(e) => setOutcomeNote(e.target.value)}
                        placeholder={t('outcomeNotePlaceholder')}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-agri-primary resize-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Follow-up Crop Image */}
                  <div>
                    <label className="block text-xs font-bold text-agri-dark mb-1">
                      {t('followUpPhotoLabel')}
                    </label>

                    {followUpImageUrl ? (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-gray-200">
                        <img
                          src={followUpImageUrl}
                          alt="Follow-up preview"
                          className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-xs flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-agri-dark">
                            Follow-up Photo Attached
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Saved locally for this field record.
                          </p>
                        </div>
                        <button
                          type="button"
                          id="btn-remove-photo"
                          onClick={() => setFollowUpImageUrl('')}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                        >
                          {t('removePhotoBtn')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* File input button */}
                          <label
                            htmlFor="input-followup-file"
                            className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-agri-dark hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-agri-primary" />
                            <span>{t('uploadPhotoBtn')}</span>
                            <input
                              id="input-followup-file"
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>

                          {/* Pick sample photo button */}
                          <button
                            type="button"
                            id="btn-pick-sample-photo"
                            onClick={() => setShowSamplePicker(!showSamplePicker)}
                            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1.5 border border-emerald-200"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{t('chooseSamplePhotoBtn')}</span>
                          </button>
                        </div>

                        {/* Sample photo choices carousel/grid */}
                        {showSamplePicker && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2.5 bg-white rounded-2xl border border-emerald-200 animate-fadeIn">
                            {sampleImageOptions.slice(0, 4).map((sample, idx) => (
                              <button
                                key={sample.id}
                                type="button"
                                onClick={() => {
                                  setFollowUpImageUrl(sample.dataUrl);
                                  setShowSamplePicker(false);
                                }}
                                className="group relative rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-600 transition-all text-left"
                              >
                                <img
                                  src={sample.dataUrl}
                                  alt={sample.title}
                                  className="w-full h-14 object-cover"
                                />
                                <span className="block text-[9px] font-bold p-1 bg-white truncate text-gray-700">
                                  {sample.cropName} #{idx + 1}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MANDATORY AGRONOMIC DISCLAIMER: Do NOT claim feedback proves recommendation scientifically correct */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="text-amber-900">{t('agronomicNoticeTitle')}: </strong>
                <span>{t('agronomicDisclaimerBody')}</span>
              </div>
            </div>

            {/* ERROR BANNER */}
            {submissionState === 'error' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage || t('feedbackSaveError')}</span>
              </div>
            )}

            {/* SUCCESS BANNER */}
            {submissionState === 'success' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-center gap-2 font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{t('feedbackSaveSuccess')}</span>
              </div>
            )}
          </form>
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2.5 flex-shrink-0">
          <div>
            {hasExistingFeedback && onDeleteFeedback && (
              <>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    id="btn-delete-feedback"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5 btn-press"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('deleteFeedbackBtn')}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold btn-press shadow-xs disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              form="farmer-feedback-form"
              id="btn-save-feedback"
              disabled={submissionState === 'loading' || submissionState === 'success'}
              className="px-5 py-2.5 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-xs font-bold transition-all shadow-md btn-press flex items-center gap-2 disabled:opacity-60"
            >
              {submissionState === 'loading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('savingTracker')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('saveTrackerBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
