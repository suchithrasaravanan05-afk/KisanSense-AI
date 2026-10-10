import {
  User,
  Field,
  Crop,
  SoilTest,
  ScanResult,
  FieldActivity,
  ExpertReview,
  WeatherData
} from '../types';
import { sampleImageOptions } from './sampleImages';

export const initialUser: User = {
  id: 'user-ramesh-01',
  name: 'Ramesh Patel',
  phone: '+91 98765 43210',
  language: 'en',
  role: 'farmer',
  created_at: '2026-01-15T09:00:00Z',
};

export const initialFields: Field[] = [
  {
    id: 'field-tomato-01',
    user_id: 'user-ramesh-01',
    name: 'North Well Tomato Plot',
    location_name: 'Wardha, Maharashtra',
    latitude: 20.7453,
    longitude: 78.6022,
    area: 2.5,
    area_unit: 'acre',
    soil_type: 'loamy',
    irrigation_method: 'drip',
    flow_rate: 3200, // 3200 L/hr
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'field-rice-02',
    user_id: 'user-ramesh-01',
    name: 'Canal Lowland Rice Paddy',
    location_name: 'Wardha, Maharashtra',
    latitude: 20.7512,
    longitude: 78.5980,
    area: 3.8,
    area_unit: 'acre',
    soil_type: 'clay',
    irrigation_method: 'flood',
    flow_rate: 5500,
    created_at: '2026-02-05T10:30:00Z',
  },
  {
    id: 'field-wheat-03',
    user_id: 'user-ramesh-01',
    name: 'East Ridge Wheat Block',
    location_name: 'Wardha, Maharashtra',
    latitude: 20.7601,
    longitude: 78.6145,
    area: 1.5,
    area_unit: 'hectare',
    soil_type: 'sandy',
    irrigation_method: 'sprinkler',
    flow_rate: 4000,
    created_at: '2026-02-12T14:15:00Z',
  },
];

export const initialCrops: Crop[] = [
  {
    id: 'crop-tomato-01',
    field_id: 'field-tomato-01',
    crop_name: 'Tomato',
    variety: 'Arka Rakshak F1',
    sowing_date: '2026-08-10',
    growth_stage: 'flowering',
    expected_harvest_date: '2026-11-20',
    previous_fertilizer: 'DAP 50kg + 10T FYM Basal dose',
    previous_irrigation_date: '2026-10-04',
  },
  {
    id: 'crop-rice-02',
    field_id: 'field-rice-02',
    crop_name: 'Rice',
    variety: 'MTU 1010',
    sowing_date: '2026-07-28',
    growth_stage: 'vegetative',
    expected_harvest_date: '2026-11-30',
    previous_fertilizer: 'Urea 30kg Top Dressing',
    previous_irrigation_date: '2026-10-05',
  },
  {
    id: 'crop-wheat-03',
    field_id: 'field-wheat-03',
    crop_name: 'Wheat',
    variety: 'Shriram Super 303',
    sowing_date: '2026-09-15',
    growth_stage: 'seedling',
    expected_harvest_date: '2027-01-25',
    previous_fertilizer: 'Single Super Phosphate 60kg',
    previous_irrigation_date: '2026-10-01',
  },
];

export const initialSoilTests: SoilTest[] = [
  {
    id: 'soil-test-01',
    field_id: 'field-tomato-01',
    test_date: '2026-05-18',
    ph: 6.8, // Ideal slightly acidic to neutral
    nitrogen: 240, // Medium-low (kg/ha)
    phosphorus: 28, // Medium (kg/ha)
    potassium: 195, // High (kg/ha)
    organic_carbon: 0.65, // % Medium
    electrical_conductivity: 0.42, // dS/m Normal
    notes: 'KVK Wardha Lab Report #892. Recommends nitrogen top dressing and organic mulch.',
  },
  {
    id: 'soil-test-02',
    field_id: 'field-rice-02',
    test_date: '2026-06-02',
    ph: 7.4,
    nitrogen: 190, // Low
    phosphorus: 18, // Low
    potassium: 160, // Medium
    organic_carbon: 0.52,
    electrical_conductivity: 0.61,
    notes: 'Soil requires zinc sulfate and balanced nitrogen split.',
  },
  // Note: field-wheat-03 intentionally has NO soil test record to test the missing soil test safety alert!
];

