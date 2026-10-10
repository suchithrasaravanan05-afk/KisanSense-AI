'use client';

import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface SafetyBannerProps {
  language: Language;
  variant?: 'warning' | 'info' | 'critical';
  customMessage?: string;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({
  language,
  variant = 'warning',
  customMessage,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const message = customMessage || t('safetyNotice');

  if (variant === 'info') {
    return (
      <div className="bg-blue-50/90 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-blue-900 leading-relaxed font-medium">
          {message}
        </p>
      </div>
    );
  }

  if (variant === 'critical') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-red-900 leading-relaxed font-semibold">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-sm">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
        <span className="font-semibold text-amber-950 block sm:inline mr-1">
          {t('safetyAdvisoryPrefix')}
        </span>
        {message}
      </div>
    </div>
  );
};
