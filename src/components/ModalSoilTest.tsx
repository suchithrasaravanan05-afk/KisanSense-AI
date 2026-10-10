'use client';

import React, { useState } from 'react';
import { Field, Language, SoilTest } from '../types';
import { getTranslation } from '../i18n/translations';
import { X, FlaskConical, AlertCircle, Info } from 'lucide-react';

interface ModalSoilTestProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  activeFieldId: string;
  onSaveSoilTest: (data: Omit<SoilTest, 'id'>) => void;
}

export const ModalSoilTest: React.FC<ModalSoilTestProps> = ({
  language,
  isOpen,
  onClose,
  fields,
  activeFieldId,
  onSaveSoilTest,
}) => {
  const t = (key: string) => getTranslation(language, key);

  const [fieldId, setFieldId] = useState(activeFieldId);
  const [testDate, setTestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ph, setPh] = useState<string>('6.8');
  const [nitrogen, setNitrogen] = useState<string>('240');
  const [phosphorus, setPhosphorus] = useState<string>('24');
  const [potassium, setPotassium] = useState<string>('180');
  const [organicCarbon, setOrganicCarbon] = useState<string>('0.60');
  const [ec, setEc] = useState<string>('0.45');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedPh = ph ? parseFloat(ph) : undefined;
    const parsedN = nitrogen ? parseFloat(nitrogen) : undefined;
    const parsedP = phosphorus ? parseFloat(phosphorus) : undefined;
    const parsedK = potassium ? parseFloat(potassium) : undefined;
    const parsedOc = organicCarbon ? parseFloat(organicCarbon) : undefined;
    const parsedEc = ec ? parseFloat(ec) : undefined;

    if (parsedPh !== undefined && (parsedPh < 3 || parsedPh > 11)) {
      setError(t('soilRangeValidation'));
      return;
    }

    if (
      (parsedN !== undefined && parsedN < 0) ||
      (parsedP !== undefined && parsedP < 0) ||
      (parsedK !== undefined && parsedK < 0) ||
      (parsedOc !== undefined && parsedOc < 0) ||
      (parsedEc !== undefined && parsedEc < 0)
    ) {
      setError(t('numericOnly'));
      return;
    }

    onSaveSoilTest({
      field_id: fieldId,
      test_date: testDate,
      ph: parsedPh,
      nitrogen: parsedN,
      phosphorus: parsedP,
      potassium: parsedK,
      organic_carbon: parsedOc,
      electrical_conductivity: parsedEc,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-agri-dark">
                {t('enterSoilTestBtn')}
              </h2>
              <p className="text-xs text-gray-500">{t('recordCertifiedLabValues')}</p>
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

        <div className="mt-3 bg-blue-50/80 border border-blue-200/60 rounded-xl p-3 flex gap-2 text-xs text-blue-900 leading-relaxed">
          <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
          <p>
            {t('soilLabEnablesSafeSplit')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          {/* Target Field */}
          <div>
            <label htmlFor="soil-test-field-id" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('activeField')}
            </label>
            <select
              id="soil-test-field-id"
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-agri-primary"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.area} {f.area_unit})
                </option>
              ))}
            </select>
          </div>

          {/* Test Date */}
          <div>
            <label htmlFor="soil-test-date" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('testDate')}
            </label>
            <input
              id="soil-test-date"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
              required
            />
          </div>

          {/* Soil pH & EC */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="soil-test-ph" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('soilPh')} (1 - 14)
              </label>
              <input
                id="soil-test-ph"
                type="number"
                step="0.1"
                min="3"
                max="11"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="6.5 - 7.5"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary font-semibold"
              />
            </div>
            <div>
              <label htmlFor="soil-test-ec" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('electricalConductivity')}
              </label>
              <input
                id="soil-test-ec"
                type="number"
                step="0.05"
                min="0"
                value={ec}
                onChange={(e) => setEc(e.target.value)}
                placeholder="< 1.0 dS/m"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
              />
            </div>
          </div>

          {/* N - P - K */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="soil-test-n" className="block text-[11px] font-semibold text-agri-dark mb-1">
                {t('availableN')}
              </label>
              <input
                id="soil-test-n"
                type="number"
                min="0"
                value={nitrogen}
                onChange={(e) => setNitrogen(e.target.value)}
                placeholder="250 kg/ha"
                className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-agri-primary font-semibold"
              />
            </div>
            <div>
              <label htmlFor="soil-test-p" className="block text-[11px] font-semibold text-agri-dark mb-1">
                {t('availableP')}
              </label>
              <input
                id="soil-test-p"
                type="number"
                min="0"
                value={phosphorus}
                onChange={(e) => setPhosphorus(e.target.value)}
                placeholder="20 kg/ha"
                className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-agri-primary font-semibold"
              />
            </div>
            <div>
              <label htmlFor="soil-test-k" className="block text-[11px] font-semibold text-agri-dark mb-1">
                {t('availableK')}
              </label>
              <input
                id="soil-test-k"
                type="number"
                min="0"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
                placeholder="180 kg/ha"
                className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-agri-primary font-semibold"
              />
            </div>
          </div>

          {/* Organic Carbon */}
          <div>
            <label htmlFor="soil-test-oc" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('organicCarbon')}
            </label>
            <input
              id="soil-test-oc"
              type="number"
              step="0.05"
              min="0"
              value={organicCarbon}
              onChange={(e) => setOrganicCarbon(e.target.value)}
              placeholder="0.5% - 0.75%"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="soil-test-notes" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('soilNotesLabel')}
            </label>
            <input
              id="soil-test-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('soilNotesPlaceholder')}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
            />
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
              className="px-5 py-2.5 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-sm font-semibold shadow-md shadow-agri-primary/20 btn-press"
            >
              {t('saveSoilTest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
