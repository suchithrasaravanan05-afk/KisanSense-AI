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
} from 'lucide-react';

interface TimelineViewProps {
  language: Language;
  fields: Field[];
  activeField: Field;
  activities: FieldActivity[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSubmitFeedback: (id: string, feedback: 'helpful' | 'unsure' | 'harmful' | 'resolved') => void;
  onSelectField: (id: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  language,
  fields,
  activeField,
  activities,
  onToggleComplete,
  onSubmitFeedback,
  onSelectField,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = activities
    .filter((a) => a.field_id === activeField.id)
    .filter((a) => (filterType === 'all' ? true : a.type === filterType));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-agri-dark">
          {t('timelineTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-agri-dark/70 mt-1">
          {t('timelineSubtitle')}
        </p>
      </div>

      <SafetyBanner language={language} />

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
        <div className="bg-white rounded-3xl p-10 text-center border border-[#dde7df] shadow-sm space-y-2">
          <History className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-sm text-agri-dark">{t('noActivitiesMatchFilter')}</h3>
          <p className="text-xs text-gray-500">
            {t('logActivityToPopulate')}
          </p>
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

                {/* Card Top: Title, Date, Completion Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {act.type === 'scan' ? t('activityScan') :
                       act.type === 'irrigation' ? t('activityIrrigation') :
                       act.type === 'fertilizer' ? t('activityFertilizer') :
                       act.type === 'soil_test' ? t('activitySoilTest') :
                       act.type === 'weather_event' ? t('activityWeatherEvent') :
                       act.type === 'expert_note' ? t('activityExpertNote') :
                       (act.type as string).replace('_', ' ')}
                    </span>
                    <h3 className="font-black text-base text-agri-dark mt-0.5">
                      {act.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(act.activity_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <button
                      onClick={() => onToggleComplete(act.id, !act.completed)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                        act.completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{act.completed ? t('completedBadge') : t('markCompleted')}</span>
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
                  <p className="text-xs text-agri-dark/80 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                {/* Farmer Feedback Section */}
                <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-gray-500">
                    {t('feedbackPrompt')}
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'helpful', label: t('feedbackHelpful') },
                      { id: 'resolved', label: t('feedbackResolved') },
                      { id: 'unsure', label: t('feedbackUnsure') },
                      { id: 'harmful', label: t('feedbackHarmful') },
                    ].map((btn) => (
                      <button
                        key={btn.id}
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
