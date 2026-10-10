'use client';

import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { LayoutDashboard, Camera, Droplets, FlaskConical, History, UserCheck, Settings } from 'lucide-react';

interface BottomNavProps {
  language: Language;
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  language,
  currentTab,
  onSelectTab,
}) => {
  const t = (key: string) => getTranslation(language, key);

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'water', label: t('navWater'), icon: Droplets },
    { id: 'scan', label: t('navScan'), icon: Camera, isCenter: true },
    { id: 'fertilizer', label: t('navFertilizer'), icon: FlaskConical },
    { id: 'timeline', label: t('navTimeline'), icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#dde7df] px-2 py-1.5 md:hidden shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center -mt-5 focus:outline-none"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                    isActive ? 'bg-agri-dark ring-4 ring-agri-light' : 'bg-agri-primary shadow-agri-primary/30'
                  }`}
                >
                  <Icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${isActive ? 'text-agri-primary font-bold' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
                isActive ? 'text-agri-primary font-semibold' : 'text-gray-500 hover:text-agri-primary/80'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} aria-hidden="true" />
              <span className="text-[10px] mt-1 truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
