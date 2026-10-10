# KisanSense AI — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Product Name:** KisanSense AI  
**Tagline:** "Smarter decisions for healthier fields."  
**Core Mission:** Provide an AI-assisted agricultural decision-support application for small and medium-scale farmers that combines visual crop inspection, smart irrigation calculation, and cautious soil-test-grounded nutrient guidance—strictly avoiding false certainty and prioritizing farmer livelihoods and safety.

---

## 1. Product Safety & Scientific Disclaimers (Non-Negotiable)

1. **No Magic Nutrient Diagnosis from Photos:** The application must strictly **never** claim that a single leaf or field photograph alone can determine exact chemical fertilizer amounts (e.g., "apply 42 kg of urea") or exact soil N-P-K concentrations.
2. **Visual Triage with Limitations:** Image analysis produces a *provisional visual hypothesis* with explicit confidence scores, observed symptoms, and clear physical limitations (lighting, angle, pest vs disease ambiguity).
3. **Soil-Test Grounding:** Quantitative fertilizer dosages require verified soil-test values (pH, Available N, P, K, Organic Carbon, EC). In the absence of soil test data, only low-confidence educational agronomic guidelines are provided, with an explicit advisory to perform a laboratory or portable soil test.
4. **Estimates Only:** All irrigation and nutrient outputs must bear the label:  
   > *"AI recommendations are estimates and should be verified with local agricultural extension officers or Krishi Vigyan Kendra (KVK) experts."*

---

## 2. Target Audience & Personas

### Primary Persona: Ramesh Patel (Smallholder Farmer)
- **Profile:** Cultivates 2.5 acres of tomato and wheat in central India; uses an Android smartphone with intermittent 3G/4G connectivity.
- **Pain Points:** Unpredictable rainfall, pest attacks misdiagnosed as nutrient deficiencies, over-application of urea leading to pest vulnerability and soil degradation, high cost of diesel for tube-well pumps.
- **Needs:** Fast, low-bandwidth UI in Hindi or English, large touch targets, visual step-by-step guidance, offline access to field plans, ability to request human expert review.

### Secondary Persona: Dr. Sunita Rao (Agronomist / Extension Officer)
- **Profile:** Agricultural Officer at regional farmer service center.
- **Needs:** Portal to review flagged low-confidence or ambiguous AI diagnoses, inspect farmer-uploaded high-res images, add corrective field notes, and build trust in digital advisory tools.

---

## 3. Supported Languages & Localization Roadmap
- **Phase 1 (Initial Release):** English (`en`), Hindi (`hi` - हिन्दी).
- **Architecture for Expansion:** Zero hardcoded strings. Central dictionary-based i18n system engineered for seamless addition of Telugu (`te`), Tamil (`ta`), Kannada (`kn`), Marathi (`mr`), and Bengali (`bn`).

---

## 4. User Journey & Core Functional Requirements

### 4.1 Onboarding & Field Management
- **FR-1.1 Language Selection:** Persistent language switcher available on navbar and landing page.
- **FR-1.2 Field Creation & Tracking:**
  - Field Name, Location (State/District/Village), Optional GPS Lat/Long auto-fetch or pin drop.
  - Area with unit toggling (Acre vs. Hectare).
  - Soil classification: Sandy, Loamy, Clay, Silt, or Unknown.
  - Irrigation setup: Drip, Sprinkler, Flood, Rain-fed, plus optional pump flow rate (Litres/hour or HP equivalent).
- **FR-1.3 Crop Profile Registration:**
  - Crop selection (Initial supported crops: Tomato, Rice, Wheat, Maize, Cotton, Potato).
  - Variety name, Sowing date, Current growth stage (Seedling, Vegetative, Flowering, Fruiting/Grain Filling, Maturity).
  - Expected harvest date, Last irrigation date, Last fertilizer application history.

