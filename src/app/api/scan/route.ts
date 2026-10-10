import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeCropVision,
  getServerVisionConfig,
  listAvailableProviders,
  VisionError,
  SimulatedErrorType,
  VisionProviderType,
} from '../../../services/vision';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30s max execution duration for AI models

/**
 * GET /api/scan
 * Provides status of the vision analysis subsystem, current active provider, and capabilities.
 */
export async function GET() {
  const config = getServerVisionConfig();
  const providers = listAvailableProviders();

  return NextResponse.json({
    status: 'operational',
    service: 'KisanSense AI Crop Vision Analysis Engine',
    active_provider: config.provider,
    providers,
    timeout_ms: config.timeoutMs,
    fallback_to_demo_enabled: config.fallbackToDemo,
  });
}

/**
 * POST /api/scan
 * Production-ready crop image triage endpoint.
 * Returns strict structured JSON with strict schema validation and safety disclaimers.
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryProvider = url.searchParams.get('provider') as VisionProviderType | null;
    const querySimulateError = url.searchParams.get('simulate_error') as SimulatedErrorType | null;
    const queryStrict = url.searchParams.get('strict') === 'true';

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty or invalid
    }

    const cropName = body.cropName || 'Tomato';
    const imageDataUrl = body.imageDataUrl || '';
    const imageQualityScore = body.qualityScore || body.image_quality;
    const imageType = body.imageType || 'leaf';
    const fieldId = body.fieldId;

    // Check payload size limits (reject images > 15MB binary / ~20MB base64)
    if (imageDataUrl && imageDataUrl.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'Image payload exceeds the maximum 15MB limit. Please compress the image before sending.',
          code: 'PAYLOAD_TOO_LARGE',
        },
        { status: 413 }
      );
    }

    // Provider selection priority: Body > Query param > Server env default
    const provider = body.provider || queryProvider || undefined;

    // Simulated error priority: Body > Query param
    const simulateError = (body.simulateError || querySimulateError) as SimulatedErrorType | undefined;

    // Strict errors flag: if true, errors are thrown directly without fallback
    const strictErrors = body.strictErrors !== undefined ? Boolean(body.strictErrors) : queryStrict;

    const result = await analyzeCropVision({
      cropName,
      imageDataUrl,
      imageQualityScore,
      imageType,
      fieldId,
      provider,
      simulateError,
      strictErrors,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[KisanSense API /api/scan Error]:', error);

    if (error instanceof VisionError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          provider: error.provider,
          status: error.statusCode,
          details: error.originalError?.message || undefined,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Internal Server Error while evaluating crop image',
        code: 'API_FAILURE',
        status: 500,
      },
      { status: 500 }
    );
  }
}
