'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Field,
  Crop,
  SoilTest,
  ScanResult,
  FieldActivity,
  ExpertReview,
  WeatherData,
  Language,
  User,
  IrrigationRecommendation,
  QueuedSyncItem,
} from '../types';
import { storageService } from '../services/storageService';
import { fetchWeatherData, setSimulateWeatherFailure } from '../services/weatherService';
import { calculateIrrigationRecommendation } from '../services/irrigationService';
import { setForceSimulateLowConfidence } from '../services/imageAnalysisService';
import { getTranslation } from '../i18n/translations';
import { Sprout, Camera } from 'lucide-react';

// Components
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { ModalAddField } from '../components/ModalAddField';
import { ModalAddCrop } from '../components/ModalAddCrop';
import { ModalSoilTest } from '../components/ModalSoilTest';
import { OfflineBanner } from '../components/OfflineBanner';
import { SyncStatusModal } from '../components/SyncStatusModal';

// Views
import { LandingView } from '../components/views/LandingView';
import { DashboardView } from '../components/views/DashboardView';
import { ScanView } from '../components/views/ScanView';
import { ScanResultView } from '../components/views/ScanResultView';
import { WaterView } from '../components/views/WaterView';
import { FertilizerView } from '../components/views/FertilizerView';
import { TimelineView } from '../components/views/TimelineView';
import { ExpertView } from '../components/views/ExpertView';
import { SettingsView } from '../components/views/SettingsView';

