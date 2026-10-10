'use client';

import React, { useState } from 'react';
import { Field, Crop, Language, GrowthStage } from '../types';
import { getTranslation } from '../i18n/translations';
import { X, Sprout, AlertCircle, Check } from 'lucide-react';

interface ModalAddCropProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  activeFieldId: string;
  onSaveCrop: (
    cropData: Omit<Crop, 'id' | 'field_id'>,
    targetFieldId: string
  ) => void;
}

export const ModalAddCrop: React.FC<ModalAddCropProps> = ({
  language,
  isOpen,
  onClose,
  fields,
  activeFieldId,
  onSaveCrop,
}) => {
  const t = (key: string) => getTranslation(language, key);

  const [fieldId, setFieldId] = useState(activeFieldId || fields[0]?.id || '');
  const [cropName, setCropName] = useState<'Tomato' | 'Rice' | 'Wheat' | 'Maize' | 'Cotton' | 'Potato'>('Tomato');
  const [variety, setVariety] = useState('');
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetative');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fieldId) {
      setError(t('requiredField') + ': ' + t('activeField'));
      return;
    }

    if (!sowingDate) {
      setError(t('requiredField') + ': ' + t('sowingDate'));
      return;
    }

    onSaveCrop(
      {
        crop_name: cropName,
        variety: variety.trim() || `${cropName} Hybrid`,
        sowing_date: sowingDate,
        growth_stage: growthStage,
      },
      fieldId
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-agri-dark">
                {t('addCropModalTitle')}
              </h2>
              <p className="text-xs text-gray-500">{t('cropSetupTitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Target Field */}
          <div>
            <label htmlFor="crop-modal-target-field" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('activeField')}
            </label>
            <select
              id="crop-modal-target-field"
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-agri-primary"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.area} {f.area_unit})
                </option>
              ))}
            </select>
          </div>

          {/* Crop Name */}
          <div>
            <label htmlFor="crop-modal-crop-name" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('cropName')} <span className="text-red-500">*</span>
            </label>
            <select
              id="crop-modal-crop-name"
              value={cropName}
              onChange={(e) => setCropName(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-agri-primary bg-white"
            >
              <option value="Tomato">{language === 'ta' ? 'தக்காளி (Tomato)' : language === 'hi' ? 'टमाटर (Tomato)' : 'Tomato'}</option>
              <option value="Rice">{language === 'ta' ? 'நெல் / அரிசி (Rice)' : language === 'hi' ? 'धान / चावल (Rice)' : 'Rice'}</option>
              <option value="Wheat">{language === 'ta' ? 'கோதுமை (Wheat)' : language === 'hi' ? 'गेहूं (Wheat)' : 'Wheat'}</option>
              <option value="Maize">{language === 'ta' ? 'மக்காச்சோளம் (Maize)' : language === 'hi' ? 'मक्का (Maize)' : 'Maize'}</option>
              <option value="Cotton">{language === 'ta' ? 'பருத்தி (Cotton)' : language === 'hi' ? 'कपास (Cotton)' : 'Cotton'}</option>
              <option value="Potato">{language === 'ta' ? 'உருளைக்கிழங்கு (Potato)' : language === 'hi' ? 'आलू (Potato)' : 'Potato'}</option>
            </select>
          </div>

          {/* Variety & Sowing Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="crop-modal-variety" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('variety')}
              </label>
              <input
                id="crop-modal-variety"
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder={t('varietyPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
              />
            </div>
            <div>
              <label htmlFor="crop-modal-sowing-date" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('sowingDate')} <span className="text-red-500">*</span>
              </label>
              <input
                id="crop-modal-sowing-date"
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
                required
              />
            </div>
          </div>

          {/* Growth Stage */}
          <div>
            <label htmlFor="crop-modal-growth-stage" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('growthStage')}
            </label>
            <select
              id="crop-modal-growth-stage"
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary bg-white"
            >
              <option value="seedling">{t('stageSeedling')}</option>
              <option value="vegetative">{t('stageVegetative')}</option>
              <option value="flowering">{t('stageFlowering')}</option>
              <option value="fruiting">{t('stageFruiting')}</option>
              <option value="maturity">{t('stageMaturity')}</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-sm font-semibold shadow-md shadow-agri-primary/20 transition-all btn-press"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
