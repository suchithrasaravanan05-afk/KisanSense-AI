import { IVisionProvider } from './providers/base';
import { DemoVisionProvider } from './providers/demoProvider';
import { GeminiVisionProvider } from './providers/geminiProvider';
import { OpenAIVisionProvider } from './providers/openaiProvider';
import { VisionConfig, VisionProviderType } from './types';
import { VisionError } from './errors';

export function getServerVisionConfig(): VisionConfig {
  const configuredProvider = (
    process.env.VISION_PROVIDER || ''
  ).toLowerCase().trim() as VisionProviderType;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const timeoutMs = Number(process.env.VISION_TIMEOUT_MS) || 15000;
  const fallbackToDemo = process.env.VISION_FALLBACK_TO_DEMO !== 'false';

  // Determine active default provider
  let activeProvider: VisionProviderType = 'demo';
  if (['demo', 'gemini', 'openai'].includes(configuredProvider)) {
    activeProvider = configuredProvider;
  } else if (geminiApiKey && geminiApiKey.trim().length > 0) {
    activeProvider = 'gemini';
  } else if (openaiApiKey && openaiApiKey.trim().length > 0) {
    activeProvider = 'openai';
  }

  return {
    provider: activeProvider,
    geminiApiKey,
    geminiModel,
    openaiApiKey,
    openaiModel,
    timeoutMs,
    fallbackToDemo,
  };
}

export function getVisionProvider(requestedProvider?: string): IVisionProvider {
  const config = getServerVisionConfig();
  const providerName = (requestedProvider || config.provider).toLowerCase().trim();

  switch (providerName) {
    case 'gemini': {
      const gemini = new GeminiVisionProvider({
        apiKey: config.geminiApiKey,
        modelName: config.geminiModel,
        timeoutMs: config.timeoutMs,
      });
      return gemini;
    }

    case 'openai': {
      const openai = new OpenAIVisionProvider({
        apiKey: config.openaiApiKey,
        modelName: config.openaiModel,
        timeoutMs: config.timeoutMs,
      });
      return openai;
    }

    case 'demo':
    case 'mock':
      return new DemoVisionProvider();

    default:
      throw new VisionError({
        message: `Unknown or unsupported vision provider '${providerName}'. Supported: demo, gemini, openai.`,
        code: 'UNSUPPORTED_PROVIDER',
        statusCode: 400,
        provider: providerName,
      });
  }
}

export function listAvailableProviders(): {
  name: VisionProviderType;
  configured: boolean;
  isDefault: boolean;
}[] {
  const config = getServerVisionConfig();
  const demo = new DemoVisionProvider();
  const gemini = new GeminiVisionProvider();
  const openai = new OpenAIVisionProvider();

  return [
    { name: 'demo', configured: demo.isConfigured, isDefault: config.provider === 'demo' },
    { name: 'gemini', configured: gemini.isConfigured, isDefault: config.provider === 'gemini' },
    { name: 'openai', configured: openai.isConfigured, isDefault: config.provider === 'openai' },
  ];
}
