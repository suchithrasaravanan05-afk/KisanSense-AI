export type VisionErrorCode =
  | 'TIMEOUT'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_JSON'
  | 'API_FAILURE'
  | 'VALIDATION_FAILED'
  | 'AUTH_FAILED'
  | 'UNSUPPORTED_PROVIDER';

export class VisionError extends Error {
  public readonly code: VisionErrorCode;
  public readonly statusCode: number;
  public readonly provider: string;
  public readonly originalError?: any;

  constructor(params: {
    message: string;
    code: VisionErrorCode;
    statusCode: number;
    provider: string;
    originalError?: any;
  }) {
    super(params.message);
    this.name = 'VisionError';
    this.code = params.code;
    this.statusCode = params.statusCode;
    this.provider = params.provider;
    this.originalError = params.originalError;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class VisionTimeoutError extends VisionError {
  constructor(provider: string, timeoutMs: number) {
    super({
      message: `Vision provider '${provider}' timed out after ${timeoutMs}ms`,
      code: 'TIMEOUT',
      statusCode: 504,
      provider,
    });
    this.name = 'VisionTimeoutError';
  }
}

export class VisionQuotaError extends VisionError {
  constructor(provider: string, details?: string) {
    super({
      message: `Vision provider '${provider}' quota or rate limit exceeded${details ? `: ${details}` : ''}`,
      code: 'QUOTA_EXCEEDED',
      statusCode: 429,
      provider,
    });
    this.name = 'VisionQuotaError';
  }
}

export class VisionJsonParseError extends VisionError {
  constructor(provider: string, rawText?: string) {
    super({
      message: `Vision provider '${provider}' returned invalid or unparseable JSON: ${rawText ? rawText.substring(0, 100) : ''}`,
      code: 'INVALID_JSON',
      statusCode: 502,
      provider,
    });
    this.name = 'VisionJsonParseError';
  }
}

export class VisionUpstreamError extends VisionError {
  constructor(provider: string, message: string, statusCode = 502, originalError?: any) {
    super({
      message: `Vision provider '${provider}' failed: ${message}`,
      code: 'API_FAILURE',
      statusCode,
      provider,
      originalError,
    });
    this.name = 'VisionUpstreamError';
  }
}

export class VisionValidationError extends VisionError {
  constructor(provider: string, reason: string) {
    super({
      message: `Vision response validation failed for '${provider}': ${reason}`,
      code: 'VALIDATION_FAILED',
      statusCode: 502,
      provider,
    });
    this.name = 'VisionValidationError';
  }
}
