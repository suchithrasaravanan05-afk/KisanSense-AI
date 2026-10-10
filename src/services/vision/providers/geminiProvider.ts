import { IVisionProvider } from './base';
import { VisionAnalysisRequest, VisionAnalysisResponse } from '../types';
import {
  VisionTimeoutError,
  VisionQuotaError,
  VisionJsonParseError,
  VisionUpstreamError,
} from '../errors';
import { validateAndSanitizeVisionResponse } from '../validator';

export class GeminiVisionProvider implements IVisionProvider {
  public readonly name = 'gemini';
  private readonly apiKey: string | undefined;
  private readonly modelName: string;
  private readonly timeoutMs: number;

  constructor(options?: { apiKey?: string; modelName?: string; timeoutMs?: number }) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
    this.modelName = options?.modelName || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.timeoutMs = options?.timeoutMs || Number(process.env.VISION_TIMEOUT_MS) || 15000;
  }

  public get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new VisionUpstreamError(
        this.name,
        'GEMINI_API_KEY environment variable is not configured',
        500
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.modelName
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const prompt = `You are KisanSense AI, a rigorous agricultural decision-support assistant for farmers.
Inspect this crop photo for Crop: ${req.cropName || 'Unspecified'} (Type: ${req.imageType || 'leaf'}).

Return ONLY a raw valid JSON object without markdown fences matching EXACTLY this structure:
{
  "result_category": "healthy" | "water_stress" | "nitrogen_stress" | "fungal_disease" | "pest_damage" | "uncertain",
  "confidence": <integer between 10 and 95>,
  "image_quality": <integer between 10 and 98>,
  "observed_symptoms": ["<detailed physical symptom 1>", "<symptom 2>", ...],
  "explanation": "<scientific yet simple explanation of visual traits and environmental conditions>",
  "recommended_next_step": "<actionable agronomic advice>"
}

CRITICAL AGRONOMIC SAFETY RULES:
1. NEVER PROVIDE EXACT FERTILIZER DOSAGE NUMBERS (such as kg/ha, grams/liter, bags, or exact chemical kilograms) based on this image alone. State that exact nutrient amounts strictly require a laboratory soil test from a local Krishi Vigyan Kendra (KVK).
2. IF CONFIDENCE IS LOW (< 50) OR IF THE IMAGE IS BLURRY / SHADOWED / UNCERTAIN: You MUST explicitly advise the farmer in 'recommended_next_step' to capture another clear, focused photo in bright natural daylight.
3. Be honest about visual limits; do not over-diagnose when symptoms are ambiguous.`;

    // Extract base64 payload
    let base64Data = '';
    let mimeType = 'image/jpeg';
    if (req.imageDataUrl) {
      const match = req.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = req.imageDataUrl.replace(/^data:[^;]+;base64,/, '');
      }
    }

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            base64Data ? { inlineData: { mimeType, data: base64Data } } : null,
          ].filter(Boolean),
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new VisionTimeoutError(this.name, this.timeoutMs);
      }
      throw new VisionUpstreamError(
        this.name,
        `Network error calling Gemini API: ${err.message || String(err)}`,
        502,
        err
      );
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      if (res.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
        throw new VisionQuotaError(this.name, `Gemini rate limit or quota exceeded (HTTP 429)`);
      }
      throw new VisionUpstreamError(
        this.name,
        `Gemini API returned status ${res.status}: ${errorText.substring(0, 300)}`,
        res.status >= 500 ? 502 : res.status
      );
    }

    let rawJsonText = '';
    try {
      const data = await res.json();
      const textCandidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textCandidate) {
        throw new Error('No candidate content returned in Gemini payload');
      }
      rawJsonText = textCandidate;
    } catch (err: any) {
      throw new VisionJsonParseError(this.name, err.message);
    }

    // Clean any backticks or markdown fences
    const cleanText = rawJsonText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch (err) {
      throw new VisionJsonParseError(this.name, cleanText);
    }

    const validated = validateAndSanitizeVisionResponse(
      parsed,
      req.imageQualityScore || 80,
      this.name
    );

    return {
      ...validated,
      provider_used: this.name,
      model_name: this.modelName,
      latency_ms: Date.now() - startTime,
    };
  }
}
