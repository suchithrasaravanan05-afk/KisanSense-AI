'use client';

import React, { useState } from 'react';
import { Field, FieldActivity, Language, ActivityType } from '../../types';
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
} from 'lucide-react';

interface TimelineViewProps {
  language: Language;
  fields: Field[];
  activeField: Field;
  activities: FieldActivity[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSubmitFeedback: (id: string, feedback: 'helpful' | 'unsure' | 'harmful' | 'resolved') => void;
  onSelectField: (id: string) => void;
  onOpenFeedbackModal?: (activity?: FieldActivity) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  language,
  fields,
  activeField,
  activities,
  onToggleComplete,
  onSubmitFeedback,
  onSelectField,
  onOpenFeedbackModal,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = activities
    .filter((a) => a.field_id === activeField.id)
    .filter((a) => (filterType === 'all' ? true : a.type === filterType));

  const getFeedbackBadge = (feedback?: 'helpful' | 'unsure' | 'harmful' | 'resolved') => {
    switch (feedback) {
      case 'helpful':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ThumbsUp className="w-3 h-3 text-emerald-600" />
            <span>{t('feedbackHelpful')}</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>{t('feedbackResolved')}</span>
          </span>
        );
      case 'unsure':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            <span>{t('feedbackUnsure')}</span>
          </span>
        );
      case 'harmful':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <ThumbsDown className="w-3 h-3 text-rose-600" />
            <span>{t('feedbackHarmful')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Header with Title and Log Feedback CTA */}
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
            <span>{t('logNewFeedbackActivity')}</span>
          </button>
        )}
      </div>

      <SafetyBanner language={language} />

      {/* Mandatory Agronomic Disclaimer regarding farmer feedback */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 shadow-xs">
        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-900">Agronomic Disclaimer:</strong> {t('feedbackDisclaimerNotice')}
        </p>
      </div>

      {/* Field selector & Filter tabs */}
      <div className="bg-white p-4 rounded-3xl border border-[#dde7df] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-auto">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {t('activeField')}
          </label>
          <select
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
              <span>{t('logNewFeedbackActivity')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#dde7df]">
          {filtered.map((act) => {
            return (
              <div
                key={act.id}
                className="relative bg-white rounded-3xl p-5 border border-[#dde7df] shadow-card hover:shadow-hover transition-all space-y-3"
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

                {/* Card Top: Title, Date, Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {act.type === 'scan' ? t('activityScan') :
                         act.type === 'irrigation' ? t('activityIrrigation') :
                         act.type === 'fertilizer' ? t('activityFertilizer') :
                         act.type === 'soil_test' ? t('activitySoilTest') :
                         act.type === 'weather_event' ? t('activityWeatherEvent') :
                         act.type === 'expert_note' ? t('activityExpertNote') :
                         (act.type as string).replace('_', ' ')}
                      </span>

                      {/* Done / Not Done Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          act.completed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {act.completed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>{t('doneStatusBadge')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-amber-700" />
                            <span>{t('notDoneStatusBadge')}</span>
                          </>
                        )}
                      </span>

                      {/* Helpfulness feedback badge if submitted */}
                      {getFeedbackBadge(act.farmer_feedback)}
                    </div>

                    <h3 className="font-black text-base text-agri-dark mt-1">
                      {act.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(act.activity_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    {/* Toggle Done / Not Done Button */}
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

                {/* Card Body & Optional Image */}
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  {act.image_url && (
                    <img
                      src={act.image_url}
                      alt="Activity attachment"
                      className="w-20 h-20 rounded-2xl object-cover border border-gray-200 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-agri-dark/80 leading-relaxed">
                      {act.description}
                    </p>

                    {/* Optional Farmer Field Note Quote */}
                    {act.notes && (
                      <div className="bg-[#f8faf8] border-l-2 border-agri-primary/70 p-2.5 rounded-r-xl text-xs text-agri-dark">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-agri-primary block mb-0.5">
                          {t('farmerNotesLabel')}
                        </span>
                        <p className="italic text-gray-700">"{act.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Farmer Feedback Section & Edit Feedback Button */}
                <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-gray-500 mr-1">
                      {t('feedbackPrompt')}
                    </span>
                    {[
                      { id: 'helpful', label: t('feedbackHelpful') },
                      { id: 'resolved', label: t('feedbackResolved') },
                      { id: 'unsure', label: t('feedbackUnsure') },
                      { id: 'harmful', label: t('feedbackHarmful') },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => onSubmitFeedback(act.id, btn.id as any)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition-all ${
                          act.farmer_feedback === btn.id
                            ? 'bg-agri-primary text-white shadow-xs'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {onOpenFeedbackModal && (
                    <button
                      type="button"
                      onClick={() => onOpenFeedbackModal(act)}
                      className="text-[11px] font-bold text-agri-primary hover:text-agri-accent hover:underline flex items-center gap-1 self-end sm:self-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{act.farmer_feedback || act.notes ? t('editFeedbackBtn') : t('giveFeedbackBtn')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
