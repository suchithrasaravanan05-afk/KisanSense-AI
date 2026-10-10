import {
  analyzeCropVision,
  getVisionProvider,
  getServerVisionConfig,
  listAvailableProviders,
  validateAndSanitizeVisionResponse,
  VisionTimeoutError,
  VisionQuotaError,
  VisionJsonParseError,
  VisionUpstreamError,
} from '../src/services/vision';
import { sampleImageOptions } from '../src/data/sampleImages';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, message?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✓ PASS: ${name}`);
  } else {
    results.push({ name, passed: false, message });
    console.error(`  ✗ FAIL: ${name} - ${message || 'Assertion failed'}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting KisanSense AI Vision Service Abstraction Tests');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. Strict Structured JSON & Field Verification (Demo Mode)
  // -----------------------------------------------------------------
  console.log('📋 Section 1: Strict Structured JSON & Output Validation');
  {
    const res = await analyzeCropVision({
      cropName: 'Tomato',
      imageDataUrl: 'data:image/jpeg;base64,sample-test-image',
      imageQualityScore: 85,
      provider: 'demo',
    });

    const requiredKeys = [
      'result_category',
      'confidence',
      'image_quality',
      'observed_symptoms',
      'explanation',
      'recommended_next_step',
    ];

    for (const key of requiredKeys) {
      assert(key in res && (res as any)[key] !== undefined, `Output contains required field: '${key}'`);
    }

    const validCategories = ['healthy', 'water_stress', 'nitrogen_stress', 'fungal_disease', 'pest_damage', 'uncertain'];
    assert(validCategories.includes(res.result_category), `result_category '${res.result_category}' is a valid enum`);
    assert(typeof res.confidence === 'number' && res.confidence >= 0 && res.confidence <= 100, `confidence is bounded (0-100): ${res.confidence}`);
    assert(typeof res.image_quality === 'number' && res.image_quality >= 0 && res.image_quality <= 100, `image_quality is bounded (0-100): ${res.image_quality}`);
    assert(Array.isArray(res.observed_symptoms) && res.observed_symptoms.length > 0, 'observed_symptoms is non-empty string array');
    assert(typeof res.explanation === 'string' && res.explanation.length > 10, 'explanation is informative string');
    assert(typeof res.recommended_next_step === 'string' && res.recommended_next_step.length > 10, 'recommended_next_step is actionable string');
    assert(res.provider_used === 'demo', `provider_used matches 'demo'`);
  }

  // -----------------------------------------------------------------
  // 2. Sample Fixtures Matching
  // -----------------------------------------------------------------
  console.log('\n📋 Section 2: Sample Image Fixture Matching');
  {
    const firstSample = sampleImageOptions[0]; // e.g. Early Blight
    const res = await analyzeCropVision({
      cropName: firstSample.cropName,
      imageDataUrl: firstSample.dataUrl,
      imageQualityScore: firstSample.quality,
      provider: 'demo',
    });

    assert(res.result_category === firstSample.expectedCategory, `Fixture expected category '${firstSample.expectedCategory}' matched '${res.result_category}'`);
    assert(res.confidence === firstSample.confidence, `Fixture expected confidence '${firstSample.confidence}' matched '${res.confidence}'`);
  }

  // -----------------------------------------------------------------
  // 3. Safety Guardrail: Never Provide Exact Fertilizer Dosage
  // -----------------------------------------------------------------
  console.log('\n📋 Section 3: Safety Guardrail - Anti-Fertilizer Dosage Enforcement');
  {
    // Pass raw model output with illicit chemical dosage numbers
    const dangerousOutput = {
      result_category: 'nitrogen_stress',
      confidence: 85,
      image_quality: 90,
      observed_symptoms: ['Leaf chlorosis on lower leaves'],
      explanation: 'Severe nitrogen deficiency diagnosed. Apply 60 kg/ha of Urea immediately to foliage.',
      recommended_next_step: 'Broadcast 25 kg/acre DAP and 15 kg Urea today.',
    };

    const sanitized = validateAndSanitizeVisionResponse(dangerousOutput, 85, 'test-guardrail');

    assert(!sanitized.explanation.includes('60 kg/ha'), 'Sanitizer redacted 60 kg/ha dosage from explanation');
    assert(!sanitized.recommended_next_step.includes('25 kg/acre'), 'Sanitizer redacted 25 kg/acre dosage from next step');
    assert(sanitized.explanation.toLowerCase().includes('soil test'), 'Sanitizer appended mandatory soil test notice to explanation');
    assert(sanitized.recommended_next_step.toLowerCase().includes('soil test'), 'Sanitizer appended mandatory soil test notice to next step');
  }

  // -----------------------------------------------------------------
  // 4. Low Confidence Rule: Request Another Photo
  // -----------------------------------------------------------------
  console.log('\n📋 Section 4: Low-Confidence Image Rule');
  {
    // Low quality photo < 45
    const resLow = await analyzeCropVision({
      cropName: 'Tomato',
      imageDataUrl: 'data:image/jpeg;base64,blurry-photo',
      imageQualityScore: 35,
      provider: 'demo',
    });

    assert(resLow.confidence < 50 || resLow.result_category === 'uncertain', `Low quality triggers low confidence (${resLow.confidence}%) / uncertain category`);
    const nextStepLower = resLow.recommended_next_step.toLowerCase();
    const hasPhotoRequest = /\b(?:another|new|retake|clearer|closer)\b.*?\b(?:photo|image|picture|scan)\b/i.test(nextStepLower);
    assert(hasPhotoRequest, `recommended_next_step requests another photo: "${resLow.recommended_next_step.substring(0, 60)}..."`);
  }

  // -----------------------------------------------------------------
  // 5. Provider Selection & Registry Configuration
  // -----------------------------------------------------------------
  console.log('\n📋 Section 5: Server-side Provider Selection & Factory');
  {
    const config = getServerVisionConfig();
    assert(config.timeoutMs > 0, `Server config timeout is valid: ${config.timeoutMs}ms`);

    const demoProvider = getVisionProvider('demo');
    assert(demoProvider.name === 'demo', `Factory successfully returned DemoVisionProvider`);

    const geminiProvider = getVisionProvider('gemini');
    assert(geminiProvider.name === 'gemini', `Factory successfully returned GeminiVisionProvider`);

    const openaiProvider = getVisionProvider('openai');
    assert(openaiProvider.name === 'openai', `Factory successfully returned OpenAIVisionProvider`);

    const providersList = listAvailableProviders();
    assert(providersList.length === 3, `Factory lists all 3 supported providers: ${providersList.map(p => p.name).join(', ')}`);
  }

  // -----------------------------------------------------------------
  // 6. Error Handling: Timeout, Quota, Invalid JSON, API Failure
  // -----------------------------------------------------------------
  console.log('\n📋 Section 6: Simulated Error Handling (Strict Mode)');
  {
    // Timeout
    let caughtTimeout = false;
    try {
      await analyzeCropVision({
        cropName: 'Tomato',
        imageDataUrl: 'test',
        provider: 'demo',
        simulateError: 'timeout',
        strictErrors: true,
      });
    } catch (e: any) {
      caughtTimeout = e instanceof VisionTimeoutError && e.statusCode === 504;
    }
    assert(caughtTimeout, 'Simulated timeout correctly throws VisionTimeoutError (HTTP 504)');

    // Quota Exceeded (429)
    let caughtQuota = false;
    try {
      await analyzeCropVision({
        cropName: 'Tomato',
        imageDataUrl: 'test',
        provider: 'demo',
        simulateError: 'quota',
        strictErrors: true,
      });
    } catch (e: any) {
      caughtQuota = e instanceof VisionQuotaError && e.statusCode === 429;
    }
    assert(caughtQuota, 'Simulated quota correctly throws VisionQuotaError (HTTP 429)');

    // Invalid JSON (502)
    let caughtInvalidJson = false;
    try {
      await analyzeCropVision({
        cropName: 'Tomato',
        imageDataUrl: 'test',
        provider: 'demo',
        simulateError: 'invalid_json',
        strictErrors: true,
      });
    } catch (e: any) {
      caughtInvalidJson = e instanceof VisionJsonParseError && e.statusCode === 502;
    }
    assert(caughtInvalidJson, 'Simulated invalid JSON correctly throws VisionJsonParseError (HTTP 502)');

    // Upstream API Failure (500)
    let caughtApiFailure = false;
    try {
      await analyzeCropVision({
        cropName: 'Tomato',
        imageDataUrl: 'test',
        provider: 'demo',
        simulateError: 'api_failure',
        strictErrors: true,
      });
    } catch (e: any) {
      caughtApiFailure = e instanceof VisionUpstreamError && e.statusCode === 500;
    }
    assert(caughtApiFailure, 'Simulated API failure correctly throws VisionUpstreamError (HTTP 500)');
  }

  // -----------------------------------------------------------------
  // 7. Production Fallback Resilience
  // -----------------------------------------------------------------
  console.log('\n📋 Section 7: Production Graceful Fallback Mode');
  {
    // When strictErrors is FALSE (standard production mode), upstream failures must not crash
    const resilientRes = await analyzeCropVision({
      cropName: 'Tomato',
      imageDataUrl: 'test',
      provider: 'demo',
      simulateError: 'timeout',
      strictErrors: false,
    });

    assert(resilientRes.is_fallback === true, 'Resilient mode catches error and marks response as fallback');
    assert(typeof resilientRes.warning === 'string' && resilientRes.warning.toLowerCase().includes('timeout'), 'Resilient mode includes clear fallback warning description');
    assert(resilientRes.result_category === 'fungal_disease' || resilientRes.result_category === 'healthy', 'Fallback returned safe, valid diagnostic data');
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log('\n======================================================');
  console.log(`📊 Test Summary: ${passedCount}/${results.length} PASSED (${failedCount} failed)`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
