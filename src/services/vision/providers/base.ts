import { VisionAnalysisRequest, VisionAnalysisResponse } from '../types';

export interface IVisionProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisResponse>;
}
