import http from 'http';

console.log('====================================================');
console.log(' KisanSense AI Comprehensive QA & Journey Verification');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failCount++;
  }
}

async function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
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
    assert(homeRes.body.includes('KisanSense AI') || homeRes.body.includes('html'), 'Landing Page contains HTML and App title');

    // Weather API Live
    const weatherRes = await fetchUrl('http://localhost:3000/api/weather?lat=20.74&lon=78.60');
    assert(weatherRes.statusCode === 200, 'Live Weather API (GET /api/weather)', `HTTP ${weatherRes.statusCode}`);
    const weatherData = JSON.parse(weatherRes.body);
    assert(typeof weatherData.temperature === 'number' && weatherData.temperature > -50, 'Weather API returns valid temperature');
    assert(typeof weatherData.et0 === 'number', 'Weather API returns evapotranspiration (ET0)');

    // Weather API Simulated Failure
    const weatherFailRes = await fetchUrl('http://localhost:3000/api/weather?simulate_fail=true');
    assert(weatherFailRes.statusCode === 503, 'Weather API Resilient Fallback (GET /api/weather?simulate_fail=true)', `HTTP ${weatherFailRes.statusCode}`);

    // Scan API Health
    const scanGetRes = await fetchUrl('http://localhost:3000/api/scan');
    assert(scanGetRes.statusCode === 200, 'Scan API Status (GET /api/scan)', `HTTP ${scanGetRes.statusCode}`);

    // Scan API Missing Body Handling
    const scanBadRes = await fetchUrl('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(scanBadRes.statusCode === 400, 'Scan API Rejects Empty Payload with HTTP 400', `HTTP ${scanBadRes.statusCode}`);

    // Scan API Valid Mock Diagnosis
    const dummyBase64 = 'data:image/jpeg;base64,' + Buffer.from('fake-plant-leaf-pixels').toString('base64');
    const scanPostRes = await fetchUrl('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: dummyBase64,
        crop_hint: 'Tomato',
        simulate_low_confidence: false,
      }),
    });
    assert(scanPostRes.statusCode === 200, 'Scan API Analyzes Leaf Image with HTTP 200', `HTTP ${scanPostRes.statusCode}`);
    const scanData = JSON.parse(scanPostRes.body);
    assert(scanData.result_category && typeof scanData.confidence === 'number', 'Scan API returns category & confidence score');
    assert(Array.isArray(scanData.symptoms) && Array.isArray(scanData.immediate_actions), 'Scan API returns actionable agronomist steps');

  } catch (err) {
    assert(false, 'Network & HTTP Endpoints accessible', err.message);
  }

  // -----------------------------------------------------------
  // 2. Hindi & Multilingual Translations Integrity
  // -----------------------------------------------------------
  console.log('\n▶ [2] Multilingual System & Hindi Language Verification');
  const { translations, getTranslation } = await import('../src/i18n/translations.ts');
  const enKeys = Object.keys(translations.en);
  const hiKeys = Object.keys(translations.hi);
  const taKeys = Object.keys(translations.ta);

  assert(enKeys.length > 200, `English dictionary loaded with ${enKeys.length} keys`);
  assert(hiKeys.length === enKeys.length, `Hindi dictionary parity (${hiKeys.length}/${enKeys.length} keys)`);
  assert(taKeys.length === enKeys.length, `Tamil dictionary parity (${taKeys.length}/${enKeys.length} keys)`);

  // Verify critical Hindi terms
  assert(getTranslation('hi', 'appName') === 'किसानसेंस एआई', 'Hindi appName matches किसानसेंस एआई');
  assert(getTranslation('hi', 'cropTomato') === 'टमाटर', 'Hindi crop name for Tomato is टमाटर');
  assert(getTranslation('hi', 'cropWheat') === 'गेहूं', 'Hindi crop name for Wheat is गेहूं');
  assert(getTranslation('hi', 'navScan') === 'स्कैन', 'Hindi navigation for Scan is स्कैन');
  assert(getTranslation('hi', 'addCropTitle') === 'नई फसल जोड़ें', 'Hindi Add Crop title is नई फसल जोड़ें');
  assert(getTranslation('hi', 'irrigationAdviceTitle') === 'स्मार्ट सिंचाई मार्गदर्शन', 'Hindi Smart Irrigation title is accurate');

  // Verify missing key fallback
  assert(getTranslation('hi', 'non_existent_key_xyz') === 'non_existent_key_xyz', 'Fallback returns key string cleanly');

  // -----------------------------------------------------------
  // 3. Irrigation Calculator & Water Journey Logic
  // -----------------------------------------------------------
  console.log('\n▶ [3] Water Calculation Journey & Agronomic Logic');
  const { calculateIrrigationRecommendation } = await import('../src/services/irrigationService.ts');
  
  const testField = {
    id: 'f-1',
    name: 'North Acre',
    area: 2.5,
    area_unit: 'Acre',
    soil_type: 'Clay',
    irrigation_method: 'Drip',
    latitude: 20.74,
    longitude: 78.60,
    created_at: new Date().toISOString(),
  };

  const testCrop = {
    id: 'c-1',
    field_id: 'f-1',
    crop_name: 'Tomato',
    sowing_date: '2026-08-01',
    growth_stage: 'flowering',
  };

  const testWeather = {
    latitude: 20.74,
    longitude: 78.60,
    temperature: 32,
    relative_humidity: 45,
    rain_probability: 10,
    rain_amount: 0,
    wind_speed: 14,
    et0: 5.2,
    timestamp: new Date().toISOString(),
  };

  const recEn = calculateIrrigationRecommendation(testField, testCrop, testWeather, 'en');
  assert(recEn.volume_litres > 0, `Calculated irrigation requirement: ${recEn.volume_litres} Litres`);
  assert(recEn.calculation_steps.length >= 4, 'Includes multi-step transparent agronomic calculation');
  assert(recEn.validation_errors.length === 0, 'No validation errors on standard inputs');

  // Verify Hindi localization of calculation steps
  const recHi = calculateIrrigationRecommendation(testField, testCrop, testWeather, 'hi');
  assert(recHi.summary.includes('लीटर') || recHi.calculation_steps[0].step_name.includes('मौसम'), 'Irrigation recommendation localized to Hindi');

  // Extreme condition test: High rain forecast
  const rainyWeather = { ...testWeather, rain_probability: 85, rain_amount: 35.0 };
  const recRain = calculateIrrigationRecommendation(testField, testCrop, rainyWeather, 'en');
  assert(recRain.urgency === 'skip' || recRain.urgency === 'low', `High rain forecast suggests skipping irrigation (Urgency: ${recRain.urgency})`);

  // -----------------------------------------------------------
  // 4. Soil Test & Fertilizer Calculation Journey
  // -----------------------------------------------------------
  console.log('\n▶ [4] Soil Test & Fertilizer Guidance Journey');
  const { calculateFertilizerRecommendation } = await import('../src/services/fertilizerService.ts');

  const testSoilDeficient = {
    id: 'st-1',
    field_id: 'f-1',
    test_date: '2026-09-01',
    nitrogen: 120, // Deficient
    phosphorus: 12, // Deficient
    potassium: 110, // Deficient
    ph: 6.8,
    organic_carbon: 0.45,
  };

  const fertRec = calculateFertilizerRecommendation(testField, testCrop, testSoilDeficient, 'en');
  assert(fertRec.organic_option.length > 0, 'Generates organic fertilizer guidance (e.g. FYM / Vermicompost)');
  assert(fertRec.chemical_option.length > 0, 'Generates balanced chemical guidance (Urea / DAP / MOP)');
  assert(fertRec.split_doses.length > 0, 'Generates growth-stage timing schedule for split doses');
  assert(fertRec.soil_status.nitrogen_status === 'low', 'Correctly flags low Nitrogen from soil lab test');

  // -----------------------------------------------------------
  // 5. Offline Queue & Data Storage Integrity
  // -----------------------------------------------------------
  console.log('\n▶ [5] Data Persistence & Offline Sync Engine');
  const { storageService } = await import('../src/services/storageService.ts');

  // Clear and test demo data loading
  storageService.clearAll();
  assert(storageService.getFields().length === 0, 'Storage starts clean after clearAll()');

  // Load demo data
  storageService.loadDemoData();
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
  assert(storageService.getLanguage() === 'hi', 'Language setting persisted as Hindi');

  // Create field journey
  const createdField = storageService.createField({
    name: 'South Cotton Block',
    area: 3.0,
    area_unit: 'Acre',
    soil_type: 'Black Cotton',
    irrigation_method: 'Flood',
    latitude: 20.80,
    longitude: 78.65,
    location_name: 'Wardha South',
  });
  assert(createdField.id && storageService.getFields().find(f => f.id === createdField.id), 'Field creation persisted successfully');

  // Add crop journey
  const createdCrop = storageService.createCrop({
    field_id: createdField.id,
    crop_name: 'Cotton',
    variety: 'BT Cotton Super',
    sowing_date: '2026-07-15',
    growth_stage: 'vegetative',
    expected_harvest: '2026-12-15',
  });
  assert(createdCrop.id && storageService.getCrops().find(c => c.field_id === createdField.id), 'Crop creation and assignment persisted successfully');

  // Offline queue test
  storageService.clearSyncQueue();
  const queuedAction = storageService.enqueueSyncAction({
    action_type: 'create_field',
    title: 'Offline Field',
    description: 'Created during low connectivity',
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
    description: 'Diagnosed early leaf spot',
    activity_date: new Date().toISOString(),
    completed: false,
  });

  const toggled = storageService.toggleActivityCompleted(activity.id);
  assert(toggled?.completed === true, 'Timeline task toggled to completed');

  const feedbackRecorded = storageService.submitFarmerFeedback(activity.id, 'helpful');
  assert(feedbackRecorded?.farmer_feedback === 'helpful', 'Farmer feedback (helpful) stored on timeline');

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
