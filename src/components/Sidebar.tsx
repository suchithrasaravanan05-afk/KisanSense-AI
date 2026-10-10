'use client';

import React from 'react';
import { Language, User } from '../types';
import { getTranslation } from '../i18n/translations';
import {
  LayoutDashboard,
  Camera,
  Droplets,
  FlaskConical,
  History,
  UserCheck,
  Settings,
  ShieldAlert,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  language: Language;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddField: () => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({
  language,
  currentTab,
  onSelectTab,
  onOpenAddField,
  user,
}) => {
  const t = (key: string) => getTranslation(language, key);

  const mainLinks = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'scan', label: t('navScan'), icon: Camera },
    { id: 'water', label: t('navWater'), icon: Droplets },
    { id: 'fertilizer', label: t('navFertilizer'), icon: FlaskConical },
    { id: 'timeline', label: t('navTimeline'), icon: History },
    { id: 'expert', label: t('navExpert'), icon: UserCheck },
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#dde7df] min-h-[calc(100vh-65px)] p-4 justify-between">
      <div className="space-y-6">
        {/* Quick Add Field Button */}
        <div>
          <button
            onClick={onOpenAddField}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-agri-light hover:bg-[#dcfce7] text-agri-primary font-semibold text-sm transition-colors border border-[#bbf7d0] shadow-sm btn-press"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('addField')}</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-agri-primary text-white shadow-sm font-semibold'
                    : 'text-agri-dark/80 hover:bg-gray-100/80 hover:text-agri-primary'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-agri-primary'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Safety */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 border border-gray-100">
          <div className="w-8 h-8 rounded-full bg-agri-primary/10 text-agri-primary font-bold flex items-center justify-center text-xs">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-agri-dark truncate">{user.name}</p>
            <p className="text-[10px] text-gray-500 capitalize">
              {user.role === 'expert' ? t('expertBadge') : t('farmerBadge')}
            </p>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50 flex gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-tight">
            {t('safetyNoticeShort')}
          </p>
        </div>
      </div>
    </aside>
  );
};
