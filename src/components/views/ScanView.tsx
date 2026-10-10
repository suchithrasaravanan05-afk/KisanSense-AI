'use client';

import React, { useState, useRef } from 'react';
import { Field, Crop, Language, ImageType, ScanResult } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { SafetyBanner } from '../SafetyBanner';
import { sampleImageOptions, SampleImageOption } from '../../data/sampleImages';
import {
  evaluateImageQuality,
  analyzeCropImage,
  ImageQualityResult,
} from '../../services/imageAnalysisService';
import { compressImage, CompressionResult } from '../../utils/imageCompressor';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  RefreshCw,
  Sun,
  Eye,
  Sliders,
  Zap,
} from 'lucide-react';

interface ScanViewProps {
  language: Language;
  activeField: Field;
  crop?: Crop;
  onScanCompleted: (result: ScanResult) => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  language,
  activeField,
  crop,
  onScanCompleted,
}) => {
  const t = (key: string) => getTranslation(language, key);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageType, setImageType] = useState<ImageType>('leaf');
  const [selectedCropName, setSelectedCropName] = useState(crop?.crop_name || 'Tomato');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle file ingestion with automatic low-bandwidth client compression
  const handleFile = async (file: File) => {
    setValidationError(null);

    // 1. Validation: file size < 15MB
    if (file.size > 15 * 1024 * 1024) {
      setValidationError(t('imageTooLarge'));
      return;
    }

    // 2. Validation: format
    if (!file.type.startsWith('image/')) {
      setValidationError(
        language === 'ta'
          ? 'தயவுசெய்து சரியான படக் கோப்பைப் (JPEG, PNG, WebP) பதிவேற்றவும்.'
          : language === 'hi'
          ? 'कृपया एक मान्य छवि फ़ाइल (JPEG, PNG, WebP) अपलोड करें।'
          : 'Please upload a valid image file (JPEG, PNG, WebP).'
      );
      return;
    }

    setIsCompressing(true);
    try {
      // Compress large phone photo down to 1280px max dimension and optimized JPEG
      const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.78 });
      setCompressionResult(compressed);
      setPreviewUrl(compressed.compressedDataUrl);

      // Pre-flight image quality check on compressed image
      setIsEvaluating(true);
      const quality = await evaluateImageQuality(compressed.compressedDataUrl);
      setQualityResult(quality);
    } catch (err) {
      console.warn('[ScanView] Image compression failed, falling back to FileReader:', err);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setPreviewUrl(dataUrl);
        setIsEvaluating(true);
        const quality = await evaluateImageQuality(dataUrl);
        setQualityResult(quality);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
      setIsEvaluating(false);
    }
  };

  const handleSelectSample = async (sample: SampleImageOption) => {
    setValidationError(null);
    setSelectedCropName(sample.cropName as any);
    setIsCompressing(true);

    try {
      const compressed = await compressImage(sample.dataUrl, { maxWidth: 1280, maxHeight: 1280, quality: 0.85 });
      setCompressionResult(compressed);
      setPreviewUrl(compressed.compressedDataUrl);

      setIsEvaluating(true);
      const quality = await evaluateImageQuality(compressed.compressedDataUrl);
      setQualityResult({
        ...quality,
        score: sample.quality,
        feedback: sample.quality < 50 ? 'Low light or optical blur detected' : 'Clear daylight sample',
      });
    } catch (e) {
      setPreviewUrl(sample.dataUrl);
    } finally {
      setIsCompressing(false);
      setIsEvaluating(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!previewUrl) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeCropImage({
        fieldId: activeField.id,
        cropName: selectedCropName,
        imageDataUrl: previewUrl,
        imageType,
        imageQualityScore: qualityResult?.score || 80,
      });

      onScanCompleted(result);
    } catch (err: any) {
      setValidationError(
        language === 'ta'
          ? 'படத்தை பகுப்பாய்வு செய்வதில் பிழை ஏற்பட்டது. மற்றொரு புகைப்படத்தைப் பயன்படுத்தவும்.'
          : language === 'hi'
          ? 'छवि का विश्लेषण करने में त्रुटि हुई। कृपया दूसरी फोटो का उपयोग करें।'
          : 'Error processing image. Please try another photo.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-agri-dark">
          {t('scanPageTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-agri-dark/70 mt-1">
          {t('scanSubtitle')} • Target Field: <span className="font-semibold text-agri-primary">{activeField.name}</span>
        </p>
      </div>

      <SafetyBanner language={language} />

      {/* Target Image Type Selector */}
      <div className="bg-white p-4 rounded-3xl border border-[#dde7df] shadow-sm">
        <label className="block text-xs font-bold text-agri-dark uppercase tracking-wider mb-2">
          {t('selectImageType')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setImageType('leaf')}
            className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
              imageType === 'leaf'
                ? 'bg-agri-primary text-white border-agri-primary shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🍃 {t('targetLeaf')}
          </button>
          <button
            type="button"
            onClick={() => setImageType('field')}
            className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
              imageType === 'field'
                ? 'bg-agri-primary text-white border-agri-primary shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🌾 {t('targetField')}
          </button>
          <button
            type="button"
            onClick={() => setImageType('soil')}
            className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
              imageType === 'soil'
                ? 'bg-agri-primary text-white border-agri-primary shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            🪴 {t('targetSoil')}
          </button>
        </div>
      </div>

      {/* Main Upload Dropzone & Camera Trigger */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#dde7df] shadow-card">
        {/* Hidden inputs with aria-labels */}
        <input
          type="file"
          ref={fileInputRef}
          aria-label="Upload crop image file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />
        <input
          type="file"
          ref={cameraInputRef}
          aria-label="Capture photo with device camera"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />

        {previewUrl ? (
          /* Preview Mode with Real-Time Quality Check */
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-2 border-agri-primary/30 max-h-[360px] flex items-center justify-center bg-black/5">
              <img
                src={previewUrl}
                alt="Crop Preview"
                className="max-h-[350px] w-auto object-contain mx-auto"
              />
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setQualityResult(null);
                  setCompressionResult(null);
                }}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white text-agri-dark text-xs font-bold px-3 py-1.5 rounded-xl shadow-md backdrop-blur-sm transition-all"
              >
                {t('changePhoto')}
              </button>
            </div>

            {/* Low-Bandwidth Client-Side Image Compression Badge */}
            {compressionResult && (
              <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>{t('imageCompressionBadge')}</span>
                      {compressionResult.compressionRatioPercent > 0 && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-full font-extrabold">
                          -{compressionResult.compressionRatioPercent}% {t('compressionSavings')}
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] text-emerald-900/80 mt-0.5">
                      {t('compressedFrom')} {compressionResult.formattedOriginalSize} → {t('compressedTo')}{' '}
                      <strong>{compressionResult.formattedCompressedSize}</strong> ({compressionResult.compressedDimensions.width}×{compressionResult.compressedDimensions.height}px)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Score Meter */}
            {qualityResult && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-agri-dark">
                      {t('qualityScore')}:
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        qualityResult.score >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : qualityResult.score >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {qualityResult.score}%
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {t('resolutionLabel')} {qualityResult.resolution.width}×{qualityResult.resolution.height}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      qualityResult.score >= 80
                        ? 'bg-emerald-600'
                        : qualityResult.score >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${qualityResult.score}%` }}
                  />
                </div>

                <p className="text-xs text-agri-dark/80 mt-2 flex items-center gap-1.5">
                  {qualityResult.score >= 50 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span>{qualityResult.feedback}</span>
                </p>
              </div>
            )}

            {/* Analyze Action Button */}
            <div className="pt-2">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="w-full py-4 rounded-2xl bg-agri-primary hover:bg-agri-accent text-white font-bold text-base shadow-lg shadow-agri-primary/25 transition-all flex items-center justify-center gap-2 btn-press"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t('analyzingText')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{t('analyzeBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Empty / Upload Target */
          <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 hover:border-agri-primary/60 rounded-3xl transition-colors">
            <div className="w-16 h-16 rounded-full bg-agri-light text-agri-primary flex items-center justify-center mx-auto mb-3">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-agri-dark">
              {t('uploadPlaceholder')}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {t('supportsFormatDesc')}
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-agri-primary hover:bg-agri-accent text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-agri-primary/20 btn-press"
              >
                <Camera className="w-4 h-4" />
                <span>{t('cameraBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-agri-dark text-xs sm:text-sm font-semibold flex items-center gap-2 btn-press"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{t('fileBtn')}</span>
              </button>
            </div>
          </div>
        )}

        {validationError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Photo Instructions Accordion / Card */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-agri-primary" />
          <h3 className="font-bold text-sm text-agri-dark">
            {t('photoInstructionsTitle')}
          </h3>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-agri-dark/80">
          <li className="flex items-start gap-2">
            <span className="text-agri-primary font-bold">1.</span>
            <span>{t('instruction1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-agri-primary font-bold">2.</span>
            <span>{t('instruction2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-agri-primary font-bold">3.</span>
            <span>{t('instruction3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-agri-primary font-bold">4.</span>
            <span>{t('instruction4')}</span>
          </li>
        </ul>
      </div>

      {/* Quick Test Demo Samples (Requirement for Presentation and Offline Demo) */}
      <div className="bg-white p-5 rounded-3xl border border-[#dde7df] shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-agri-primary" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-agri-dark">
              {t('sampleImagesTitle')}
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">{t('clickToTestImmediate')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sampleImageOptions.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="p-2.5 rounded-2xl border border-gray-200 hover:border-agri-primary/60 bg-gray-50/50 hover:bg-white text-left transition-all flex flex-col group btn-press"
            >
              <img
                src={sample.dataUrl}
                alt={sample.title}
                className="w-full h-24 object-cover rounded-xl border border-gray-200 mb-2 group-hover:scale-[1.02] transition-transform"
              />
              <span className="text-xs font-bold text-agri-dark line-clamp-1">
                {sample.title}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                {sample.condition}
              </span>
              <span
                className={`text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded-md inline-block w-fit ${
                  sample.confidence >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : sample.confidence >= 50
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {sample.confidence}% Conf.
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
