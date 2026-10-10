import http from 'http';
import { Field, Crop, SoilTest, WeatherData } from '../src/types';

// Polyfill window and localStorage for headless Node environment
const mockStorage: Record<string, string> = {};
(global as any).window = global;
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

console.log('====================================================');
console.log(' KisanSense AI Comprehensive QA & Journey Verification');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details: string = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failCount++;
  }
}

async function fetchUrl(url: string, options: any = {}): Promise<{ statusCode: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 500,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  // -----------------------------------------------------------
  // 1. HTTP Endpoint & Route Testing
  // -----------------------------------------------------------
  console.log('▶ [1] Network & HTTP Endpoint Verification');
  try {
    const homeRes = await fetchUrl('http://localhost:3000/');
    assert(homeRes.statusCode === 200, 'Landing Page Route (GET /)', `HTTP ${homeRes.statusCode}`);
    assert(homeRes.body.includes('<!DOCTYPE html>') || homeRes.body.includes('html'), 'Landing Page returns valid HTML page document');

    // Weather API Live
    const weatherRes = await fetchUrl('http://localhost:3000/api/weather?lat=20.7453&lon=78.6022');
    assert(weatherRes.statusCode === 200, 'Live Weather API (GET /api/weather)', `HTTP ${weatherRes.statusCode}`);
    const weatherData = JSON.parse(weatherRes.body);
    const temp = weatherData.current?.temperature_2m ?? weatherData.temperature;
    const et0 = (weatherData.hourly?.et0_fao_evapotranspiration?.[0]) ?? weatherData.et0;
    assert(typeof temp === 'number' && temp > -50, `Weather API returns valid temperature (${temp}°C)`);
    assert(typeof et0 === 'number' && et0 >= 0, `Weather API returns evapotranspiration ET0 (${et0} mm/day)`);

    // Weather API Simulated Failure Mode
    const weatherFailRes = await fetchUrl('http://localhost:3000/api/weather?simulate_fail=true');
    assert(weatherFailRes.statusCode === 503, 'Weather API Simulates Network/Provider Failure with HTTP 503', `HTTP ${weatherFailRes.statusCode}`);

    // Scan API Health Status
    const scanGetRes = await fetchUrl('http://localhost:3000/api/scan');
    assert(scanGetRes.statusCode === 200, 'Scan API Status (GET /api/scan)', `HTTP ${scanGetRes.statusCode}`);

    // Scan API Simulated Error Mode (Strict)
    const scanErrRes = await fetchUrl('http://localhost:3000/api/scan?strict=true&simulate_error=timeout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strictErrors: true, simulateError: 'timeout' }),
    });
    assert(scanErrRes.statusCode === 504 || scanErrRes.statusCode >= 500, 'Scan API Simulates Timeout with HTTP 504/5xx', `HTTP ${scanErrRes.statusCode}`);

    // Scan API Valid Mock Diagnosis Journey
    const dummyBase64 = 'data:image/jpeg;base64,' + Buffer.from('leaf-pixel-data').toString('base64');
    const scanPostRes = await fetchUrl('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cropName: 'Tomato',
        imageDataUrl: dummyBase64,
        qualityScore: 85,
      }),
    });
    assert(scanPostRes.statusCode === 200, 'Scan API Analyzes Leaf Image with HTTP 200', `HTTP ${scanPostRes.statusCode}`);
    const scanData = JSON.parse(scanPostRes.body);
    assert(!!scanData.result_category && typeof scanData.confidence === 'number', `Scan API Result: Category=${scanData.result_category}, Confidence=${scanData.confidence}%`);
    assert(Array.isArray(scanData.observed_symptoms) && scanData.observed_symptoms.length > 0, 'Scan API returns diagnostic observed symptoms');
    assert(!!scanData.recommended_next_step, 'Scan API returns actionable agronomist next step');

    // Client-side image analysis & low confidence triage journey
    const { analyzeCropImage, setForceSimulateLowConfidence } = await import('../src/services/imageAnalysisService');
    const normalScan = await analyzeCropImage({
      fieldId: 'f-qa-1',
      cropName: 'Tomato',
      imageDataUrl: dummyBase64,
      imageType: 'leaf',
      imageQualityScore: 85,
    });
    assert(normalScan.confidence >= 50, `Normal triage confidence: ${normalScan.confidence}%`);

    setForceSimulateLowConfidence(true);
    const lowConfScan = await analyzeCropImage({
      fieldId: 'f-qa-1',
      cropName: 'Cotton',
      imageDataUrl: dummyBase64,
      imageType: 'leaf',
      imageQualityScore: 85,
    });
    setForceSimulateLowConfidence(false); // Reset
    assert(lowConfScan.confidence < 50 && lowConfScan.confidence_level === 'low', `Low-Confidence Mode correctly flags uncertain diagnosis (${lowConfScan.confidence}% < 50%, level=${lowConfScan.confidence_level})`);

  } catch (err: any) {
    if (err.code === 'ECONNREFUSED') {
      console.log('  ℹ️  Dev server offline on port 3000 (start with `npm run dev` for live HTTP verification). Skipped live server probe.');
    } else {
      assert(false, 'Network & HTTP Endpoints accessible', err.message);
    }
  }

  // -----------------------------------------------------------
  // 2. Hindi & Multilingual Translations Integrity
  // -----------------------------------------------------------
  console.log('\n▶ [2] Multilingual System & Hindi Language Verification');
  const { translations, getTranslation } = await import('../src/i18n/translations');
  const enKeys = Object.keys(translations.en);
  const hiKeys = Object.keys(translations.hi);
  const taKeys = Object.keys(translations.ta);

  assert(enKeys.length >= 400, `English dictionary loaded with ${enKeys.length} keys`);
  assert(hiKeys.length === enKeys.length, `Hindi dictionary 100% key parity (${hiKeys.length}/${enKeys.length} keys)`);
  assert(taKeys.length === enKeys.length, `Tamil dictionary 100% key parity (${taKeys.length}/${enKeys.length} keys)`);

  // Verify critical Hindi UI translations
  assert(getTranslation('hi', 'appName') === 'किसानसेंस AI', 'Hindi appName matches "किसानसेंस AI"');
  assert(getTranslation('hi', 'navDashboard') === 'डैशबोर्ड', 'Hindi navigation for Dashboard is "डैशबोर्ड"');
  assert(getTranslation('hi', 'navScan') === 'फसल स्कैन', 'Hindi navigation for Scan is "फसल स्कैन"');
  assert(getTranslation('hi', 'navWater') === 'सिंचाई योजना', 'Hindi navigation for Water is "सिंचाई योजना"');
  assert(getTranslation('hi', 'navFertilizer') === 'मृदा व उर्वरक', 'Hindi navigation for Fertilizer is "मृदा व उर्वरक"');
  assert(getTranslation('hi', 'navTimeline') === 'खेत इतिहास', 'Hindi navigation for Timeline is "खेत इतिहास"');
  assert(getTranslation('hi', 'addField') === 'नया खेत जोड़ें', 'Hindi Add Field label is "नया खेत जोड़ें"');
  assert(getTranslation('hi', 'scanLeaf') === 'पत्ती स्कैन करें', 'Hindi Scan Leaf label is "पत्ती स्कैन करें"');
  assert(getTranslation('hi', 'planWater') === 'सिंचाई की योजना बनाएं', 'Hindi Plan Water label is "सिंचाई की योजना बनाएं"');
  assert(getTranslation('hi', 'greetingMorning') === 'नमस्ते', 'Hindi greeting is "नमस्ते"');
  assert(getTranslation('hi', 'demoModeActive') === 'डेमो मोड सक्रिय', 'Hindi Demo Mode badge is "डेमो मोड सक्रिय"');

  // Verify no empty string keys in Hindi
  const emptyHindiKeys = hiKeys.filter((k) => !(translations.hi as any)[k]);
  assert(emptyHindiKeys.length === 0, `All ${hiKeys.length} Hindi translations are non-empty strings`);

  // -----------------------------------------------------------
  // 3. Irrigation Calculator & Water Journey Logic
  // -----------------------------------------------------------
  console.log('\n▶ [3] Water Calculation Journey & Agronomic Logic');
  const { calculateIrrigationRecommendation } = await import('../src/services/irrigationService');
  const { calculateIrrigation, validateIrrigationInputs } = await import('../src/services/irrigationCalculator');
  
  const testField: Field = {
    id: 'f-qa-1',
    user_id: 'u-1',
    name: 'North Acre',
    location_name: 'Wardha North',
    area: 2.5,
    area_unit: 'acre',
    soil_type: 'clay',
    irrigation_method: 'drip',
    latitude: 20.74,
    longitude: 78.60,
    created_at: new Date().toISOString(),
  };

  const testCrop: Crop = {
    id: 'c-qa-1',
    field_id: 'f-qa-1',
    crop_name: 'Tomato',
    sowing_date: '2026-08-01',
    growth_stage: 'flowering',
  };

  const testWeather: WeatherData = {
    latitude: 20.74,
    longitude: 78.60,
    temperature: 32,
    relative_humidity: 45,
    rain_probability: 10,
    rain_amount: 0,
    wind_speed: 14,
    et0: 5.2,
    is_demo: false,
    timestamp: new Date().toISOString(),
  };

  const recEn = calculateIrrigationRecommendation(testField, testCrop, testWeather);
  assert(recEn.water_volume_litres > 0, `Calculated irrigation requirement: ${recEn.water_volume_litres.toLocaleString()} Litres`);
  assert(recEn.tips.length > 0, 'Includes practical water saving tips');
  assert(!!recEn.explanation, 'Includes transparent agronomic explanation');

  // Deep calculation engine test with steps and Hindi localization
  const deepCalc = calculateIrrigation({
    crop: 'Tomato',
    growth_stage: 'flowering',
    et0: 5.2,
    kc: 1.15,
    area: 2.5,
    area_unit: 'acre',
    irrigation_efficiency: 0.90,
    pump_flow_rate: 3000,
    recent_rainfall: 0,
    irrigation_method: 'drip',
  }, 'hi');
  assert(deepCalc.explanation.steps.length >= 4, `Multi-step agronomic formula verified (${deepCalc.explanation.steps.length} steps)`);
  assert(deepCalc.explanation.steps[0].title.includes('मौसम') || deepCalc.explanation.summary.includes('लीटर'), 'Irrigation calculation step explanations localized to Hindi');

  // Rain forecast warning test
  const rainyWeather: WeatherData = { ...testWeather, rain_probability: 85, rain_amount: 15.0 };
  const recRain = calculateIrrigationRecommendation(testField, testCrop, rainyWeather);
  assert(!!recRain.rain_forecast_warning, `Rain forecast triggers rain warning: "${recRain.rain_forecast_warning?.slice(0, 45)}..."`);

  // Validation boundary test (negative area)
  const validationErrors = validateIrrigationInputs({ area: -5, et0: 5, kc: 1, pump_flow_rate: 1000 }, 'en');
  assert(!!validationErrors.area, 'Negative field area triggers validation error');

  // -----------------------------------------------------------
  // 4. Soil Test & Fertilizer Guidance Journey
  // -----------------------------------------------------------
  console.log('\n▶ [4] Soil Test & Fertilizer Guidance Journey');
  const { generateFertilizerRecommendation } = await import('../src/services/fertilizerService');

  const testSoilDeficient: SoilTest = {
    id: 'st-qa-1',
    field_id: 'f-qa-1',
    test_date: '2026-09-01',
    nitrogen: 120, // Low (< 280 kg/ha)
    phosphorus: 12, // Low (< 14 kg/ha)
    potassium: 110, // Low (< 120 kg/ha)
    ph: 6.8,
    organic_carbon: 0.45,
  };

  const fertRec = generateFertilizerRecommendation(testField, testCrop, testSoilDeficient);
  assert(fertRec.has_soil_test === true, 'Fertilizer guidance links to laboratory soil test');
  assert(fertRec.nutrient_status === 'deficient', `Correctly flags nutrient status as "${fertRec.nutrient_status}"`);
  assert(fertRec.recommended_nutrients.nitrogen_kg_ha! > 0, `Recommends compensatory Nitrogen: ${fertRec.recommended_nutrients.nitrogen_kg_ha} kg/ha`);
  assert(fertRec.split_guidance.length > 0, 'Provides split dosing schedule across vegetative and flowering stages');
  assert(!!fertRec.safety_warning, 'Includes explicit agronomic safety warning against chemical over-application');

  // -----------------------------------------------------------
  // 5. Offline Queue & Data Storage Integrity
  // -----------------------------------------------------------
  console.log('\n▶ [5] Data Persistence & Offline Sync Engine');
  const { storageService } = await import('../src/services/storageService');

  // Load demo data
  storageService.resetToDemoData();
  const loadedFields = storageService.getFields();
  const loadedCrops = storageService.getCrops();
  const loadedActivities = storageService.getFieldActivities();
  const loadedScans = storageService.getScanResults();

  assert(loadedFields.length > 0, `Demo Data: ${loadedFields.length} fields seeded`);
  assert(loadedCrops.length > 0, `Demo Data: ${loadedCrops.length} crops seeded`);
  assert(loadedActivities.length > 0, `Demo Data: ${loadedActivities.length} timeline activities seeded`);
  assert(loadedScans.length > 0, `Demo Data: ${loadedScans.length} diagnostic scans seeded`);

  // Language persistence test for Hindi
  storageService.setLanguage('hi');
  assert(storageService.getLanguage() === 'hi', 'Language setting persisted as Hindi ("hi")');

  // Create field journey
  const createdField = storageService.createField({
    user_id: 'u-1',
    name: 'Wardha Organic Block',
    area: 4.5,
    area_unit: 'acre',
    soil_type: 'clay',
    irrigation_method: 'drip',
    latitude: 20.82,
    longitude: 78.68,
    location_name: 'Wardha East',
  });
  assert(!!createdField.id && !!storageService.getFields().find((f) => f.id === createdField.id), 'Field creation persisted successfully');

  // Add crop journey
  const createdCrop = storageService.createCrop({
    field_id: createdField.id,
    crop_name: 'Cotton',
    variety: 'BT Cotton Super',
    sowing_date: '2026-07-15',
    growth_stage: 'vegetative',
    expected_harvest_date: '2026-12-15',
  });
  assert(!!createdCrop.id && !!storageService.getCrops().find((c) => c.field_id === createdField.id), 'Crop creation and assignment persisted successfully');

  // Recommendation offline cache
  storageService.saveLatestRecommendations({ irrigationRec: recEn, fertilizerRec: fertRec });
  const cachedRecs = storageService.getLatestRecommendations();
  assert(!!cachedRecs?.irrigationRec && !!cachedRecs?.fertilizerRec, 'Recommendations cached for offline retrieval');

  // Offline queue test
  storageService.clearSyncQueue();
  const queuedAction = storageService.enqueueSyncAction({
    action_type: 'create_field',
    title: 'Offline Field',
    description: 'Created during offline mode',
    payload: { field: createdField, crop: createdCrop },
  });
  assert(storageService.getSyncQueue().length === 1, 'Sync item enqueued during offline mode');
  assert(queuedAction.status === 'pending', 'Sync item marked as pending');

  // Process sync queue
  const syncResult = await storageService.processSyncQueue();
  assert(syncResult.synced === 1, 'Sync engine processed pending queue successfully');
  assert(storageService.getSyncQueue().length === 0, 'Sync queue cleared after successful sync');

  // -----------------------------------------------------------
  // 6. Timeline and Activity Feedback Journey
  // -----------------------------------------------------------
  console.log('\n▶ [6] Field Timeline & Farmer Feedback Journey');
  const activity = storageService.createFieldActivity({
    field_id: createdField.id,
    type: 'scan',
    title: 'Leaf Spot Scan',
    description: 'Diagnosed early leaf spot on lower foliage',
    activity_date: new Date().toISOString(),
    completed: false,
  });

  const toggled = storageService.updateFieldActivity(activity.id, { completed: true });
  assert(toggled?.completed === true, 'Timeline task toggled to completed');

  const feedbackRecorded = storageService.updateFieldActivity(activity.id, { farmer_feedback: 'helpful' });
  assert(feedbackRecorded?.farmer_feedback === 'helpful', 'Farmer feedback ("helpful") stored on timeline activity');

  // Verify full saveActivityFeedback with Done/Not Done, notes, and custom date
  const testNote = 'Applied organic extract early morning; lesions dried out.';
  const testDate = '2026-10-10T08:30:00.000Z';
  const fullFeedback = storageService.saveActivityFeedback(activity.id, {
    completed: false,
    farmer_feedback: 'resolved',
    notes: testNote,
    activity_date: testDate,
  });
  assert(fullFeedback?.completed === false, 'Recommendation marked as Not done via saveActivityFeedback');
  assert(fullFeedback?.farmer_feedback === 'resolved', 'Outcome feedback saved as "resolved"');
  assert(fullFeedback?.notes === testNote, 'Optional farmer note saved successfully');
  assert(fullFeedback?.activity_date === testDate, 'Activity date updated and preserved');

  // Verify non-proof agronomic safety disclaimer rule
  const feedbackNoticeEn = getTranslation('en', 'feedbackDisclaimerNotice');
  const feedbackNoticeHi = getTranslation('hi', 'feedbackDisclaimerNotice');
  assert(feedbackNoticeEn.toLowerCase().includes('subjective') && feedbackNoticeEn.toLowerCase().includes('not constitute scientific'), 'English feedback disclaimer ensures feedback is not shown as scientific proof');
  assert(feedbackNoticeHi.includes('व्यक्तिगत') && (feedbackNoticeHi.includes('वैज्ञानिक') || feedbackNoticeHi.includes('प्रमाण नहीं')), 'Hindi feedback disclaimer ensures feedback is subjective personal experience');

  // -----------------------------------------------------------
  // Summary
  // -----------------------------------------------------------
  console.log('\n====================================================');
  console.log(` Test Run Complete: ${passCount} Passed, ${failCount} Failed`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