export const initialScanResults: ScanResult[] = [
  {
    id: 'scan-tomato-01',
    crop_image_id: 'img-tomato-01',
    field_id: 'field-tomato-01',
    crop_name: 'Tomato',
    image_url: sampleImageOptions[0].dataUrl,
    result_category: 'fungal_disease',
    confidence: 86,
    confidence_level: 'high',
    image_quality: 92,
    observed_symptoms: [
      'Concentric circular brown/black target lesions',
      'Chlorotic yellow halo around lesions',
      'Initial symptom expression on older, lower foliage',
    ],
    explanation: 'The observed concentric ring patterns strongly match Early Blight fungus (Alternaria solani), common in warm, humid weather. Spores propagate via soil splash.',
    recommended_next_step: 'Prune infected lower foliage. Ensure drip irrigation rather than overhead spraying to keep leaves dry. Consult agricultural extension officer for biological (Trichoderma) or copper-based fungicide advisories.',
    is_expert_reviewed: false,
    created_at: '2026-10-06T11:20:00Z',
  },
  {
    id: 'scan-rice-02',
    crop_image_id: 'img-rice-02',
    field_id: 'field-rice-02',
    crop_name: 'Rice',
    image_url: sampleImageOptions[1].dataUrl,
    result_category: 'fungal_disease',
    confidence: 84,
    confidence_level: 'high',
    image_quality: 89,
    observed_symptoms: [
      'Spindle-shaped diamond lesions on leaf blades',
      'Grey/ash-colored necrotic center with brown margins',
      'Higher severity on high-density vegetative tillers',
    ],
    explanation: 'The visual symptoms indicate probable Rice Blast fungus, often triggered by cool nights, high humidity, and excess urea application.',
    recommended_next_step: 'Avoid excess split application of chemical nitrogen fertilizer. Maintain optimal field water levels. Take sample to local KVK agronomist for confirmation before spraying tricyclazole or validamycin.',
    is_expert_reviewed: true,
    created_at: '2026-10-05T14:40:00Z',
  },
  {
    id: 'scan-wheat-03',
    crop_image_id: 'img-wheat-03',
    field_id: 'field-wheat-03',
    crop_name: 'Wheat',
    image_url: sampleImageOptions[6].dataUrl,
    result_category: 'uncertain',
    confidence: 38,
    confidence_level: 'low',
    image_quality: 34,
    observed_symptoms: [
      'Severe optical blur and lens defocus',
      'Insufficient contrast to isolate fungal lesions or pest punctures',
    ],
    explanation: 'The image resolution and lighting are insufficient for reliable machine learning diagnosis. Inconclusive symptoms.',
    recommended_next_step: 'The image is not reliable enough for a confident recommendation. Please upload a closer image in daylight or request extension expert review.',
    is_expert_reviewed: false,
    created_at: '2026-10-06T09:15:00Z',
  },
];

