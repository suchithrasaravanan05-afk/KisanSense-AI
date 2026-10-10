import { ResultCategory } from '../../types';

export type VisionProviderType = 'demo' | 'gemini' | 'openai';

export type SimulatedErrorType = 'timeout' | 'quota' | 'invalid_json' | 'api_failure';

export interface VisionAnalysisRequest {
  cropName: string;
  imageDataUrl: string;
  imageType?: 'leaf' | 'field' | 'soil';
  imageQualityScore?: number;
  fieldId?: string;
  provider?: VisionProviderType;
  simulateError?: SimulatedErrorType;
  strictErrors?: boolean; // if true, don't fallback to demo on error
}

/**
 * Strict structured JSON response required by KisanSense AI vision service
 */
export interface VisionStructuredOutput {
  result_category: ResultCategory;
  confidence: number; // 0 - 100
  image_quality: number; // 0 - 100
  observed_symptoms: string[];
  explanation: string;
  recommended_next_step: string;
}

export interface VisionAnalysisResponse extends VisionStructuredOutput {
  provider_used: VisionProviderType | string;
  model_name?: string;
  is_fallback?: boolean;
  latency_ms?: number;
  warning?: string;
}

export interface VisionConfig {
  provider: VisionProviderType;
  geminiApiKey?: string;
  geminiModel: string;
  openaiApiKey?: string;
  openaiModel: string;
  timeoutMs: number;
  fallbackToDemo: boolean;
}
