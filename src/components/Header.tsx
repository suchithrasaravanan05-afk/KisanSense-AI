'use client';

import React from 'react';
import { Field, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { Sprout, Globe, Wifi, WifiOff, MapPin, ChevronDown } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  fields: Field[];
  activeFieldId: string;
  onSelectField: (id: string) => void;
  onOpenAddField: () => void;
  isOnline: boolean;
  queuedCount?: number;
  onOpenSyncModal?: () => void;
  onNavigateLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  fields,
  activeFieldId,
  onSelectField,
  onOpenAddField,
  isOnline,
  queuedCount = 0,
  onOpenSyncModal,
  onNavigateLanding,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const activeField = fields.find((f) => f.id === activeFieldId) || fields[0];

  const toggleLanguage = () => {
    onLanguageChange(language === 'en' ? 'ta' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#dde7df] px-4 py-3 sm:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <button
          onClick={onNavigateLanding}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          title="Return to KisanSense Home"
        >
          <div className="w-10 h-10 rounded-xl bg-agri-primary flex items-center justify-center text-white shadow-md shadow-agri-primary/20 group-hover:bg-agri-accent transition-colors">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg sm:text-xl text-agri-dark tracking-tight">
                {t('appName')}
              </span>
              <span className="text-[10px] font-semibold bg-agri-light text-agri-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                {t('aiBetaBadge')}
              </span>
            </div>
            <p className="text-[11px] text-agri-dark/70 hidden sm:block -mt-0.5">
              {t('tagline')}
            </p>
          </div>
        </button>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Field Dropdown */}
          {fields.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-2.5 py-1.5 sm:px-3">
                <MapPin className="w-4 h-4 text-agri-primary flex-shrink-0" />
                <select
                  id="header-active-field-select"
                  aria-label={t('activeField')}
                  value={activeFieldId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      onOpenAddField();
                    } else {
                      onSelectField(e.target.value);
                    }
                  }}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-agri-dark focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[200px] truncate"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.area} {f.area_unit})
                    </option>
                  ))}
                  <option value="__add_new__">+ {t('addField')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Language Switcher Dropdown */}
          <div className="relative flex items-center bg-gray-50 hover:bg-agri-light border border-gray-200 hover:border-agri-primary/40 rounded-xl px-2.5 py-1.5 transition-all shadow-xs">
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-agri-primary mr-1 flex-shrink-0" />
            <select
              id="header-language-select"
              aria-label="Select Application Language"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-agri-dark focus:outline-none cursor-pointer pr-1"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>

          {/* Connectivity Status Pill with Queue indicator */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all btn-press border ${
              isOnline
                ? queuedCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title="Click to view offline sync status and queue"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {language === 'ta' ? 'ஆன்லைன்' : 'Online'}
                </span>
                {queuedCount > 0 && (
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                    {queuedCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse flex-shrink-0" />
                <span>
                  {language === 'ta' ? 'ஆஃப்லைன்' : 'Offline'}
                  {queuedCount > 0 && ` (${queuedCount})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
