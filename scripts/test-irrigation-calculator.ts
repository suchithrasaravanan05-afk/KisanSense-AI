import {
  calculateIrrigation,
  validateIrrigationInputs,
  convertAreaToSquareMeters,
  AREA_CONVERSIONS,
  METHOD_EFFICIENCIES,
  PRESET_TEST_CASES,
  CROP_KC_TABLE,
  ESTIMATE_DISCLAIMER,
  IrrigationCalculatorInputs,
} from '../src/services/irrigationCalculator';

interface TestRecord {
  section: string;
  name: string;
  passed: boolean;
  message?: string;
}

const testResults: TestRecord[] = [];

function assert(condition: boolean, section: string, name: string, failureDetails?: string) {
  if (condition) {
    testResults.push({ section, name, passed: true });
    console.log(`  ✓ [${section}] ${name}`);
  } else {
    testResults.push({ section, name, passed: false, message: failureDetails });
    console.error(`  ✗ FAIL [${section}] ${name}: ${failureDetails || 'Assertion failed'}`);
  }
}

function runAllTests() {
  console.log('\n================================================================');
  console.log('🧪 KisanSense AI — Irrigation Calculator Verification Suite');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // SECTION 1: Area Conversion Tests (Acres, Hectares -> Square Metres)
  // -------------------------------------------------------------------------
  console.log('📋 Section 1: Area Conversion to Square Metres (m²)');
  {
    const oneAcreInM2 = convertAreaToSquareMeters(1, 'acre');
    assert(Math.abs(oneAcreInM2 - 4046.86) < 0.001, 'Area Conversion', '1 Acre converts to 4046.86 m²', `Got ${oneAcreInM2}`);

    const twoPointFiveAcres = convertAreaToSquareMeters(2.5, 'acre');
    assert(Math.abs(twoPointFiveAcres - (2.5 * 4046.86)) < 0.01, 'Area Conversion', '2.5 Acres converts to 10117.15 m²', `Got ${twoPointFiveAcres}`);

    const oneHectareInM2 = convertAreaToSquareMeters(1, 'hectare');
    assert(oneHectareInM2 === 10000, 'Area Conversion', '1 Hectare converts to 10,000 m²', `Got ${oneHectareInM2}`);

    const threeHectaresInM2 = convertAreaToSquareMeters(3, 'hectare');
    assert(threeHectaresInM2 === 30000, 'Area Conversion', '3 Hectares converts to 30,000 m²', `Got ${threeHectaresInM2}`);

    const m2Identity = convertAreaToSquareMeters(500, 'm2');
    assert(m2Identity === 500, 'Area Conversion', 'm² unit returns identity (500 m²)', `Got ${m2Identity}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 2: Calculation Engine Precision (ETc, Volume, Pump Run-Time)
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 2: Mathematical Precision & Formulas (ETc, Volume, Run Time)');
  {
    // ETc = ET0 × Kc
    // water volume = ETc × area_m2 ÷ efficiency
    // irrigation time = water volume ÷ flow rate
    const inputs: IrrigationCalculatorInputs = {
      crop: 'Tomato',
      growth_stage: 'flowering',
      et0: 5.0, // mm
      kc: 1.15,
      area: 1.0,
      area_unit: 'acre',
      irrigation_efficiency: 0.90, // Drip 90%
      pump_flow_rate: 3000, // L/hr
      recent_rainfall: 0.0,
      irrigation_method: 'drip',
    };

    const res = calculateIrrigation(inputs);

    // Expected ETc = 5.0 * 1.15 = 5.75 mm
    assert(res.calculations.etc_mm === 5.75, 'Formulas', 'ETc = ET0 (5.0) × Kc (1.15) = 5.75 mm', `Got ${res.calculations.etc_mm}`);

    // Expected Area = 4046.86 m²
    assert(res.inputs.area_m2 === 4046.86, 'Formulas', 'Area is converted to 4046.86 m²', `Got ${res.inputs.area_m2}`);

    // Expected Volume = 5.75 * 4046.86 / 0.90 = 25854.9... -> 25855 litres
    const expectedLitres = Math.round((5.75 * 4046.86) / 0.90);
    assert(res.calculations.water_volume_litres === expectedLitres, 'Formulas', `Water Volume = 5.75 × 4046.86 ÷ 0.90 = ${expectedLitres} Litres`, `Got ${res.calculations.water_volume_litres}`);

    // Expected Time = 25855 / 3000 = 8.62 hours
    const expectedHours = Math.round((expectedLitres / 3000) * 100) / 100;
    assert(res.calculations.irrigation_time_hours === expectedHours, 'Formulas', `Irrigation Time = ${expectedLitres} ÷ 3000 = ${expectedHours} Hours`, `Got ${res.calculations.irrigation_time_hours}`);

    // Percentage input handling (e.g. 90% instead of 0.90)
    const resPercent = calculateIrrigation({ ...inputs, irrigation_efficiency: 90 });
    assert(resPercent.inputs.irrigation_efficiency === 0.90, 'Formulas', 'Accepts efficiency as 90 (auto-normalized to 0.90)', `Got ${resPercent.inputs.irrigation_efficiency}`);
    assert(resPercent.calculations.water_volume_litres === expectedLitres, 'Formulas', 'Volume is identical when efficiency passed as percentage', `Got ${resPercent.calculations.water_volume_litres}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 3: Recent Rainfall Deduction & Zero-Demand Condition
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 3: Recent Rainfall Credit & Adjustments');
  {
    // Case A: Partial rainfall (ETc 5.75 mm, Rainfall 2.0 mm -> Net 3.75 mm)
    const resPartial = calculateIrrigation({
      crop: 'Tomato',
      growth_stage: 'flowering',
      et0: 5.0,
      kc: 1.15,
      area: 1.0,
      area_unit: 'acre',
      irrigation_efficiency: 0.90,
      pump_flow_rate: 3000,
      recent_rainfall: 2.0,
      irrigation_method: 'drip',
    });

    assert(resPartial.calculations.net_depth_mm === 3.75, 'Rainfall', 'Net Depth = max(0, 5.75 - 2.0) = 3.75 mm', `Got ${resPartial.calculations.net_depth_mm}`);
    const expectedPartialLitres = Math.round((3.75 * 4046.86) / 0.90);
    assert(resPartial.calculations.water_volume_litres === expectedPartialLitres, 'Rainfall', `Water volume reduced accordingly to ${expectedPartialLitres} L`, `Got ${resPartial.calculations.water_volume_litres}`);

    // Case B: Heavy rainfall exceeding ETc (ETc 5.75 mm, Rainfall 10.0 mm -> Net 0 mm)
    const resExcess = calculateIrrigation({
      crop: 'Tomato',
      growth_stage: 'flowering',
      et0: 5.0,
      kc: 1.15,
      area: 1.0,
      area_unit: 'acre',
      irrigation_efficiency: 0.90,
      pump_flow_rate: 3000,
      recent_rainfall: 10.0,
      irrigation_method: 'drip',
    });

    assert(resExcess.calculations.net_depth_mm === 0, 'Rainfall', 'Net Depth is 0 mm when rainfall exceeds ETc', `Got ${resExcess.calculations.net_depth_mm}`);
    assert(resExcess.calculations.water_volume_litres === 0, 'Rainfall', 'Water Volume is 0 Litres when rainfall covers crop need', `Got ${resExcess.calculations.water_volume_litres}`);
    assert(resExcess.calculations.irrigation_time_hours === 0, 'Rainfall', 'Irrigation time is 0 Hours when rainfall covers crop need', `Got ${resExcess.calculations.irrigation_time_hours}`);
    assert(resExcess.calculations.is_sufficient_rain === true, 'Rainfall', 'is_sufficient_rain flag is true', `Got ${resExcess.calculations.is_sufficient_rain}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 4: Condition 1 — Drip Irrigation
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 4: Condition 1 — Drip Irrigation System (90% Efficiency)');
  {
    const dripConfig = PRESET_TEST_CASES.drip.inputs;
    const res = calculateIrrigation(dripConfig);

    assert(res.is_valid, 'Drip Condition', 'Drip test case passes validation');
    assert(res.inputs.irrigation_efficiency === 0.90, 'Drip Condition', 'Drip efficiency is 0.90 (90%)');
    assert(res.calculations.etc_mm === 5.75, 'Drip Condition', 'ETc is 5.75 mm for Tomato flowering');
    assert(res.calculations.water_volume_litres === 25855, 'Drip Condition', 'Water volume is 25,855 Litres for 1 acre');
    assert(res.calculations.irrigation_time_hours === 8.62, 'Drip Condition', 'Pump run time is 8.62 hours at 3,000 L/hr');
    assert(res.calculations.irrigation_time_formatted === '8h 37m', 'Drip Condition', 'Formatted pump time is 8h 37m', `Got ${res.calculations.irrigation_time_formatted}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 5: Condition 2 — Sprinkler Irrigation
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 5: Condition 2 — Sprinkler Irrigation System (75% Efficiency)');
  {
    const sprinklerConfig = PRESET_TEST_CASES.sprinkler.inputs;
    const res = calculateIrrigation(sprinklerConfig);

    // ETc = 4.0 * 0.80 = 3.20 mm
    // Net depth = 3.20 - 1.0 (recent rain) = 2.20 mm
    // Area = 2 hectares = 20,000 m²
    // Volume = (2.20 * 20000) / 0.75 = 58,666.67 -> 58,667 Litres
    // Pump = 58,667 / 5000 L/hr = 11.73 hours (11h 44m)
    assert(res.is_valid, 'Sprinkler Condition', 'Sprinkler test case passes validation');
    assert(res.inputs.area_m2 === 20000, 'Sprinkler Condition', '2 Hectares converted to 20,000 m²');
    assert(res.calculations.etc_mm === 3.20, 'Sprinkler Condition', 'ETc is 3.20 mm for Wheat vegetative');
    assert(res.calculations.net_depth_mm === 2.20, 'Sprinkler Condition', 'Net depth is 2.20 mm after 1.0 mm rainfall');
    assert(res.calculations.water_volume_litres === 58667, 'Sprinkler Condition', 'Water volume is 58,667 Litres');
    assert(res.calculations.irrigation_time_hours === 11.73, 'Sprinkler Condition', 'Pump run time is 11.73 hours at 5,000 L/hr');
    assert(res.calculations.irrigation_time_formatted === '11h 44m', 'Sprinkler Condition', 'Formatted pump time is 11h 44m', `Got ${res.calculations.irrigation_time_formatted}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 6: Condition 3 — Flood Irrigation
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 6: Condition 3 — Flood / Surface Irrigation (50% Efficiency)');
  {
    const floodConfig = PRESET_TEST_CASES.flood.inputs;
    const res = calculateIrrigation(floodConfig);

    // ETc = 4.8 * 1.25 = 6.00 mm
    // Area = 1.5 acres = 1.5 * 4046.86 = 6070.29 m²
    // Volume = (6.00 * 6070.29) / 0.50 = 72,843.48 -> 72,843 Litres
    // Pump = 72,843 / 4000 = 18.21 hours (18h 13m)
    assert(res.is_valid, 'Flood Condition', 'Flood test case passes validation');
    assert(res.inputs.irrigation_efficiency === 0.50, 'Flood Condition', 'Flood efficiency is 0.50 (50%)');
    assert(res.calculations.etc_mm === 6.00, 'Flood Condition', 'ETc is 6.00 mm for Rice flowering');
    assert(res.calculations.water_volume_litres === 72843, 'Flood Condition', 'Water volume is 72,843 Litres (high due to 50% flood loss)');
    assert(res.calculations.irrigation_time_hours === 18.21, 'Flood Condition', 'Pump run time is 18.21 hours at 4,000 L/hr');
    assert(res.calculations.irrigation_time_formatted === '18h 13m', 'Flood Condition', 'Formatted pump time is 18h 13m', `Got ${res.calculations.irrigation_time_formatted}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 7: Condition 4 — Rain-Fed Conditions
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 7: Condition 4 — Rain-Fed Agricultural Conditions');
  {
    // Subcase 7A: Sufficient rainfall scenario (5.0 mm rain vs 3.57 mm ETc)
    const rainFedSufficient = PRESET_TEST_CASES.rain_fed.inputs;
    const resA = calculateIrrigation(rainFedSufficient);

    assert(resA.is_valid, 'Rain-Fed Condition', 'Rain-fed test case passes validation');
    assert(resA.calculations.is_rain_fed === true, 'Rain-Fed Condition', 'is_rain_fed flag is true');
    assert(resA.calculations.etc_mm === 3.57, 'Rain-Fed Condition', 'ETc is 3.57 mm (4.2 × 0.85)');
    assert(resA.calculations.is_sufficient_rain === true, 'Rain-Fed Condition', 'Recognizes 5.0 mm rain is sufficient for 3.57 mm need');
    assert(resA.calculations.water_volume_litres === 0, 'Rain-Fed Condition', 'Water volume required is 0 Litres');
    assert(resA.calculations.irrigation_time_hours === 0, 'Rain-Fed Condition', 'Pump run time is 0 Hours');
    assert(resA.calculations.irrigation_time_formatted.includes('Rain'), 'Rain-Fed Condition', 'Pump time formatted indicates Rain status');

    // Subcase 7B: Rain-fed deficit scenario (2.0 mm rain vs 3.57 mm ETc)
    // Area = 3 acres = 12,140.58 m²
    // Net depth = 3.57 - 2.0 = 1.57 mm
    // Volume = (1.57 * 12140.58) / 1.0 = 19,061 Litres
    // Pump run time = 0 hours (Rain-fed condition, no tube-well pump)
    const rainFedDeficit = PRESET_TEST_CASES.rain_fed_deficit.inputs;
    const resB = calculateIrrigation(rainFedDeficit);

    assert(resB.is_valid, 'Rain-Fed Condition', 'Rain-fed deficit case passes validation');
    assert(resB.calculations.net_depth_mm === 1.57, 'Rain-Fed Condition', 'Calculates soil deficit of 1.57 mm');
    assert(resB.calculations.water_volume_litres === 19061, 'Rain-Fed Condition', 'Calculates atmospheric crop requirement of 19,061 Litres');
    assert(resB.calculations.irrigation_time_hours === 0, 'Rain-Fed Condition', 'Pump run time remains 0 hours (rain-fed has no pump)');
    assert(resB.calculations.irrigation_time_formatted === '0h 0m (Rain-fed)', 'Rain-Fed Condition', 'Formatted as 0h 0m (Rain-fed)', `Got ${resB.calculations.irrigation_time_formatted}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 8: Strict Input Validation & Helpful Error Messages
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 8: Input Validation & Error Handling');
  {
    // Test 8.1: Missing crop
    const errMissingCrop = validateIrrigationInputs({ growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errMissingCrop.crop), 'Validation', 'Rejects missing crop with helpful error', errMissingCrop.crop);

    // Test 8.2: Missing growth stage
    const errMissingStage = validateIrrigationInputs({ crop: 'Rice', et0: 4.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errMissingStage.growth_stage), 'Validation', 'Rejects missing growth stage with helpful error', errMissingStage.growth_stage);

    // Test 8.3: Negative or NaN ET0
    const errNegativeEt0 = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: -3.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errNegativeEt0.et0), 'Validation', 'Rejects negative ET0 with helpful error', errNegativeEt0.et0);

    const errNaNEt0 = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: NaN, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errNaNEt0.et0), 'Validation', 'Rejects NaN ET0 with helpful error', errNaNEt0.et0);

    // Test 8.4: Zero or negative Kc
    const errZeroKc = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 0, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errZeroKc.kc), 'Validation', 'Rejects zero Kc with helpful error', errZeroKc.kc);

    const errNegativeKc = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: -0.8, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errNegativeKc.kc), 'Validation', 'Rejects negative Kc with helpful error', errNegativeKc.kc);

    // Test 8.5: Zero or negative Area
    const errZeroArea = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: 0, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errZeroArea.area), 'Validation', 'Rejects zero field area with helpful error', errZeroArea.area);

    const errNegativeArea = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: -2, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errNegativeArea.area), 'Validation', 'Rejects negative field area with helpful error', errNegativeArea.area);

    // Test 8.6: Invalid area unit
    const errInvalidUnit = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: 1, area_unit: 'sq_miles' as any, irrigation_efficiency: 0.9, pump_flow_rate: 3000 });
    assert(Boolean(errInvalidUnit.area_unit), 'Validation', 'Rejects unsupported area unit with helpful error', errInvalidUnit.area_unit);

    // Test 8.7: Zero, negative, or > 100 efficiency
    const errZeroEff = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 0, pump_flow_rate: 3000 });
    assert(Boolean(errZeroEff.irrigation_efficiency), 'Validation', 'Rejects zero efficiency with helpful error', errZeroEff.irrigation_efficiency);

    const errOverEff = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 120, pump_flow_rate: 3000 });
    assert(Boolean(errOverEff.irrigation_efficiency), 'Validation', 'Rejects > 100% efficiency with helpful error', errOverEff.irrigation_efficiency);

    // Test 8.8: Missing pump flow rate for pressurized systems
    const errMissingPump = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, irrigation_method: 'drip' });
    assert(Boolean(errMissingPump.pump_flow_rate), 'Validation', 'Requires pump rate for drip system with helpful error', errMissingPump.pump_flow_rate);

    // Test 8.9: Pump flow rate NOT required for rain-fed
    const errRainFedPump = validateIrrigationInputs({ crop: 'Maize', growth_stage: 'vegetative', et0: 4.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 1.0, irrigation_method: 'rain_fed' });
    assert(!Boolean(errRainFedPump.pump_flow_rate), 'Validation', 'Does not mandate pump rate for rain-fed conditions');

    // Test 8.10: Negative rainfall
    const errNegRain = validateIrrigationInputs({ crop: 'Rice', growth_stage: 'flowering', et0: 4.5, kc: 1.0, area: 1, area_unit: 'acre', irrigation_efficiency: 0.9, pump_flow_rate: 3000, recent_rainfall: -5 });
    assert(Boolean(errNegRain.recent_rainfall), 'Validation', 'Rejects negative rainfall with helpful error', errNegRain.recent_rainfall);
  }

  // -------------------------------------------------------------------------
  // SECTION 9: Estimates Disclaimer & Explanation Walkthrough
  // -------------------------------------------------------------------------
  console.log('\n📋 Section 9: Estimates Disclaimer & Step-by-Step Explanation');
  {
    const res = calculateIrrigation(PRESET_TEST_CASES.drip.inputs);

    // Mandatory Estimate Disclaimer
    assert(Boolean(res.estimate_disclaimer), 'Explanation', 'Includes estimate disclaimer');
    assert(res.estimate_disclaimer.toLowerCase().includes('estimate'), 'Explanation', 'Disclaimer explicitly warns outputs are estimates');
    assert(res.estimate_disclaimer.toLowerCase().includes('kvk') || res.estimate_disclaimer.toLowerCase().includes('agricultural'), 'Explanation', 'Disclaimer advises consulting agricultural officers');

    // Step-by-step breakdown
    assert(res.explanation.steps.length === 5, 'Explanation', 'Contains all 5 calculation explanation steps', `Found ${res.explanation.steps.length} steps`);
    assert(res.explanation.steps[0].formula === 'ETc = ET0 × Kc', 'Explanation', 'Step 1 displays ETc = ET0 × Kc');
    assert(res.explanation.steps[1].title.includes('Area Conversion'), 'Explanation', 'Step 2 explains Area conversion to m²');
    assert(res.explanation.steps[2].formula.includes('Net Depth'), 'Explanation', 'Step 3 explains Net depth & rainfall deduction');
    assert(res.explanation.steps[3].formula.includes('Water Volume'), 'Explanation', 'Step 4 explains Water volume in litres');
    assert(res.explanation.steps[4].formula.includes('Run Time'), 'Explanation', 'Step 5 explains Pump run time in hours');

    // Clear unit display in steps
    assert(res.explanation.steps[0].result.includes('mm'), 'Explanation', 'Step 1 result has mm unit');
    assert(res.explanation.steps[1].result.includes('m²'), 'Explanation', 'Step 2 result has m² unit');
    assert(res.explanation.steps[2].result.includes('mm'), 'Explanation', 'Step 3 result has mm unit');
    assert(res.explanation.steps[3].result.includes('Litres'), 'Explanation', 'Step 4 result has Litres unit');
    assert(res.explanation.steps[4].result.includes('Hours'), 'Explanation', 'Step 5 result has Hours unit');
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const failedTests = testResults.filter(t => !t.passed).length;

  console.log('\n================================================================');
  console.log(`📊 Test Summary: ${passedTests}/${totalTests} PASSED (${failedTests} failed)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests();
