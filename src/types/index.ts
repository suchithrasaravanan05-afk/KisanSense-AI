export type Language = 'en' | 'hi' | 'ta';

export type UserRole = 'farmer' | 'expert' | 'admin';

export interface User {
  id: string;
  name: string;
  phone?: string;
  language: Language;
  role: UserRole;
  created_at: string;
}

export type SoilType = 'sandy' | 'loamy' | 'clay' | 'silt' | 'unknown';
export type IrrigationMethod = 'drip' | 'sprinkler' | 'flood' | 'rain_fed';
export type AreaUnit = 'acre' | 'hectare';

export interface Field {
  id: string;
  user_id: string;
  name: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  area: number;
  area_unit: AreaUnit;
  soil_type: SoilType;
  irrigation_method: IrrigationMethod;
  flow_rate?: number; // Litres per hour
  created_at: string;
}

export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity';

export interface Crop {
  id: string;
  field_id: string;
  crop_name: 'Tomato' | 'Rice' | 'Wheat' | 'Maize' | 'Cotton' | 'Potato';
  variety?: string;
  sowing_date: string;
  growth_stage: GrowthStage;
  expected_harvest_date?: string;
  previous_fertilizer?: string;
  previous_irrigation_date?: string;
}

export interface SoilTest {
  id: string;
  field_id: string;
  test_date: string;
  ph?: number;
  nitrogen?: number; // kg/ha
  phosphorus?: number; // kg/ha
  potassium?: number; // kg/ha
  organic_carbon?: number; // %
  electrical_conductivity?: number; // dS/m
  notes?: string;
}

export type ImageType = 'leaf' | 'field' | 'soil';

export interface CropImage {
  id: string;
  field_id: string;
  image_url: string;
  image_type: ImageType;
  image_quality: number; // 0 - 100
  created_at: string;
}

export type ResultCategory =
  | 'healthy'
  | 'water_stress'
  | 'nitrogen_stress'
  | 'fungal_disease'
  | 'pest_damage'
  | 'uncertain';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ScanResult {
  id: string;
  crop_image_id: string;
  field_id: string;
  crop_name: string;
  image_url?: string;
  result_category: ResultCategory;
  confidence: number; // 0 - 100
  confidence_level: ConfidenceLevel;
  image_quality: number; // 0 - 100
  observed_symptoms: string[];
  explanation: string;
  recommended_next_step: string;
  is_expert_reviewed?: boolean;
  created_at: string;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: number; // Celsius
  relative_humidity: number; // %
  rain_probability: number; // %
  rain_amount: number; // mm in next 24-48h
  wind_speed: number; // km/h
  et0: number; // Reference Evapotranspiration in mm/day
  is_demo: boolean;
  is_stale?: boolean; // True when showing offline cached weather
  stale_since?: string; // Timestamp of when weather data was fetched
  cached_age_display?: string; // Human-friendly age string e.g. "Cached 3h ago"
  timestamp: string;
  city_name?: string;
}

export type SyncActionType =
  | 'create_field'
  | 'create_crop'
  | 'create_soil_test'
  | 'create_activity'
  | 'create_scan'
  | 'create_review';

export interface QueuedSyncItem {
  id: string;
  action_type: SyncActionType;
  title: string;
  description?: string;
  payload: any;
  created_at: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retries?: number;
}

export interface CachedRecommendations {
  irrigationRec?: IrrigationRecommendation;
  fertilizerRec?: FertilizerRecommendation;
  cached_at: string;
}


export interface IrrigationRecommendation {
  id: string;
  field_id: string;
  crop_name: string;
  growth_stage: GrowthStage;
  etc_mm: number;
  net_depth_mm: number;
  water_volume_litres: number;
  irrigation_time_hours: number;
  recommended_time: string;
  efficiency_applied: number;
  rain_forecast_warning?: string;
  is_estimate: boolean;
  is_demo: boolean;
  explanation: string;
  tips: string[];
  created_at: string;
}

export interface FertilizerRecommendation {
  id: string;
  field_id: string;
  crop_name: string;
  growth_stage: GrowthStage;
  has_soil_test: boolean;
  nutrient_status: 'deficient' | 'adequate' | 'surplus' | 'unknown';
  deficiency_suspected?: string;
  recommended_nutrients: {
    nitrogen_kg_ha?: number;
    phosphorus_kg_ha?: number;
    potassium_kg_ha?: number;
    organic_compost_tons_ha?: number;
  };
  suggested_timing: string;
  split_guidance: string[];
  explanation: string;
  soil_test_reminder: string;
  safety_warning: string;
  confidence: ConfidenceLevel;
  created_at: string;
}

export type ActivityType =
  | 'scan'
  | 'irrigation'
  | 'fertilizer'
  | 'soil_test'
  | 'weather_event'
  | 'expert_note';

export interface FieldActivity {
  id: string;
  field_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  activity_date: string;
  completed: boolean;
  image_url?: string;
  farmer_feedback?: 'helpful' | 'unsure' | 'harmful' | 'resolved';
}

export interface ExpertReview {
  id: string;
  scan_result_id: string;
  field_id: string;
  farmer_name: string;
  field_name: string;
  crop_name: string;
  image_url: string;
  ai_category: ResultCategory;
  ai_confidence: number;
  expert_notes: string;
  corrected_result: ResultCategory;
  review_status: 'pending' | 'in_review' | 'resolved';
  created_at: string;
}
