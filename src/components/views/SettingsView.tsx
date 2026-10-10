'use client';

import React, { useState } from 'react';
import { User, Language } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { SafetyBanner } from '../SafetyBanner';
import {
  Settings,
  User as UserIcon,
  Globe,
  Database,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Lock,
  Key,
  CheckCircle2,
  Bug,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLoadDemoData: () => void;
  onResetData: () => void;
  simulateWeatherFail: boolean;
  onToggleSimulateWeather: (val: boolean) => void;
  simulateLowConfidence: boolean;
  onToggleSimulateLowConfidence: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  user,
  onUpdateUser,
  onLoadDemoData,
  onResetData,
  simulateWeatherFail,
  onToggleSimulateWeather,
  simulateLowConfidence,
  onToggleSimulateLowConfidence,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const [userName, setUserName] = useState(user.name);
  const [userPhone, setUserPhone] = useState(user.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name: userName.trim(), phone: userPhone.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-agri-dark">
          {t('settingsTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-agri-dark/70 mt-1">
          {t('settingsDesc')}
        </p>
      </div>

      <SafetyBanner language={language} />

      {/* User Profile Form */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <UserIcon className="w-5 h-5 text-agri-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-agri-dark">
            {t('profileSection')}
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="settings-farmer-name" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('farmerFullName')}
              </label>
              <input
                id="settings-farmer-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-agri-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="settings-farmer-phone" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('contactPhone')}
              </label>
              <input
                id="settings-farmer-phone"
                type="text"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-agri-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSaved ? (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {t('profileUpdatedToast')}
              </span>
            ) : <span />}
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-agri-primary hover:bg-agri-accent text-white font-bold text-xs shadow-sm btn-press"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>

      {/* Language & Measurement Units */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Globe className="w-5 h-5 text-agri-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-agri-dark">
            {t('langRegionalSection')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-agri-dark mb-1.5">
              {t('languagePreference')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  language === 'en'
                    ? 'bg-agri-primary text-white border-agri-primary shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  language === 'hi'
                    ? 'bg-agri-primary text-white border-agri-primary shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('ta')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  language === 'ta'
                    ? 'bg-agri-primary text-white border-agri-primary shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                தமிழ்
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              {t('langScheduledRoadmap')}
            </p>
          </div>

          <div>
            <label htmlFor="settings-units-preference" className="block text-xs font-semibold text-agri-dark mb-1.5">
              {t('unitsPreference')}
            </label>
            <input
              id="settings-units-preference"
              type="text"
              readOnly
              value={t('unitsMetric')}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 text-gray-600 font-medium"
            />
          </div>
        </div>
      </div>

      {/* QA & DEMO TESTING CONTROLS */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Bug className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-agri-dark">
            {t('qaTestingControls')}
          </h2>
        </div>

        <div className="space-y-3">
          {/* Weather API Failure Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-xs font-bold text-agri-dark">
                Simulate Weather API Failure (Test Requirement #20)
              </p>
              <p className="text-[11px] text-gray-500">
                Forces Open-Meteo fallback to demo weather with retry capability.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={simulateWeatherFail}
                onChange={(e) => onToggleSimulateWeather(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Low Confidence Image Result Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-xs font-bold text-agri-dark">
                Simulate Low-Confidence Image Triage (Test Requirement #21)
              </p>
              <p className="text-[11px] text-gray-500">
                Forces confidence &lt; 50% to trigger daylight rescan and expert triage banner.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={simulateLowConfidence}
                onChange={(e) => onToggleSimulateLowConfidence(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Demo Data Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onLoadDemoData}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-agri-light hover:bg-[#dcfce7] text-agri-primary border border-[#bbf7d0] text-xs font-bold flex items-center justify-center gap-2 btn-press"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('loadDemoDataBtn')}</span>
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-2 btn-press"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('resetDataBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* External AI API Configuration Documentation & Live Vision Testing */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#dde7df] shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-agri-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-agri-dark">
              Production Vision Model Abstraction
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
            Provider Architecture Active
          </span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          KisanSense AI integrates a production-ready pluggable vision abstraction supporting <strong>Demo Rule-Engine</strong>, <strong>Google Gemini</strong>, and <strong>OpenAI Vision</strong>. All API keys are loaded strictly from environment variables on the server.
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto space-y-1">
          <div className="text-gray-400"># Provider selection: demo | gemini | openai</div>
          <div><span className="text-emerald-400">VISION_PROVIDER</span>=demo</div>
          <div><span className="text-emerald-400">GEMINI_API_KEY</span>=your_google_ai_key</div>
          <div><span className="text-emerald-400">OPENAI_API_KEY</span>=your_openai_key</div>
          <div><span className="text-emerald-400">VISION_TIMEOUT_MS</span>=15000</div>
          <div><span className="text-emerald-400">VISION_FALLBACK_TO_DEMO</span>=true</div>
        </div>

        {/* Live Simulation Testing Controls */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-agri-dark flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-amber-600" />
              API Failure & Resilience Test Lab
            </span>
            <span className="text-[10px] text-gray-500 font-mono">POST /api/scan</span>
          </div>
          <p className="text-[11px] text-gray-600">
            Simulate and verify how the server-side vision engine validates structured JSON, enforces safety rules, and handles timeouts, quota limits, and 500 errors.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cropName: 'Tomato', provider: 'demo' })
                  });
                  const data = await res.json();
                  alert(`[HTTP ${res.status} OK]\nCategory: ${data.result_category}\nConfidence: ${data.confidence}%\nNext Step: ${data.recommended_next_step}`);
                } catch (e: any) {
                  alert(`Request failed: ${e.message}`);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 text-[11px] font-bold text-gray-700 shadow-sm transition-all"
            >
              Demo (200 OK)
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/scan?simulate_error=timeout&strict=true', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cropName: 'Tomato' })
                  });
                  const data = await res.json();
                  alert(`[HTTP ${res.status} TIMEOUT Handled]\nCode: ${data.code}\nError: ${data.error}`);
                } catch (e: any) {
                  alert(`Request failed: ${e.message}`);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-amber-500 text-[11px] font-bold text-amber-800 shadow-sm transition-all"
            >
              Timeout (504)
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/scan?simulate_error=quota&strict=true', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cropName: 'Tomato' })
                  });
                  const data = await res.json();
                  alert(`[HTTP ${res.status} QUOTA Exceeded]\nCode: ${data.code}\nError: ${data.error}`);
                } catch (e: any) {
                  alert(`Request failed: ${e.message}`);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-rose-500 text-[11px] font-bold text-rose-800 shadow-sm transition-all"
            >
              Quota (429)
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/scan?simulate_error=invalid_json&strict=true', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cropName: 'Tomato' })
                  });
                  const data = await res.json();
                  alert(`[HTTP ${res.status} INVALID JSON]\nCode: ${data.code}\nError: ${data.error}`);
                } catch (e: any) {
                  alert(`Request failed: ${e.message}`);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-purple-500 text-[11px] font-bold text-purple-800 shadow-sm transition-all"
            >
              JSON Err (502)
            </button>
          </div>
        </div>
      </div>

      {/* Legal & Agronomic Safety Disclaimer in Full */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <h3 className="font-bold text-sm text-amber-950">
            {t('disclaimerTitle')}
          </h3>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          {t('disclaimerBody')}
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-white rounded-3xl p-5 border border-[#dde7df] flex items-start gap-3">
        <Lock className="w-5 h-5 text-agri-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600">
          <p className="font-bold text-agri-dark mb-0.5">{t('privacyNoticeLabel')}</p>
          <p>{t('privacyNote')}</p>
        </div>
      </div>
    </div>
  );
};
