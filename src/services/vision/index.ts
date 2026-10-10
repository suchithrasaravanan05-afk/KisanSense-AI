import {
  VisionAnalysisRequest,
  VisionAnalysisResponse,
} from './types';
import {
  getVisionProvider,
  getServerVisionConfig,
  listAvailableProviders,
} from './factory';
import { DemoVisionProvider } from './providers/demoProvider';
import { VisionError } from './errors';

export * from './types';
export * from './errors';
export * from './validator';
export * from './factory';
export { DemoVisionProvider } from './providers/demoProvider';
export { GeminiVisionProvider } from './providers/geminiProvider';
export { OpenAIVisionProvider } from './providers/openaiProvider';

/**
 * Main production vision analysis entry point.
 * Selects provider, handles timeouts, quota limits, JSON parsing errors,
 * performs strict validation, enforces agricultural safety, and manages fallback.
 */
export async function analyzeCropVision(
  request: VisionAnalysisRequest
): Promise<VisionAnalysisResponse> {
  const config = getServerVisionConfig();
  const requestedProviderName = request.provider || config.provider;

  let provider;
  try {
    provider = getVisionProvider(requestedProviderName);
  } catch (err) {
    if (request.strictErrors) throw err;
    provider = new DemoVisionProvider();
  }

  // If the chosen live provider is not configured with an API key, and strictErrors is requested:
  if (!provider.isConfigured && provider.name !== 'demo') {
    const errorMsg = `Provider '${provider.name}' is not configured with an API key`;
    if (request.strictErrors) {
      throw new VisionError({
        message: errorMsg,
        code: 'AUTH_FAILED',
        statusCode: 500,
        provider: provider.name,
      });
    }
    // Otherwise fallback to demo mode
    const demoProvider = new DemoVisionProvider();
    const demoRes = await demoProvider.analyze(request);
    return {
      ...demoRes,
      is_fallback: true,
      warning: `${errorMsg}. Operating seamlessly with Agronomic Rule-Engine Mock.`,
    };
  }

  try {
    const response = await provider.analyze(request);
    return response;
  } catch (error: any) {
    // If strict error handling is requested (e.g. testing simulated API failures), throw directly
    if (request.strictErrors || !config.fallbackToDemo) {
      throw error;
    }

    // Otherwise, provide resilient production fallback to Demo agronomic heuristics
    console.warn(
      `[KisanSense Vision] Provider '${provider.name}' failed (${error.name}: ${error.message}). Falling back to agronomic rule-engine mock.`
    );

    const demoProvider = new DemoVisionProvider();
    // Do NOT pass simulated error into the fallback
    const fallbackRes = await demoProvider.analyze({
      ...request,
      simulateError: undefined,
    });

    return {
      ...fallbackRes,
      is_fallback: true,
      warning: `Vision model provider '${provider.name}' was unavailable (${error.code || error.name}). Switched to safe agronomic heuristic fallback.`,
    };
  }
}