### 4.2 Crop Health Visual Triage (Scan Module)
- **FR-2.1 Image Ingestion:** Camera capture or file upload. Supports full field, single leaf, and topsoil images.
- **FR-2.2 Client-Side Pre-Flight Check:** Client-side canvas check for resolution, brightness, blur/sharpness, and size compression (max 10MB input auto-compressed to web-optimized WebP/JPEG under 1MB).
- **FR-2.3 Quality Scoring:** Display 0-100% image quality index with guidance (e.g., "Good daylight", "Image too dark or blurry").
- **FR-2.4 Diagnosis & Confidence Categories:**
  - Output categories: Healthy, Possible Water Stress, Possible Nitrogen/Nutrient Stress, Possible Fungal Disease (e.g., Early Blight, Blast), Possible Pest Damage (e.g., Leaf Miner, Bollworm), Uncertain / Low Reliability.
  - Confidence Badges: High Confidence (>= 80%), Medium Confidence (50-79%), Low Confidence (< 50%).
  - Low-confidence triggers automatic notice: *"The image is not reliable enough for a confident recommendation. Please upload a closer image in daylight or request expert review."*
- **FR-2.5 Expert Escalation:** One-click escalation to queue scan in the Agricultural Expert Review dashboard.

### 4.3 Science-Based Water Planner (Irrigation Module)
- **FR-3.1 Evapotranspiration Calculations:**
  - Crop Evapotranspiration: $ET_c = ET_0 \times K_c$
  - Reference Evapotranspiration ($ET_0$) sourced from Open-Meteo API or regional agronomic seasonal defaults.
  - Crop coefficient ($K_c$) dynamically indexed by crop species and phenological growth stage.
- **FR-3.2 Irrigation Volume Formula:**
  $$\text{Net Depth (mm)} = \max(0, ET_c - \text{Effective Rainfall (mm)})$$
  $$\text{Water Volume (L)} = \frac{\text{Net Depth (mm)} \times \text{Area } (m^2)}{\text{Irrigation Efficiency } (\eta)}$$
  *(Efficiencies: Drip 0.90, Sprinkler 0.75, Flood 0.50, Rain-fed N/A)*
- **FR-3.3 Operating Pump Run-Time:**
  $$\text{Run Time (Hours)} = \frac{\text{Water Volume (L)}}{\text{Pump Flow Rate (L/hr)}}$$
- **FR-3.4 Weather Integration:** Live Open-Meteo weather forecast with precipitation forecast. Fallback to labeled demo weather with retry option upon network failure.

### 4.4 Soil-Aware Nutrient Advisory (Fertilizer Module)
- **FR-4.1 Soil Test Entry:**
  - Soil pH, Available Nitrogen (kg/ha or qualitative Low/Medium/High), Available Phosphorus ($P_2O_5$), Available Potassium ($K_2O$), Organic Carbon (%), Electrical Conductivity (dS/m), and Soil Test Date.
- **FR-4.2 Decision Matrix:**
  - **With Soil Test:** Generates tailored split-dose application schedule (Basal, Vegetative, Flowering stages) referencing ICAR (Indian Council of Agricultural Research) standard packages of practices.
  - **Without Soil Test:** Suppresses exact dosage numbers. Employs guarded educational advisory with strong visual callouts: *"Do not apply large quantities of chemical fertilizer based solely on photographic symptoms. Conduct a soil test at your nearest Krishi Vigyan Kendra."*

### 4.5 Timeline, Field Log & Feedback Loop
- **FR-5.1 Chronological Activity Log:** Tracks scans, irrigations, fertilizer applications, weather events, and expert reviews in a unified interactive timeline.
- **FR-5.2 Action Completion:** Mark recommendations as "Completed" or "Postponed".
- **FR-5.3 Farmer Outcome Feedback:** Rate recommendation helpfulness (Helpful / Unsure / Harmful / Problem Resolved) to close the AI feedback loop.

### 4.6 Expert Review Portal
- **FR-6.1 Extension Agent Worklist:** Filters low-confidence or farmer-escalated scan items.
- **FR-6.2 Audit & Correction:** Extension agent can inspect raw photo, inspect sensor/soil context, overwrite diagnosis, provide tailored remedial advisory, and send back to farmer timeline.

---

## 5. Non-Functional Requirements (NFR)
- **Performance:** Initial page load under 1.8s on 3G simulated network.
- **Accessibility:** High contrast ratios (WCAG AA), 48px minimum touch targets for touch devices.
- **Offline / PWA Readiness:** Service Worker caching of static assets, IndexedDB / LocalStorage persistence for field data and pending logs, offline status banner.
- **Data Privacy & Security:** Zero plain-text API secrets on client. Agronomic disclaimers prominently surfaced on all output screens. Complete ability for farmers to wipe local field data.