export const initialActivities: FieldActivity[] = [
  {
    id: 'act-01',
    field_id: 'field-tomato-01',
    type: 'scan',
    title: 'Crop Leaf Scan: Possible Early Blight',
    description: 'Diagnosed Early Blight with 86% confidence. Recommended foliage pruning & drip-only watering.',
    activity_date: '2026-10-06T11:20:00Z',
    completed: true,
    farmer_feedback: 'helpful',
    image_url: sampleImageOptions[0].dataUrl,
  },
  {
    id: 'act-02',
    field_id: 'field-tomato-01',
    type: 'irrigation',
    title: 'Drip Irrigation Applied',
    description: 'Applied 16.5 mm net depth (74,000 Litres) via Drip line for 23 hours equivalent split across 3 sessions.',
    quantity: 74000,
    unit: 'Litres',
    activity_date: '2026-10-04T07:00:00Z',
    completed: true,
    farmer_feedback: 'resolved',
  },
  {
    id: 'act-03',
    field_id: 'field-tomato-01',
    type: 'fertilizer',
    title: 'First Top Dressing Applied',
    description: 'Applied 25kg Neem-coated Urea & 15kg MOP as per split recommendation.',
    quantity: 40,
    unit: 'kg',
    activity_date: '2026-09-28T09:30:00Z',
    completed: true,
    farmer_feedback: 'helpful',
  },
  {
    id: 'act-04',
    field_id: 'field-tomato-01',
    type: 'soil_test',
    title: 'KVK Laboratory Soil Test Recorded',
    description: 'pH 6.8, Medium Nitrogen (240 kg/ha), High Potash (195 kg/ha). Organic carbon 0.65%.',
    activity_date: '2026-05-18T10:00:00Z',
    completed: true,
  },
  {
    id: 'act-05',
    field_id: 'field-rice-02',
    type: 'scan',
    title: 'Paddy Leaf Inspection: Rice Blast Alert',
    description: 'Spindle-shaped spots detected. Extension officer verified.',
    activity_date: '2026-10-05T14:40:00Z',
    completed: true,
    farmer_feedback: 'helpful',
    image_url: sampleImageOptions[1].dataUrl,
  },
  {
    id: 'act-06',
    field_id: 'field-rice-02',
    type: 'irrigation',
    title: 'Basin Flood Irrigation',
    description: 'Flooded field till 50mm standing water depth for tillering stage.',
    quantity: 180000,
    unit: 'Litres',
    activity_date: '2026-10-05T06:30:00Z',
    completed: true,
  },
  {
    id: 'act-07',
    field_id: 'field-wheat-03',
    type: 'scan',
    title: 'Uncertain Scan — Escalated to Expert',
    description: 'Blurry photo flagged with low confidence. Submitted to extension expert queue.',
    activity_date: '2026-10-06T09:15:00Z',
    completed: false,
    image_url: sampleImageOptions[6].dataUrl,
  },
];

export const initialExpertReviews: ExpertReview[] = [
  {
    id: 'review-wheat-01',
    scan_result_id: 'scan-wheat-03',
    field_id: 'field-wheat-03',
    farmer_name: 'Ramesh Patel',
    field_name: 'East Ridge Wheat Block',
    crop_name: 'Wheat',
    image_url: sampleImageOptions[6].dataUrl,
    ai_category: 'uncertain',
    ai_confidence: 38,
    expert_notes: 'Image is defocussed. However, yellowing near leaf tip points toward mild Crown Root stage moisture stress or low nitrogen. Farmer should retake photo in morning daylight.',
    corrected_result: 'nitrogen_stress',
    review_status: 'pending',
    created_at: '2026-10-06T09:20:00Z',
  },
  {
    id: 'review-rice-02',
    scan_result_id: 'scan-rice-02',
    field_id: 'field-rice-02',
    farmer_name: 'Ramesh Patel',
    field_name: 'Canal Lowland Rice Paddy',
    crop_name: 'Rice',
    image_url: sampleImageOptions[1].dataUrl,
    ai_category: 'fungal_disease',
    ai_confidence: 84,
    expert_notes: 'Confirmed Early Blast lesions on leaf margins. Advised farmer to withhold excess urea and spray Tricyclazole 75 WP @ 0.6g per litre of water.',
    corrected_result: 'fungal_disease',
    review_status: 'resolved',
    created_at: '2026-10-05T16:00:00Z',
  },
];

export const demoWeatherData: WeatherData = {
  latitude: 20.7453,
  longitude: 78.6022,
  city_name: 'Wardha, Maharashtra',
  temperature: 29.5,
  relative_humidity: 62,
  rain_probability: 25,
  rain_amount: 2.0, // 2mm expected
  wind_speed: 11.2,
  et0: 4.8, // mm/day
  is_demo: true,
  timestamp: new Date().toISOString(),
};
