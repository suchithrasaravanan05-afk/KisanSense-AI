'use client';

import React, { useState } from 'react';
import { Field, Crop, Language, SoilType, IrrigationMethod, AreaUnit, GrowthStage } from '../types';
import { getTranslation } from '../i18n/translations';
import { X, MapPin, LocateFixed, AlertCircle, Check } from 'lucide-react';

interface ModalAddFieldProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onSaveField: (
    fieldData: Omit<Field, 'id' | 'created_at'>,
    cropData: Omit<Crop, 'id' | 'field_id'>
  ) => void;
}

export const ModalAddField: React.FC<ModalAddFieldProps> = ({
  language,
  isOpen,
  onClose,
  onSaveField,
}) => {
  const t = (key: string) => getTranslation(language, key);

  // Form State
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [area, setArea] = useState<string>('2.5');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('acre');
  const [soilType, setSoilType] = useState<SoilType>('loamy');
  const [irrigationMethod, setIrrigationMethod] = useState<IrrigationMethod>('drip');
  const [flowRate, setFlowRate] = useState<string>('3000');

  // Initial Crop Configuration
  const [cropName, setCropName] = useState<'Tomato' | 'Rice' | 'Wheat' | 'Maize' | 'Cotton' | 'Potato'>('Tomato');
  const [variety, setVariety] = useState('');
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetative');

  // Validation
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      setErrorMessage(t('geolocationNotSupported'));
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Math.round(pos.coords.latitude * 10000) / 10000);
        setLongitude(Math.round(pos.coords.longitude * 10000) / 10000);
        if (!locationName) {
          setLocationName('GPS Located Field');
        }
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS error, using fallback:', err);
        // Fallback default coordinates
        setLatitude(20.7453);
        setLongitude(78.6022);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage(t('requiredField') + ': ' + t('fieldName'));
      return;
    }

    const parsedArea = parseFloat(area);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setErrorMessage(t('positiveAreaValidation'));
      return;
    }

    const parsedFlowRate = flowRate ? parseFloat(flowRate) : undefined;
    if (parsedFlowRate !== undefined && (isNaN(parsedFlowRate) || parsedFlowRate < 0)) {
      setErrorMessage(t('positiveFlowRateValidation'));
      return;
    }

    onSaveField(
      {
        user_id: 'user-ramesh-01',
        name: name.trim(),
        location_name: locationName.trim() || 'Wardha, Maharashtra',
        latitude,
        longitude,
        area: parsedArea,
        area_unit: areaUnit,
        soil_type: soilType,
        irrigation_method: irrigationMethod,
        flow_rate: parsedFlowRate || 3000,
      },
      {
        crop_name: cropName,
        variety: variety.trim() || `${cropName} Hybrid`,
        sowing_date: sowingDate,
        growth_stage: growthStage,
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-agri-dark">
              {t('addFieldTitle')}
            </h2>
            <p className="text-xs text-gray-500">{t('recordPlotDetails')}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Field Name */}
          <div>
            <label htmlFor="modal-field-name" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('fieldName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-field-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fieldNamePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agri-primary text-sm"
              required
            />
          </div>

          {/* Location & GPS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="modal-field-location" className="text-xs font-semibold text-agri-dark">
                {t('location')}
              </label>
              <button
                type="button"
                onClick={handleFetchGps}
                disabled={gpsLoading}
                className="text-[11px] text-agri-primary font-medium flex items-center gap-1 hover:underline"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                {gpsLoading ? t('detectingGps') : t('fetchGps')}
              </button>
            </div>
            <input
              id="modal-field-location"
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={t('locationPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agri-primary text-sm"
            />
            {latitude && longitude && (
              <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> GPS: {latitude}, {longitude}
              </p>
            )}
          </div>

          {/* Area & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-field-area" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('area')} <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-field-area"
                type="number"
                step="0.1"
                min="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agri-primary text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-field-area-unit" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('areaUnit')}
              </label>
              <select
                id="modal-field-area-unit"
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agri-primary text-sm bg-white"
              >
                <option value="acre">{language === 'ta' ? 'ஏக்கர் (Acre)' : language === 'hi' ? 'एकड़ (Acre)' : 'Acres'}</option>
                <option value="hectare">{language === 'ta' ? 'ஹெக்டேர் (Hectare)' : language === 'hi' ? 'हेक्टेयर (Hectare)' : 'Hectares'}</option>
              </select>
            </div>
          </div>

          {/* Soil Type */}
          <div>
            <label htmlFor="modal-field-soil-type" className="block text-xs font-semibold text-agri-dark mb-1">
              {t('soilType')}
            </label>
            <select
              id="modal-field-soil-type"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value as SoilType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agri-primary text-sm bg-white"
            >
              <option value="loamy">{t('soilLoamy')}</option>
              <option value="clay">{t('soilClay')}</option>
              <option value="sandy">{t('soilSandy')}</option>
              <option value="silt">{t('soilSilt')}</option>
              <option value="unknown">{t('soilUnknown')}</option>
            </select>
          </div>

          {/* Irrigation Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-field-irrigation-method" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('irrigationMethod')}
              </label>
              <select
                id="modal-field-irrigation-method"
                value={irrigationMethod}
                onChange={(e) => setIrrigationMethod(e.target.value as IrrigationMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agri-primary text-sm bg-white"
              >
                <option value="drip">{t('methodDrip')}</option>
                <option value="sprinkler">{t('methodSprinkler')}</option>
                <option value="flood">{t('methodFlood')}</option>
                <option value="rain_fed">{t('methodRainFed')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="modal-field-flow-rate" className="block text-xs font-semibold text-agri-dark mb-1">
                {t('flowRate')}
              </label>
              <input
                id="modal-field-flow-rate"
                type="number"
                value={flowRate}
                onChange={(e) => setFlowRate(e.target.value)}
                placeholder="3000 L/hr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-agri-primary text-sm"
              />
            </div>
          </div>

          {/* Initial Crop Section */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase text-agri-primary tracking-wider mb-2">
              {t('cropSetupTitle')}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="modal-field-crop-name" className="block text-xs font-semibold text-agri-dark mb-1">
                  {t('cropName')}
                </label>
                <select
                  id="modal-field-crop-name"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-agri-primary bg-white"
                >
                  <option value="Tomato">{language === 'ta' ? 'தக்காளி (Tomato)' : language === 'hi' ? 'टमाटर (Tomato)' : 'Tomato'}</option>
                  <option value="Rice">{language === 'ta' ? 'நெல் / அரிசி (Rice)' : language === 'hi' ? 'धान / चावल (Rice)' : 'Rice'}</option>
                  <option value="Wheat">{language === 'ta' ? 'கோதுமை (Wheat)' : language === 'hi' ? 'गेहूं (Wheat)' : 'Wheat'}</option>
                  <option value="Maize">{language === 'ta' ? 'மக்காச்சோளம் (Maize)' : language === 'hi' ? 'मक्का (Maize)' : 'Maize'}</option>
                  <option value="Cotton">{language === 'ta' ? 'பருத்தி (Cotton)' : language === 'hi' ? 'कपास (Cotton)' : 'Cotton'}</option>
                  <option value="Potato">{language === 'ta' ? 'உருளைக்கிழங்கு (Potato)' : language === 'hi' ? 'आलू (Potato)' : 'Potato'}</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-field-growth-stage" className="block text-xs font-semibold text-agri-dark mb-1">
                  {t('growthStage')}
                </label>
                <select
                  id="modal-field-growth-stage"
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary bg-white"
                >
                  <option value="seedling">{t('stageSeedling')}</option>
                  <option value="vegetative">{t('stageVegetative')}</option>
                  <option value="flowering">{t('stageFlowering')}</option>
                  <option value="fruiting">{t('stageFruiting')}</option>
                  <option value="maturity">{t('stageMaturity')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-field-variety" className="block text-xs font-semibold text-agri-dark mb-1">
                  {t('variety')}
                </label>
                <input
                  id="modal-field-variety"
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder={t('varietyPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
                />
              </div>

              <div>
                <label htmlFor="modal-field-sowing-date" className="block text-xs font-semibold text-agri-dark mb-1">
                  {t('sowingDate')}
                </label>
                <input
                  id="modal-field-sowing-date"
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-agri-primary"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-sm font-semibold shadow-md shadow-agri-primary/20 transition-all btn-press"
            >
              {t('saveField')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
