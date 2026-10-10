import { ResultCategory } from '../../types';
import { VisionStructuredOutput } from './types';
import { VisionValidationError } from './errors';

const VALID_CATEGORIES: ReadonlySet<ResultCategory> = new Set<ResultCategory>([
  'healthy',
  'water_stress',
  'nitrogen_stress',
  'fungal_disease',
  'pest_damage',
  'uncertain',
]);

const CHEMICAL_FERTILIZER_MENTION =
  /\b(?:urea|dap|mop|npk|potash|ammonium|superphosphate|fertilizer)\b/i;

const MANDATORY_FERTILIZER_DISCLAIMER =
  'Note: Exact chemical fertilizer doses require a laboratory soil test. Never apply chemical fertilizers based solely on a photograph.';

const LOW_CONFIDENCE_IMAGE_PROMPT =
  'Confidence is low. Please take another clear, close-up photo in bright daylight focusing directly on the affected leaf surface without blur or harsh glare.';

function getDosageRegex(): RegExp {
  return /\b(?:\d+(?:\.\d+)?|\d+-\d+)\s*(?:kg(?:\/ha|\/acre)?|bags?(?:\/ha|\/acre)?|gm(?:\/l|\/acre)?|g\/l|litres?(?:\/ha)?|quintals?)\b/gi;
}

function hasDosage(text: string): boolean {
  return /\b(?:\d+(?:\.\d+)?|\d+-\d+)\s*(?:kg(?:\/ha|\/acre)?|bags?(?:\/ha|\/acre)?|gm(?:\/l|\/acre)?|g\/l|litres?(?:\/ha)?|quintals?)\b/i.test(text);
}

/**
 * Validates, sanitizes, and enforces agricultural safety rules on vision model output.
 */
export function validateAndSanitizeVisionResponse(
  raw: any,
  fallbackQuality = 80,
  provider = 'unknown'
): VisionStructuredOutput {
  if (!raw || typeof raw !== 'object') {
    throw new VisionValidationError(provider, 'Response is not a valid JSON object');
  }

  // 1. Result Category Validation
  let resultCategory: ResultCategory = 'uncertain';
  if (typeof raw.result_category === 'string') {
    const normalized = raw.result_category.toLowerCase().trim() as ResultCategory;
    if (VALID_CATEGORIES.has(normalized)) {
      resultCategory = normalized;
    } else {
      // Map common synonyms if model produced a variant
      if (normalized.includes('fungal') || normalized.includes('blight') || normalized.includes('mildew') || normalized.includes('rust')) {
        resultCategory = 'fungal_disease';
      } else if (normalized.includes('pest') || normalized.includes('insect') || normalized.includes('caterpillar')) {
        resultCategory = 'pest_damage';
      } else if (normalized.includes('water') || normalized.includes('wilt') || normalized.includes('drought')) {
        resultCategory = 'water_stress';
      } else if (normalized.includes('nitrogen') || normalized.includes('nutrient') || normalized.includes('chlorosis')) {
        resultCategory = 'nitrogen_stress';
      } else if (normalized.includes('healthy') || normalized.includes('normal')) {
        resultCategory = 'healthy';
      } else {
        resultCategory = 'uncertain';
      }
    }
  }

  // 2. Confidence Validation & Clamping (0 - 100)
  let confidence = Number(raw.confidence);
  if (isNaN(confidence) || !isFinite(confidence)) {
    confidence = 50;
  }
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  // 3. Image Quality Validation & Clamping (0 - 100)
  let imageQuality = Number(raw.image_quality !== undefined ? raw.image_quality : fallbackQuality);
  if (isNaN(imageQuality) || !isFinite(imageQuality)) {
    imageQuality = fallbackQuality;
  }
  imageQuality = Math.max(0, Math.min(100, Math.round(imageQuality)));

  // If image quality itself is very low, cap confidence
  if (imageQuality < 45 && confidence > 45) {
    confidence = Math.min(confidence, 42);
    resultCategory = 'uncertain';
  }

  // 4. Observed Symptoms Validation
  let observedSymptoms: string[] = [];
  if (Array.isArray(raw.observed_symptoms)) {
    observedSymptoms = raw.observed_symptoms
      .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
      .map((s: string) => s.trim());
  }
  if (observedSymptoms.length === 0) {
    observedSymptoms = ['Foliar patterns evaluated against agronomic reference set'];
  }

  // 5. Explanation Validation & Sanitization
  let explanation = typeof raw.explanation === 'string' ? raw.explanation.trim() : '';
  if (!explanation) {
    explanation = 'Visual symptom triage performed on crop foliage.';
  }

  // 6. Recommended Next Step Validation & Sanitization
  let recommendedNextStep =
    typeof raw.recommended_next_step === 'string' ? raw.recommended_next_step.trim() : '';
  if (!recommendedNextStep) {
    recommendedNextStep =
      'Inspect field foliage and consult a local agricultural extension officer.';
  }

  // 7. SAFETY RULE: Never provide exact fertilizer dosage from an image alone
  const explanationHasDosage =
    hasDosage(explanation) && CHEMICAL_FERTILIZER_MENTION.test(explanation);
  const nextStepHasDosage =
    hasDosage(recommendedNextStep) && CHEMICAL_FERTILIZER_MENTION.test(recommendedNextStep);

  if (explanationHasDosage) {
    explanation = explanation.replace(
      getDosageRegex(),
      '[exact dosage withheld - requires soil test]'
    );
    if (!explanation.toLowerCase().includes('soil test')) {
      explanation += ` ${MANDATORY_FERTILIZER_DISCLAIMER}`;
    }
  }

  if (nextStepHasDosage) {
    recommendedNextStep = recommendedNextStep.replace(
      getDosageRegex(),
      '[exact dosage withheld - requires soil test]'
    );
    if (!recommendedNextStep.toLowerCase().includes('soil test')) {
      recommendedNextStep += ` ${MANDATORY_FERTILIZER_DISCLAIMER}`;
    }
  }

  // 8. LOW CONFIDENCE RULE: If confidence is low (< 50) or uncertain, request another image
  if (confidence < 50 || resultCategory === 'uncertain') {
    const hasRetakeInstruction =
      /\b(?:another|new|retake|clearer|closer)\b.*?\b(?:photo|image|picture|scan)\b/i.test(
        recommendedNextStep
      );
    if (!hasRetakeInstruction) {
      recommendedNextStep = `${LOW_CONFIDENCE_IMAGE_PROMPT} ${recommendedNextStep}`;
    }
  }

  return {
    result_category: resultCategory,
    confidence,
    image_quality: imageQuality,
    observed_symptoms: observedSymptoms,
    explanation,
    recommended_next_step: recommendedNextStep,
  };
}
