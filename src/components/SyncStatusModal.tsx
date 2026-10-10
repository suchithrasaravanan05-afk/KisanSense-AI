'use client';

import React from 'react';
import { Language, QueuedSyncItem } from '../types';
import { getTranslation } from '../i18n/translations';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  Database,
  CloudOff,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  isOnline: boolean;
  queue: QueuedSyncItem[];
  isSyncing: boolean;
  onSyncNow: () => void;
  onClearSynced: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({
  isOpen,
  onClose,
  language,
  isOnline,
  queue,
  isSyncing,
  onSyncNow,
  onClearSynced,
}) => {
  if (!isOpen) return null;

  const t = (key: string) => getTranslation(language, key);
  const pendingItems = queue.filter((item) => item.status === 'pending');
  const syncedItems = queue.filter((item) => item.status === 'synced');

  const getActionTypeBadge = (actionType: string) => {
    switch (actionType) {
      case 'create_field':
        return { label: language === 'ta' ? 'புதிய நிலம்' : language === 'hi' ? 'नया खेत' : 'New Field', color: 'bg-emerald-100 text-emerald-800' };
      case 'create_soil_test':
        return { label: language === 'ta' ? 'மண் பரிசோதனை' : language === 'hi' ? 'मृदा जांच' : 'Soil Test', color: 'bg-purple-100 text-purple-800' };
      case 'create_activity':
        return { label: language === 'ta' ? 'பாசனம் / செயல்' : language === 'hi' ? 'खेत कार्य' : 'Activity', color: 'bg-blue-100 text-blue-800' };
      case 'create_scan':
        return { label: language === 'ta' ? 'பயிர் ஸ்கேன்' : language === 'hi' ? 'पत्ती स्कैन' : 'Crop Scan', color: 'bg-amber-100 text-amber-800' };
      case 'create_review':
        return { label: language === 'ta' ? 'நிபுணர் குறிப்பு' : language === 'hi' ? 'विशेषज्ञ सलाह' : 'Expert Note', color: 'bg-teal-100 text-teal-800' };
      default:
        return { label: actionType, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-agri-dark">
                {t('syncQueueModalTitle')}
              </h2>
              <p className="text-xs text-gray-500">
                {isOnline
                  ? (language === 'ta' ? 'ஆன்லைனில் இணைக்கப்பட்டுள்ளது' : language === 'hi' ? 'नेटवर्क से कनेक्टेड' : 'Connected to Network')
                  : (language === 'ta' ? 'ஆஃப்லைன் முறை செயலில் உள்ளது' : language === 'hi' ? 'ऑफ़लाइन मोड सक्रिय' : 'Operating in Offline Mode')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Network & Queue Status Card */}
        <div className="my-4 p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-xs font-bold text-agri-dark">
                {isOnline
                  ? (language === 'ta' ? 'இணைய இணைப்பு உள்ளது' : language === 'hi' ? 'ऑनलाइन • नेटवर्क सक्रिय' : 'Online • Network Active')
                  : (language === 'ta' ? 'இணையம் இல்லை (உள்ளூர் சேமிப்பு)' : language === 'hi' ? 'ऑफ़लाइन • स्थानीय कैश सक्रिय' : 'Offline • Local Cache Active')}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
              {pendingItems.length} {language === 'ta' ? 'காத்திருக்கிறது' : language === 'hi' ? 'लंबित' : 'pending'}
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            {isOnline
              ? (language === 'ta'
                  ? 'உங்கள் நிலத் தரவு, பரிந்துரைகள் மற்றும் பதிவுகள் புதுப்பிக்கப்பட்டுள்ளன. நிலப்பகுதியில் இருக்கும்போது நீங்கள் ஆஃப்லைனில் வேலை செய்யலாம்.'
                  : 'Your field records and recommendations are safe. When working in remote farm areas with no signal, all activities are queued locally.')
              : t('offlineBannerDesc')}
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={onSyncNow}
              disabled={isSyncing || (!isOnline && pendingItems.length === 0)}
              className="px-4 py-2 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-xs font-bold flex items-center gap-2 transition-all btn-press disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? t('syncingInProgress') : t('syncNowBtn')}</span>
            </button>

            {syncedItems.length > 0 && (
              <button
                onClick={onClearSynced}
                className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                <span>{t('clearSyncQueue')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Queued Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            <span>{t('queuedItemsList')}</span>
            <span>({queue.length})</span>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-8 px-4 bg-[#fbfdf9] rounded-2xl border border-dashed border-[#dde7df]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-agri-dark">
                {t('noQueuedItems')}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {language === 'ta'
                  ? 'ஆஃப்லைனில் உள்ள போது செய்யப்படும் மாற்றங்கள் தானாகவே இங்கு வரிசைப்படுத்தப்படும்.'
                  : 'Any field actions performed while offline will appear here and sync automatically when reconnected.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => {
                const badge = getActionTypeBadge(item.action_type);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="font-bold text-agri-dark truncate">
                          {item.title}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-gray-500 truncate">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {item.status === 'synced' ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'ஒத்திசைக்கப்பட்டது' : language === 'hi' ? 'सिंक हुआ' : 'Synced'}</span>
                        </span>
                      ) : item.status === 'syncing' ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-lg">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'ta' ? 'ஒத்திசைகிறது' : language === 'hi' ? 'सिंक हो रहा है' : 'Syncing'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'காத்திருக்கிறது' : language === 'hi' ? 'कतार में' : 'Queued'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info pill */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-agri-primary" />
            <span>PWA & LocalStorage Protected</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
