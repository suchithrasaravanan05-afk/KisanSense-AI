'use client';

import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { WifiOff, Database, ArrowRight } from 'lucide-react';

interface OfflineBannerProps {
  language: Language;
  isOnline: boolean;
  queuedCount: number;
  onOpenSyncModal: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  language,
  isOnline,
  queuedCount,
  onOpenSyncModal,
}) => {
  if (isOnline) return null;

  const t = (key: string) => getTranslation(language, key);

  return (
    <div
      id="offline-status-banner"
      className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-emerald-500/10 border-b border-amber-300/40 px-4 py-2.5 sm:px-6 animate-fadeIn"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <WifiOff className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
              <span>{t('offlineBannerTitle')}</span>
              {queuedCount > 0 && (
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                  {queuedCount} {t('syncStatusPendingCount')}
                </span>
              )}
            </p>
            <p className="text-[11px] text-amber-900/80 hidden md:block">
              {t('offlineBannerDesc')}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSyncModal}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold border border-amber-300/60 shadow-2xs flex items-center gap-1.5 transition-all btn-press"
        >
          <Database className="w-3.5 h-3.5 text-amber-700" />
          <span>{t('syncStatusTitle')}</span>
          <ArrowRight className="w-3 h-3 text-amber-700" />
        </button>
      </div>
    </div>
  );
};
