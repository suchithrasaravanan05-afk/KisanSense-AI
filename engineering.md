# KisanSense AI — Technical Implementation Document (engineering.md)

**Architecture Version:** 1.0.0  
**Target Environment:** Node.js v22.14.0 / npm 10.9.2  
**Framework Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Lucide Icons + PWA-Ready Local Storage / IndexedDB Sync

---

## 1. System Architecture Overview

```
                      +-----------------------------------+
                      |      KisanSense AI Web App        |
                      |  (Mobile-First Next.js / React)   |
                      +-----------------+-----------------+
                                        |
       +--------------------------------+--------------------------------+
       |                                |                                |
+------v------+                  +------v------+                  +------v------+
| UI / Client |                  | API Layer   |                  | Offline /   |
| Components  |                  | Route Hndlrs|                  | Client DB   |
+------+------+                  +------+------+                  +------+------+
       |                                |                                |
       |-- i18n (en/hi)                 |-- /api/weather                 |-- LocalStorage
       |-- Image Pre-flight             |-- /api/scan (Gemini/Mock)      |-- IndexedDB
       |-- Agronomic Formulas           |-- /api/fields & crops          |-- Sync Queue
       |-- PWA Service Worker           |-- /api/recommendations         +--------------+
                                        +-------+------------------------+
                                                |
                       +------------------------+------------------------+
                       |                                                 |
             +---------v----------+                            +---------v----------+
             | Open-Meteo Weather |                            | Gemini Vision API  |
             |   (With Fallback)  |                            |   (With Fallback)  |
             +--------------------+                            +--------------------+
```

---

## 2. Data Models & TypeScript Interfaces

All core models are strictly typed in `src/types/index.ts`:

```typescript
export type Language = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'mr' | 'bn';

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
  crop_name: string; // Tomato, Rice, Wheat, Maize, Cotton, Potato
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
  nitrogen?: number; // kg/ha or rating
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
  crop_name: string;
  result_category: ResultCategory;
  confidence: number; // 0 - 100
  confidence_level: ConfidenceLevel;
  image_quality: number;
  observed_symptoms: string[];
  explanation: string;
  recommended_next_step: string;
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
  timestamp: string;
}

export interface IrrigationRecommendation {
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
}

export interface FertilizerRecommendation {
  field_id: string;
  crop_name: string;
  has_soil_test: boolean;
  deficiency_suspected?: string;
  recommended_npk?: { n: number; p: number; k: number; unit: string };
  split_guidance: string[];
  safety_warning: string;
  confidence: ConfidenceLevel;
}

export type ActivityType = 'scan' | 'irrigation' | 'fertilizer' | 'soil_test' | 'weather_event' | 'expert_note';

export interface FieldActivity {
  id: string;
  field_id: string;
  type: ActivityType;
  title: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  activity_date: string;
  completed: boolean;
  farmer_feedback?: 'helpful' | 'unsure' | 'harmful' | 'resolved';
}

export interface ExpertReview {
  id: string;
  scan_result_id: string;
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
```

---

## 3. Agronomic Calculation Engine

### 3.1 Evapotranspiration & Irrigation Formulas
1. **Crop Coefficients ($K_c$ Lookup Table):**
   - Tomato: Initial 0.6, Mid/Flowering 1.15, Late/Harvest 0.8
   - Rice: Initial 1.05, Mid 1.20, Late 0.90
   - Wheat: Initial 0.40, Mid 1.15, Late 0.30
   - Maize: Initial 0.40, Mid 1.20, Late 0.50
   - Cotton: Initial 0.45, Mid 1.15, Late 0.65
   - Potato: Initial 0.50, Mid 1.15, Late 0.75

2. **Formulas Implemented in `src/services/irrigationService.ts`:**
   $$\text{Area } (m^2) = \begin{cases} \text{Area (Acre)} \times 4046.86 \\ \text{Area (Hectare)} \times 10000 \end{cases}$$
   $$ET_c = ET_0 \times K_c$$
   $$\text{Net Water Requirement (mm)} = \max(0, ET_c - \text{Rain Forecast (mm)})$$
   $$\text{Water Volume (Litres)} = \frac{\text{Net Depth (mm)} \times \text{Area } (m^2)}{\text{Irrigation Efficiency}}$$
   *(Efficiencies: Drip = 0.90, Sprinkler = 0.75, Flood = 0.50, Rain-fed = 1.0)*
   $$\text{Pumping Time (Hours)} = \frac{\text{Water Volume (Litres)}}{\text{Pump Flow Rate (Litres/Hour)}}$$

---

## 4. AI Image Analysis Service Specification

### 4.1 Interface Architecture (`src/services/imageAnalysisService.ts`)
- **Pipeline:**
  1. Client pre-flight quality check (HTML5 Canvas: luminance analysis, contrast variance for sharpness/blur, dimension check).
  2. If quality score $< 40$, return warning before backend dispatch.
  3. Dispatch to `/api/scan`:
     - Checks `GEMINI_API_KEY`.
     - If key present: sends structured prompt with image buffer requesting strict JSON schema response.
     - If key missing or request fails: falls back seamlessly to internal heuristic Agronomic Rule-Engine Mock with diagnostic confidence, symptom tags, and scientific limitations.
- **Strict Guardrails:** Never outputs unconditional claims. If confidence $< 50\%$, automatic alert advising daylight rescan and expert triage.

---

## 5. Weather Integration Architecture (`src/services/weatherService.ts`)

- Primary provider: Open-Meteo REST API (`https://api.open-meteo.com/v1/forecast`).
- Query parameters: `latitude`, `longitude`, `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,et0_fao_evapotranspiration`.
- Resilience: If network error or timeout ($>3000\text{ms}$), returns localized demo weather dataset marked `is_demo: true`, without blocking or failing UI rendering.

---

## 6. Internationalization (i18n) Engine

- Central dictionary in `src/i18n/translations.ts`.
- Language hook `useTranslation()` providing reactive string lookups and fallback keys.
- Complete translation coverage for English and Hindi:
  - Navigation, field setup, crop parameters, warnings, irrigation calculations, fertilizer guidance, expert reviews, and safety notices.
