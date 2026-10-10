import { IVisionProvider } from './base';
import { VisionAnalysisRequest, VisionAnalysisResponse } from '../types';
import {
  VisionTimeoutError,
  VisionQuotaError,
  VisionJsonParseError,
  VisionUpstreamError,
} from '../errors';
import { validateAndSanitizeVisionResponse } from '../validator';

export class OpenAIVisionProvider implements IVisionProvider {
  public readonly name = 'openai';
  private readonly apiKey: string | undefined;
  private readonly modelName: string;
  private readonly timeoutMs: number;

  constructor(options?: { apiKey?: string; modelName?: string; timeoutMs?: number }) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY;
    this.modelName = options?.modelName || process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
        'OPENAI_API_KEY environment variable is not configured',
        500
      );
    }

    const endpoint = 'https://api.openai.com/v1/chat/completions';

    const systemPrompt = `You are KisanSense AI, a rigorous agricultural decision-support assistant.
Inspect the crop leaf photo and provide visual triage.

You must return valid JSON matching this schema:
{
  "result_category": "healthy" | "water_stress" | "nitrogen_stress" | "fungal_disease" | "pest_damage" | "uncertain",
  "confidence": <integer between 10 and 95>,
  "image_quality": <integer between 10 and 98>,
  "observed_symptoms": ["<observed symptom 1>", "<observed symptom 2>"],
  "explanation": "<agronomic explanation>",
  "recommended_next_step": "<actionable step for farmer>"
}

MANDATORY RULES:
1. NEVER PROVIDE EXACT FERTILIZER DOSAGES (e.g. kg/ha or grams) from a photo. State that soil tests are required.
2. If confidence is low (< 50) or the image is blurry, advise the farmer in 'recommended_next_step' to capture another clear photo in daylight.`;

    const userContent: any[] = [
      {
        type: 'text',
        text: `Crop: ${req.cropName || 'Unspecified'}. Target: ${req.imageType || 'leaf'}. Analyze visual traits.`,
      },
    ];

    if (req.imageDataUrl) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: req.imageDataUrl,
          detail: 'low',
        },
      });
    }

    const payload = {
      model: this.modelName,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
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
        `Network error calling OpenAI API: ${err.message || String(err)}`,
        502,
        err
      );
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      if (res.status === 429) {
        throw new VisionQuotaError(this.name, `OpenAI rate limit or quota exceeded (HTTP 429)`);
      }
      throw new VisionUpstreamError(
        this.name,
        `OpenAI API returned status ${res.status}: ${errorText.substring(0, 300)}`,
        res.status >= 500 ? 502 : res.status
      );
    }

    let parsed: any;
    try {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in choice message');
      parsed = JSON.parse(content);
    } catch (err: any) {
      throw new VisionJsonParseError(this.name, err.message);
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
