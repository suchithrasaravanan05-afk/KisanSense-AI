import { IVisionProvider } from './base';
import {
  VisionAnalysisRequest,
  VisionAnalysisResponse,
  VisionStructuredOutput,
} from '../types';
import {
  VisionTimeoutError,
  VisionQuotaError,
  VisionJsonParseError,
  VisionUpstreamError,
} from '../errors';
import { validateAndSanitizeVisionResponse } from '../validator';
import { sampleImageOptions } from '../../../data/sampleImages';
import { ResultCategory } from '../../../types';

export class DemoVisionProvider implements IVisionProvider {
  public readonly name = 'demo';
  public readonly isConfigured = true;

  public async analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
    const startTime = Date.now();

    // 1. Check for requested simulated errors (for QA & testing requirements)
    if (req.simulateError === 'timeout') {
      throw new VisionTimeoutError(this.name, 5000);
    }
    if (req.simulateError === 'quota') {
      throw new VisionQuotaError(
        this.name,
        'Simulated quota limit of 15 requests per minute reached'
      );
    }
    if (req.simulateError === 'invalid_json') {
      throw new VisionJsonParseError(
        this.name,
        '<html><body>502 Bad Gateway: Upstream returned non-JSON payload</body></html>'
      );
    }
    if (req.simulateError === 'api_failure') {
      throw new VisionUpstreamError(
        this.name,
        'Simulated 500 Internal Server Error: Model service unresponsive',
        500
      );
    }

    const quality = req.imageQualityScore !== undefined ? req.imageQualityScore : 85;

    // 2. Check if image matches one of our known sample fixtures
    const matchedSample = sampleImageOptions.find((s) => s.dataUrl === req.imageDataUrl);
    if (matchedSample) {
      const rawOutput: VisionStructuredOutput = {
        result_category: matchedSample.expectedCategory,
        confidence: matchedSample.confidence,
        image_quality: quality,
        observed_symptoms: matchedSample.symptoms,
        explanation: matchedSample.explanation,
        recommended_next_step: matchedSample.nextStep,
      };

      const validated = validateAndSanitizeVisionResponse(rawOutput, quality, this.name);
      return {
        ...validated,
        provider_used: this.name,
        model_name: 'agronomic-demo-rule-engine-v1',
        latency_ms: Date.now() - startTime,
      };
    }

    // 3. If quality is low (< 45), return cautious uncertain diagnosis
    if (quality < 45) {
      const lowQualityOutput: VisionStructuredOutput = {
        result_category: 'uncertain',
        confidence: 36,
        image_quality: quality,
        observed_symptoms: [
          'Optical blur and insufficient daylight illumination',
          'Leaf venation and spot margins poorly delineated',
          'Symptom ambiguity between biotic lesions and mechanical wear',
        ],
        explanation:
          'Image optical quality is below the diagnostic threshold. Defocus blur or harsh shadowing prevents confident lesion delineation.',
        recommended_next_step:
          'Please take another clear, close-up photo in bright daylight focusing directly on the leaf blade without camera shake or glare.',
      };

      const validated = validateAndSanitizeVisionResponse(lowQualityOutput, quality, this.name);
      return {
        ...validated,
        provider_used: this.name,
        model_name: 'agronomic-demo-rule-engine-v1',
        latency_ms: Date.now() - startTime,
      };
    }

    // 4. Realistic crop-specific agronomic heuristics for arbitrary uploads
    const crop = (req.cropName || 'Tomato').toLowerCase();
    let category: ResultCategory = 'healthy';
    let symptoms: string[] = [];
    let explanation = '';
    let nextStep = '';
    let confidence = 84;

    if (crop.includes('tomato')) {
      category = 'fungal_disease';
      confidence = 86;
      symptoms = [
        'Concentric target-board rings on lower foliage (Alternaria traits)',
        'Dark brown necrotic spots surrounded by chlorotic yellow halos',
        'Leaf tissue curling around active infection foci',
      ];
      explanation =
        'Visual leaf symptoms strongly align with early blight (Alternaria solani). Warm temperatures and prolonged leaf wetness create favorable conditions for spore dissemination.';
      nextStep =
        'Prune and safely destroy lower infected foliage. Avoid overhead sprinkler irrigation to keep leaves dry. Consult your local KVK extension officer regarding registered copper-based protectant sprays.';
    } else if (crop.includes('rice') || crop.includes('paddy')) {
      category = 'fungal_disease';
      confidence = 82;
      symptoms = [
        'Spindle-shaped elliptical lesions with ash-grey centers (Blast traits)',
        'Dark brownish-red borders on upper leaf blades',
        'Early collar discoloration near sheath',
      ];
      explanation =
        'Foliar traits exhibit characteristic rice blast (Magnaporthe oryzae) lesion patterns. High nitrogen status and dense canopy humidity exacerbate symptom intensity.';
      nextStep =
        'Ensure proper drain-water circulation and avoid excessive urea top-dressing. Inspect adjacent tillers and consult agricultural extension services for certified fungicide guidance.';
    } else if (crop.includes('wheat')) {
      category = 'fungal_disease';
      confidence = 79;
      symptoms = [
        'Linear orange-yellow pustules arranged in stripes on leaf surface',
        'Ruptured epidermal tissue with powder-like spores',
      ];
      explanation =
        'Visible pustules closely match stripe rust (Puccinia striiformis) traits common in cooler morning microclimates.',
      nextStep =
        'Check field perimeters for cluster spread. Request KVK agronomist verification before applying propiconazole or triazole sprays.';
    } else if (crop.includes('cotton')) {
      category = 'pest_damage';
      confidence = 81;
      symptoms = [
        'Irregular leaf perforations and serrated leaf margins',
        'Early downward curling of tender apical leaves',
        'Small dark frass specks on lower leaf surfaces',
      ];
      explanation =
        'Visible foliage shows mechanical chewing patterns indicative of early bollworm or thrips activity.',
      nextStep =
        'Deploy yellow/blue sticky traps and pheromone traps to monitor pest incidence. Spray neem oil solution (1500 ppm) as an initial botanical deterrent.';
    } else {
      category = 'healthy';
      confidence = 88;
      symptoms = [
        'Uniform green canopy coloration with intact epidermal layer',
        'No active fungal sporulation or chlorotic halo formations observed',
        'Turgid petioles with normal leaf blade geometry',
      ];
      explanation =
        'The inspected leaf foliage shows robust vigor with no visible signs of pathogen invasion or acute nutrient deficiency.',
      nextStep =
        'Maintain balanced irrigation scheduling in accordance with evapotranspiration (ETc) rates and inspect foliage weekly.';
    }

    const rawOutput: VisionStructuredOutput = {
      result_category: category,
      confidence,
      image_quality: quality,
      observed_symptoms: symptoms,
      explanation,
      recommended_next_step: nextStep,
    };

    const validated = validateAndSanitizeVisionResponse(rawOutput, quality, this.name);
    return {
      ...validated,
      provider_used: this.name,
      model_name: 'agronomic-demo-rule-engine-v1',
      latency_ms: Date.now() - startTime,
    };
  }
}
