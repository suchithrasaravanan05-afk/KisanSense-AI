'use client';

import React from 'react';
import { Language } from '../../types';
import { getTranslation } from '../../i18n/translations';
import {
  Camera,
  Droplets,
  FlaskConical,
  History,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Sprout,
  Globe,
} from 'lucide-react';

interface LandingViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenDashboard: () => void;
  onTryDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  language,
  onLanguageChange,
  onOpenDashboard,
  onTryDemo,
}) => {
  const t = (key: string) => getTranslation(language, key);

  const features = [
    {
      icon: Camera,
      title: t('featureScanTitle'),
      desc: t('featureScanDesc'),
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      icon: Droplets,
      title: t('featureWaterTitle'),
      desc: t('featureWaterDesc'),
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      icon: FlaskConical,
      title: t('featureFertilizerTitle'),
      desc: t('featureFertilizerDesc'),
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    {
      icon: History,
      title: t('featureTimelineTitle'),
      desc: t('featureTimelineDesc'),
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFDF9] flex flex-col justify-between">
      {/* Top Bar with Language Toggle */}
      <nav className="border-b border-[#dde7df] bg-white/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-agri-primary text-white flex items-center justify-center shadow-md shadow-agri-primary/20">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-agri-dark tracking-tight">
                {t('appName')}
              </span>
              <span className="ml-2 text-[10px] font-semibold bg-agri-light text-agri-primary px-2 py-0.5 rounded-full">
                {t('farmerAdvisoryBadge')}
              </span>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="relative flex items-center bg-white border border-gray-200 hover:border-agri-primary/40 rounded-xl px-2.5 py-1.5 transition-all shadow-sm">
            <Globe className="w-4 h-4 text-agri-primary mr-1 flex-shrink-0" />
            <select
              id="landing-language-select"
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
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-16 flex-1 flex flex-col items-center text-center">
        {/* Trust Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-agri-light border border-[#bbf7d0] text-agri-primary text-xs sm:text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>{t('trustPill')}</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-agri-dark tracking-tight max-w-4xl leading-[1.15]">
          {t('heroHeadlinePart1')}{' '}
          <span className="text-agri-primary underline decoration-[#86efac] decoration-wavy decoration-2">
            {t('heroHeadlinePart2')}
          </span>
          .
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-agri-dark/80 max-w-2xl leading-relaxed">
          {t('heroSubhead')}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={onOpenDashboard}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-agri-primary hover:bg-agri-accent text-white font-bold text-base shadow-lg shadow-agri-primary/25 transition-all flex items-center justify-center gap-2 btn-press"
          >
            <span>{t('openDashboard')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-gray-50 text-agri-dark font-bold text-base border-2 border-agri-primary/30 shadow-sm transition-all flex items-center justify-center gap-2 btn-press"
          >
            <Sparkles className="w-5 h-5 text-agri-primary" />
            <span>{t('tryDemo')}</span>
          </button>
        </div>

        {/* MANDATORY STATEMENT REQUIRED BY SPECIFICATION */}
        <div className="mt-10 max-w-2xl w-full bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 text-xs sm:text-sm text-amber-950 font-medium text-left flex items-start gap-3 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900 block sm:inline mr-1">
              {t('safetyCommitment')}
            </span>
            {t('safetyNotice')}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-5 border border-[#dde7df] shadow-card hover:shadow-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-agri-dark mb-1.5">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-agri-dark/75 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-agri-primary">
                  <span>{t('exploreFeature')}</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dde7df] bg-white py-6 px-4 text-center text-xs text-agri-dark/70">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            {t('footerCopyright')}
          </p>
          <div className="flex gap-4 font-medium flex-wrap justify-center">
            <span>{t('footerOpenMeteo')}</span>
            <span>•</span>
            <span>{t('footerSoilCard')}</span>
            <span>•</span>
            <span>{t('footerPwa')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