export default function Home() {
  // 1. Core State
  const [user, setUser] = useState<User>(() => storageService.getUser());
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());
  const [currentView, setCurrentView] = useState<string>('landing');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    storageService.setLanguage(newLang);
  };

  // 2. Data Models
  const [fields, setFields] = useState<Field[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string>('');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [activities, setActivities] = useState<FieldActivity[]>([]);
  const [expertReviews, setExpertReviews] = useState<ExpertReview[]>([]);

  // 3. Current active scan result for display
  const [activeScanResult, setActiveScanResult] = useState<ScanResult | null>(null);

  // 4. Modals State
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);
  const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);

  // 5. Weather State
  const [weather, setWeather] = useState<WeatherData>({
    latitude: 20.7453,
    longitude: 78.6022,
    temperature: 29.5,
    relative_humidity: 62,
    rain_probability: 20,
    rain_amount: 1.5,
    wind_speed: 12.0,
    et0: 4.8,
    is_demo: true,
    timestamp: new Date().toISOString(),
  });
  const [weatherLoading, setWeatherLoading] = useState(false);

  // 6. QA Testing simulation toggles
  const [simulateWeatherFail, setSimulateWeatherFail] = useState(false);
  const [simulateLowConfidence, setSimulateLowConfidence] = useState(false);

  // 7. Offline Sync Queue & Modals State
  const [syncQueue, setSyncQueue] = useState<QueuedSyncItem[]>([]);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 8. Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reconnection Auto-Sync Handler
  const handleAutoSync = async () => {
    setIsSyncing(true);
    try {
      const { synced } = await storageService.processSyncQueue();
      const updatedQueue = storageService.getSyncQueue();
      setSyncQueue(updatedQueue);
      if (synced > 0) {
        showToast(getTranslation(language, 'onlineRestoredToast'));
        setFields(storageService.getFields());
        setCrops(storageService.getCrops());
        setSoilTests(storageService.getSoilTests());
        setScanResults(storageService.getScanResults());
        setActivities(storageService.getFieldActivities());
        setExpertReviews(storageService.getExpertReviews());
      }
      loadWeather();
    } catch (err) {
      console.warn('[Sync] Auto sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Sync Trigger
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const { synced } = await storageService.processSyncQueue();
      const updatedQueue = storageService.getSyncQueue();
      setSyncQueue(updatedQueue);
      showToast(
        synced > 0
          ? `${synced} ${getTranslation(language, 'syncStatusPendingCount')} synced!`
          : getTranslation(language, 'syncStatusAllSynced')
      );
      loadWeather();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSynced = () => {
    const remaining = syncQueue.filter((i) => i.status !== 'synced');
    setSyncQueue(remaining);
    storageService.clearSyncQueue();
    remaining.forEach((i) => storageService.enqueueSyncAction(i));
  };

  // Online / Offline tracking
  useEffect(() => {
    const currentOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(currentOnline);
    setSyncQueue(storageService.getSyncQueue());

    const handleOnline = () => {
      setIsOnline(true);
      handleAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Mark current weather as stale
      setWeather((prev) => ({
        ...prev,
        is_stale: true,
        cached_age_display: language === 'ta' ? 'ஆஃப்லைன் முறை' : 'Offline mode',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  // Initialize data on mount
  useEffect(() => {
    const loadedFields = storageService.getFields();
    setFields(loadedFields);
    const currentActiveId = storageService.getActiveFieldId() || loadedFields[0]?.id || '';
    setActiveFieldId(currentActiveId);

    setCrops(storageService.getCrops());
    setSoilTests(storageService.getSoilTests());
    setScanResults(storageService.getScanResults());
    setActivities(storageService.getFieldActivities());
    setExpertReviews(storageService.getExpertReviews());
    setSyncQueue(storageService.getSyncQueue());
  }, []);

  // Active Field & Crop
  const activeField = useMemo(() => {
    return fields.find((f) => f.id === activeFieldId) || fields[0];
  }, [fields, activeFieldId]);

  const activeCrop = useMemo(() => {
    if (!activeField) return undefined;
    return crops.find((c) => c.field_id === activeField.id);
  }, [crops, activeField]);

  const activeSoilTest = useMemo(() => {
    if (!activeField) return undefined;
    return soilTests.find((st) => st.field_id === activeField.id);
  }, [soilTests, activeField]);

  const recentScanForField = useMemo(() => {
    if (!activeField) return undefined;
    return scanResults.find((s) => s.field_id === activeField.id);
  }, [scanResults, activeField]);

  // Load weather when active field changes or refresh requested
  const loadWeather = async (forceFail?: boolean) => {
    setWeatherLoading(true);
    const lat = activeField?.latitude || 20.7453;
    const lon = activeField?.longitude || 78.6022;
    const loc = activeField?.location_name || 'Wardha, Maharashtra';
    try {
      const data = await fetchWeatherData(lat, lon, loc);
      setWeather(data);
    } catch (e) {
      console.warn('Weather error:', e);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (activeField) {
      loadWeather();
    }
  }, [activeFieldId]);

  // Handle weather fail toggle
  const handleToggleSimulateWeather = (val: boolean) => {
    setSimulateWeatherFail(val);
    setSimulateWeatherFailure(val);
    loadWeather();
    showToast(val ? 'Simulating Weather API Failure' : 'Weather simulation restored to live');
  };

  // Handle low confidence toggle
  const handleToggleSimulateLowConfidence = (val: boolean) => {
    setSimulateLowConfidence(val);
    setForceSimulateLowConfidence(val);
    showToast(val ? 'Simulating Low-Confidence Image Triage' : 'Normal AI triage restored');
  };

  // Next recommended irrigation calculation
  const irrigationRec: IrrigationRecommendation | undefined = useMemo(() => {
    if (!activeField) return undefined;
    const cropToUse = activeCrop || {
      id: 'temp-crop',
      field_id: activeField.id,
      crop_name: 'Tomato',
      sowing_date: '2026-08-01',
      growth_stage: 'flowering',
    };
    return calculateIrrigationRecommendation(activeField, cropToUse, weather);
  }, [activeField, activeCrop, weather]);

  // Handlers
  const handleSelectField = (id: string) => {
    setActiveFieldId(id);
    storageService.setActiveFieldId(id);
  };

  const handleCreateField = (
    fieldData: Omit<Field, 'id' | 'created_at'>,
    cropData: Omit<Crop, 'id' | 'field_id'>
  ) => {
    const newField = storageService.createField(fieldData);
    const newCrop = storageService.createCrop({
      ...cropData,
      field_id: newField.id,
    });

    setFields(storageService.getFields());
    setCrops(storageService.getCrops());
    setActiveFieldId(newField.id);

    // Timeline event
    storageService.createFieldActivity({
      field_id: newField.id,
      type: 'weather_event',
      title: `New Field Registered: ${newField.name}`,
      description: `Registered ${newField.area} ${newField.area_unit}s of ${newCrop.crop_name} (${newCrop.variety}) with ${newField.soil_type} soil.`,
      activity_date: new Date().toISOString(),
      completed: true,
    });
    setActivities(storageService.getFieldActivities());

    if (!isOnline) {
      storageService.enqueueSyncAction({
        action_type: 'create_field',
        title: `Field: ${newField.name} (${newField.area} ${newField.area_unit})`,
        description: `${newCrop.crop_name} • ${newField.location_name}`,
        payload: { field: newField, crop: newCrop },
      });
      setSyncQueue(storageService.getSyncQueue());
      showToast(`${newField.name} — ${getTranslation(language, 'queuedActionAdded')}`);
    } else {
      showToast(`Field "${newField.name}" created successfully!`);
    }
  };

  const handleSaveCrop = (
    cropData: Omit<Crop, 'id' | 'field_id'>,
    targetFieldId: string
  ) => {
    const newCrop = storageService.createCrop({
      ...cropData,
      field_id: targetFieldId,
    });
    setCrops(storageService.getCrops());

    const targetField = fields.find((f) => f.id === targetFieldId);

    // Timeline event
    storageService.createFieldActivity({
      field_id: targetFieldId,
      type: 'weather_event',
      title: `Crop Registered: ${newCrop.crop_name} (${newCrop.variety || ''})`,
      description: `Stage: ${newCrop.growth_stage}, Sown on: ${newCrop.sowing_date}`,
      activity_date: new Date().toISOString(),
      completed: true,
    });
    setActivities(storageService.getFieldActivities());

    showToast(`${newCrop.crop_name} assigned to ${targetField?.name || 'field'}!`);
  };

  const handleSaveSoilTest = (data: Omit<SoilTest, 'id'>) => {
    const newTest = storageService.createSoilTest(data);
    setSoilTests(storageService.getSoilTests());
    setActivities(storageService.getFieldActivities());

    if (!isOnline) {
      storageService.enqueueSyncAction({
        action_type: 'create_soil_test',
        title: `Soil Test (${newTest.test_date})`,
        description: `pH: ${newTest.ph || 'N/A'}, N: ${newTest.nitrogen || 'N/A'} kg/ha`,
        payload: newTest,
      });
      setSyncQueue(storageService.getSyncQueue());
      showToast(`Soil Test — ${getTranslation(language, 'queuedActionAdded')}`);
    } else {
      showToast('Laboratory soil test recorded and linked to field!');
    }
  };

  const handleScanCompleted = (result: ScanResult) => {
    setActiveScanResult(result);
    setCurrentView('scan_result');
  };

  const handleSaveScanToTimeline = () => {
    if (!activeScanResult) return;
    storageService.createScanResult(activeScanResult);
    storageService.createFieldActivity({
      field_id: activeScanResult.field_id,
      type: 'scan',
      title: `Crop Leaf Scan: ${activeScanResult.result_category.replace('_', ' ')}`,
      description: `${activeScanResult.explanation} (Confidence: ${activeScanResult.confidence}%)`,
      activity_date: new Date().toISOString(),
      completed: true,
      image_url: activeScanResult.image_url,
    });

    setScanResults(storageService.getScanResults());
    setActivities(storageService.getFieldActivities());

    if (!isOnline) {
      storageService.enqueueSyncAction({
        action_type: 'create_scan',
        title: `Crop Scan: ${activeScanResult.crop_name} (${activeScanResult.result_category})`,
        description: `Confidence ${activeScanResult.confidence}%`,
        payload: activeScanResult,
      });
      setSyncQueue(storageService.getSyncQueue());
    }

    showToast(getTranslation(language, 'resultSavedToast'));
  };

  const handleAskExpert = () => {
    if (!activeScanResult) return;
    const review = storageService.createExpertReview({
      scan_result_id: activeScanResult.id,
      field_id: activeScanResult.field_id,
      farmer_name: user.name,
      field_name: activeField?.name || 'My Field',
      crop_name: activeScanResult.crop_name,
      image_url: activeScanResult.image_url || '',
      ai_category: activeScanResult.result_category,
      ai_confidence: activeScanResult.confidence,
      expert_notes: 'Pending agronomist evaluation...',
      corrected_result: activeScanResult.result_category,
      review_status: 'pending',
    });

    setExpertReviews(storageService.getExpertReviews());
    setActivities(storageService.getFieldActivities());

    if (!isOnline) {
      storageService.enqueueSyncAction({
        action_type: 'create_review',
        title: `Expert Review: ${activeScanResult.crop_name}`,
        description: `Field: ${activeField?.name}`,
        payload: review,
      });
      setSyncQueue(storageService.getSyncQueue());
    }

    showToast(getTranslation(language, 'expertEscalatedToast'));
  };

  const handleLogIrrigation = (volumeLitres: number, notes: string) => {
    if (!activeField) return;
    const act = storageService.createFieldActivity({
      field_id: activeField.id,
      type: 'irrigation',
      title: `${activeField.irrigation_method.toUpperCase()} Irrigation Applied`,
      description: notes,
      quantity: volumeLitres,
      unit: 'Litres',
      activity_date: new Date().toISOString(),
      completed: true,
      farmer_feedback: 'helpful',
    });

    setActivities(storageService.getFieldActivities());

    if (!isOnline) {
      storageService.enqueueSyncAction({
        action_type: 'create_activity',
        title: `Irrigation: ${volumeLitres.toLocaleString()} Litres`,
        description: notes,
        payload: act,
      });
      setSyncQueue(storageService.getSyncQueue());
      showToast(`Irrigation — ${getTranslation(language, 'queuedActionAdded')}`);
    } else {
      showToast(getTranslation(language, 'irrigationLoggedToast'));
    }
  };

  const handleToggleActivity = (id: string, completed: boolean) => {
    storageService.updateFieldActivity(id, { completed });
    setActivities(storageService.getFieldActivities());
  };

  const handleActivityFeedback = (
    id: string,
    feedback: 'helpful' | 'unsure' | 'harmful' | 'resolved'
  ) => {
    storageService.updateFieldActivity(id, { farmer_feedback: feedback });
    setActivities(storageService.getFieldActivities());
    showToast(getTranslation(language, 'feedbackSubmitted'));
  };

  const handleUpdateExpertReview = (id: string, updates: Partial<ExpertReview>) => {
    storageService.updateExpertReview(id, updates);
    setExpertReviews(storageService.getExpertReviews());
    setActivities(storageService.getFieldActivities());
    showToast('Expert recommendation submitted successfully!');
  };

  const handleLoadDemoData = () => {
    storageService.resetToDemoData();
    setFields(storageService.getFields());
    setActiveFieldId(storageService.getActiveFieldId());
    setCrops(storageService.getCrops());
    setSoilTests(storageService.getSoilTests());
    setScanResults(storageService.getScanResults());
    setActivities(storageService.getFieldActivities());
    setExpertReviews(storageService.getExpertReviews());
    showToast(getTranslation(language, 'demoDataLoaded'));
  };

  const handleResetData = () => {
    handleLoadDemoData();
  };

  // Render Landing Page if currentView === 'landing'
  if (currentView === 'landing') {
    return (
      <LandingView
        language={language}
        onLanguageChange={handleLanguageChange}
        onOpenDashboard={() => setCurrentView('dashboard')}
        onTryDemo={() => {
          handleLoadDemoData();
          setCurrentView('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFDF9] flex flex-col">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-agri-dark text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-agri-primary/30 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        fields={fields}
        activeFieldId={activeFieldId}
        onSelectField={handleSelectField}
        onOpenAddField={() => setIsAddFieldOpen(true)}
        isOnline={isOnline}
        queuedCount={syncQueue.filter((i) => i.status === 'pending').length}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onNavigateLanding={() => setCurrentView('landing')}
      />

      {/* Offline Status & Queue Alert Banner */}
      <OfflineBanner
        language={language}
        isOnline={isOnline}
        queuedCount={syncQueue.filter((i) => i.status === 'pending').length}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Body Layout: Sidebar + Canvas */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          language={language}
          currentTab={currentView}
          onSelectTab={setCurrentView}
          onOpenAddField={() => setIsAddFieldOpen(true)}
          user={user}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-24 md:pb-8">
          {currentView === 'dashboard' && (
            <DashboardView
              language={language}
              user={user}
              fields={fields}
              activeField={activeField}
              crop={activeCrop}
              soilTest={activeSoilTest}
              recentScan={recentScanForField}
              recentActivities={activities}
              weather={weather}
              irrigationRec={irrigationRec}
              onNavigate={setCurrentView}
              onOpenAddField={() => setIsAddFieldOpen(true)}
              onOpenAddCrop={() => setIsAddCropOpen(true)}
              onOpenSoilModal={() => setIsSoilModalOpen(true)}
              onRefreshWeather={loadWeather}
              weatherLoading={weatherLoading}
              onSelectField={handleSelectField}
              onLogIrrigation={handleLogIrrigation}
              onLanguageChange={handleLanguageChange}
              weatherError={simulateWeatherFail}
            />
          )}

          {/* Fallback empty state if no active field is configured */}
          {!activeField && ['scan', 'water', 'fertilizer', 'timeline'].includes(currentView) && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-agri-light/60 text-agri-primary flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-agri-dark mb-2">
                {language === 'hi' ? 'कोई सक्रिय खेत नहीं मिला' : language === 'ta' ? 'செயலில் உள்ள நிலம் இல்லை' : 'No Active Field Found'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {language === 'hi' 
                  ? 'इस सुविधा का उपयोग करने के लिए कृपया पहले एक खेत जोड़ें।'
                  : language === 'ta'
                  ? 'இந்த அம்சத்தைப் பயன்படுத்த முதலில் ஒரு நிலத்தைச் சேர்க்கவும்.'
                  : 'Please add or select a field to access this feature.'}
              </p>
              <button
                onClick={() => setIsAddFieldOpen(true)}
                className="px-6 py-3 rounded-xl bg-agri-primary text-white font-semibold text-sm hover:bg-agri-primary/90 transition-all shadow-md"
              >
                {language === 'hi' ? '+ नया खेत जोड़ें' : language === 'ta' ? '+ புதிய நிலம்' : '+ Add New Field'}
              </button>
            </div>
          )}

          {currentView === 'scan' && activeField && (
            <ScanView
              language={language}
              activeField={activeField}
              crop={activeCrop}
              onScanCompleted={handleScanCompleted}
            />
          )}

          {currentView === 'scan_result' && activeScanResult && (
            <ScanResultView
              language={language}
              result={activeScanResult}
              onSaveToTimeline={handleSaveScanToTimeline}
              onAskExpert={handleAskExpert}
              onScanAnother={() => setCurrentView('scan')}
              onGoToTimeline={() => setCurrentView('timeline')}
            />
          )}

          {currentView === 'scan_result' && !activeScanResult && (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-agri-dark mb-2">
                {language === 'hi' ? 'कोई हालिया स्कैन उपलब्ध नहीं' : language === 'ta' ? 'சமீபத்திய ஸ்கேன் முடிவுகள் இல்லை' : 'No Recent Scan Available'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {language === 'hi'
                  ? 'फसल की बीमारी या स्वास्थ्य जांचने के लिए एक पत्ती की फोटो लें।'
                  : language === 'ta'
                  ? 'பயிர் நோயைக் கண்டறிய இலை புகைப்படத்தை ஸ்கேன் செய்யவும்.'
                  : 'Take or upload a leaf photo to diagnose crop health and diseases.'}
              </p>
              <button
                onClick={() => setCurrentView('scan')}
                className="px-6 py-3 rounded-xl bg-agri-primary text-white font-semibold text-sm hover:bg-agri-primary/90 transition-all shadow-md"
              >
                {language === 'hi' ? 'स्कैन शुरू करें' : language === 'ta' ? 'ஸ்கேன் தொடங்குக' : 'Start a Scan'}
              </button>
            </div>
          )}

          {currentView === 'water' && activeField && (
            <WaterView
              language={language}
              fields={fields}
              activeField={activeField}
              crop={activeCrop}
              weather={weather}
              onLogIrrigation={handleLogIrrigation}
              onSelectField={handleSelectField}
            />
          )}

          {currentView === 'fertilizer' && activeField && (
            <FertilizerView
              language={language}
              fields={fields}
              activeField={activeField}
              crop={activeCrop}
              soilTest={activeSoilTest}
              isOnline={isOnline}
              onOpenSoilModal={() => setIsSoilModalOpen(true)}
              onSelectField={handleSelectField}
            />
          )}

          {currentView === 'timeline' && activeField && (
            <TimelineView
              language={language}
              fields={fields}
              activeField={activeField}
              activities={activities}
              onToggleComplete={handleToggleActivity}
              onSubmitFeedback={handleActivityFeedback}
              onSelectField={handleSelectField}
            />
          )}

          {currentView === 'expert' && (
            <ExpertView
              language={language}
              reviews={expertReviews}
              onUpdateReview={handleUpdateExpertReview}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              language={language}
              onLanguageChange={handleLanguageChange}
              user={user}
              onUpdateUser={(up) => {
                const updated = storageService.updateUser(up);
                setUser(updated);
              }}
              onLoadDemoData={handleLoadDemoData}
              onResetData={handleResetData}
              simulateWeatherFail={simulateWeatherFail}
              onToggleSimulateWeather={handleToggleSimulateWeather}
              simulateLowConfidence={simulateLowConfidence}
              onToggleSimulateLowConfidence={handleToggleSimulateLowConfidence}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        language={language}
        currentTab={currentView}
        onSelectTab={setCurrentView}
      />

      {/* Modals */}
      <ModalAddField
        language={language}
        isOpen={isAddFieldOpen}
        onClose={() => setIsAddFieldOpen(false)}
        onSaveField={handleCreateField}
      />

      <ModalAddCrop
        language={language}
        isOpen={isAddCropOpen}
        onClose={() => setIsAddCropOpen(false)}
        fields={fields}
        activeFieldId={activeFieldId}
        onSaveCrop={handleSaveCrop}
      />

      <ModalSoilTest
        language={language}
        isOpen={isSoilModalOpen}
        onClose={() => setIsSoilModalOpen(false)}
        fields={fields}
        activeFieldId={activeFieldId}
        onSaveSoilTest={handleSaveSoilTest}
      />

      {/* Offline Sync Status & Queue Modal */}
      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        language={language}
        isOnline={isOnline}
        queue={syncQueue}
        isSyncing={isSyncing}
        onSyncNow={handleSyncNow}
        onClearSynced={handleClearSynced}
      />
    </div>
  );
}
