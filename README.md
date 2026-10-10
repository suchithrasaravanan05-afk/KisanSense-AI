# KisanSense AI (किसानसेंस AI)
> **"Smarter decisions for healthier fields."**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

KisanSense AI is a responsive, mobile-first agricultural decision-support web application engineered for small and medium-scale farmers across India and global dryland ecosystems. It integrates visual crop-health triage, scientific Evapotranspiration ($ET_c$) irrigation calculators, laboratory-soil-grounded nutrient advisory, and bilingual accessibility (English, Hindi, and Tamil)—strictly designed to avoid false certainty and protect farmer livelihoods.

---

## ⚠️ Important Product Safety Rule & Agronomic Disclaimers

> **NON-NEGOTIABLE SAFETY MANDATE:**  
> This application **never** claims that a photograph alone can determine exact chemical fertilizer quantities or soil nutrient concentrations. Image analysis delivers a **provisional visual hypothesis** with explicit confidence bounds and blur/lighting limitations. Fertilizer recommendations are strictly dependent on verified soil-test data. When soil data is absent, the system displays guarded educational guidelines and instructs the farmer:  
> *"Do not apply a large quantity of fertilizer based only on this image. Conduct a soil test at your nearest Krishi Vigyan Kendra (KVK)."*

---

## 🌾 Core Capabilities & Architecture

1. **AI Crop Health Visual Triage:**
   - Pre-flight client-side image evaluation (resolution, sharpness, brightness checks).
   - Dynamic client-side JPEG compression down to ~250KB before upload to preserve 2G/3G mobile data.
   - Disease, pest, and abiotic stress detection (Early Blight, Rice Blast, Wheat Rust, Water Stress, Nitrogen Chlorosis).
   - Three confidence tiers: High ($\ge 80\%$), Medium ($50-79\%$), Low ($< 50\%$).
   - Escalation to human agricultural extension officer worklist.

2. **Scientific Water Planner ($ET_c$ Engine):**
   - Live Evapotranspiration formula based on FAO-56 standard: $ET_c = ET_0 \times K_c$.
   - Live weather integration via **Open-Meteo API** with resilient offline fallback cache.
   - Net water volume in Litres: $\text{Litres} = \frac{\text{Net Depth (mm)} \times \text{Area } (m^2)}{\text{Irrigation Efficiency}}$.
   - Operating pump run-time in hours: $\text{Hours} = \frac{\text{Litres}}{\text{Flow Rate (L/hr)}}$.
   - Automatic 48h rain forecast postponement warnings and irrigation method efficiency factors ($90\%$ drip, $75\%$ sprinkler, $50\%$ flood).

3. **Soil-Aware Nutrient Advisory:**
   - Evaluates laboratory soil parameters (pH, N, P, K, Organic Carbon, Electrical Conductivity).
   - Generates stage-specific split-application schedules (Basal, Vegetative, Flowering).
   - Safeguarded against dangerous chemical over-application when soil records are missing.

4. **Field Timeline & Farmer Feedback Loop:**
   - Interactive chronological log of all field actions (scans, waterings, top-dressings, tests, notes).
   - Action completion tracking and outcome rating loop (`Helpful`, `Unsure`, `Harmful`, `Resolved`).

5. **Trilingual Accessibility (English, Hindi, Tamil):**
   - Complete 462-key parity across English, Hindi, and Tamil.
   - Zero hardcoded English strings in UI.
   - Agronomic calculation steps and relative timestamps fully localized.

6. **Offline First & PWA Ready:**
   - Local storage persistence with automatic offline action queuing (`QueuedSyncItem`).
   - Sync modal for viewing and flushing queued actions upon network reconnection.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14.2.15 (App Router) + React 18
- **Language:** TypeScript 5.6
- **Styling:** Tailwind CSS (Custom Earthy Agricultural Palette)
- **Icons:** Lucide React
- **Weather API:** Open-Meteo REST API (Zero API key required)
- **AI Vision Engine:** Pluggable Service Abstraction (`IVisionProvider`)
  - **Providers:** Demo Rule-Engine (`demo`), Google Gemini (`gemini`), OpenAI Vision (`openai`)
  - **Validation & Guardrails:** Strict JSON schema validation, automatic chemical dosage redaction, daylight re-capture prompts on low confidence
  - **Resilience:** Timeout handling via `AbortController`, quota 429 management, malformed JSON recovery, and automatic fallback
- **Database Architecture:** PostgreSQL / Supabase Schema ready (`supabase/migrations/`)

---

## 💻 Run locally

Follow these step-by-step instructions to run KisanSense AI on your local machine:

### 1. Prerequisites
- **Node.js:** v18.17.0 or higher (v20+ recommended). Check with:
  ```bash
  node -v
  ```
- **npm:** v9.0.0 or higher. Check with:
  ```bash
  npm -v
  ```
- **Git:** Installed on your system.

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/kisansense-ai.git
cd kisansense-ai
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env.local
```
*(On Windows PowerShell: `Copy-Item .env.example .env.local`)*

Open `.env.local` in your editor. By default, KisanSense AI runs in **zero-config demo mode** without requiring any paid API keys:
```env
VISION_PROVIDER=demo
VISION_TIMEOUT_MS=15000
VISION_FALLBACK_TO_DEMO=true
PORT=3000
```
If you wish to enable live AI vision models, add your Google Gemini or OpenAI API key:
```env
VISION_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...your_gemini_key...
GEMINI_MODEL=gemini-1.5-flash
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 6. Run the Test Suites
Run the full TypeScript QA suite and accessibility audits:
```bash
# Type check:
npx tsc --noEmit

# Comprehensive User Journey Verification (55 tests):
npx ts-node -P tsconfig.scripts.json scripts/comprehensive_qa_runner.ts

# Accessibility & Mobile Responsive Audit (13 tests):
npx ts-node -P tsconfig.scripts.json scripts/accessibility_responsive_audit.ts
```

---

## 🚀 Deploy

KisanSense AI is built to deploy seamlessly to modern serverless and cloud database environments.

### 1. Deploying to Vercel (Recommended)

#### Option A: Deploy via Vercel Web Dashboard (Easiest)
1. Push your repository to **GitHub** or **GitLab**.
2. Go to [vercel.com/new](https://vercel.com/new) and import your `kisansense-ai` repository.
3. In the **Configure Project** screen:
   - **Framework Preset:** Next.js (automatically detected).
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Expand **Environment Variables** and enter the following keys:
   | Variable | Value / Description | Required? |
   | :--- | :--- | :---: |
   | `VISION_PROVIDER` | `demo` (or `gemini` / `openai`) | Yes |
   | `VISION_TIMEOUT_MS` | `15000` | Yes |
   | `VISION_FALLBACK_TO_DEMO` | `true` | Yes |
   | `GEMINI_API_KEY` | Your Google AI Studio API key | Optional (if using Gemini) |
   | `GEMINI_MODEL` | `gemini-1.5-flash` | Optional |
   | `OPENAI_API_KEY` | Your OpenAI API key | Optional (if using OpenAI) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Optional |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key | Optional |
5. Click **Deploy**. Your application will be live at `https://your-project.vercel.app` in under 2 minutes.

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally if not already installed
npm install -g vercel

# Log in to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

### 2. Setting Up Cloud Database on Supabase

KisanSense AI comes with full PostgreSQL database schema and seed fixtures configured for Supabase.

#### A. Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com/) and create a new project.
2. Note your **Database Password** and select the region closest to your primary user base (e.g., `ap-south-1` Mumbai).

#### B. Run Database Migrations
1. In your Supabase Dashboard, navigate to the **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open [`supabase/migrations/20261009000000_init_schema.sql`](file:///supabase/migrations/20261009000000_init_schema.sql) in this repository, copy its entire contents, paste it into the SQL Editor, and click **Run**.
4. The script creates:
   - `users`
   - `fields`
   - `crops`
   - `soil_tests`
   - `crop_images`
   - `scan_results`
   - `recommendations`
   - `field_activities`
   - `expert_reviews`
   - Indexes and Row Level Security (RLS) policies.

#### C. Seed Sample Demonstration Data
1. In the Supabase **SQL Editor**, open another **New Query**.
2. Open [`supabase/seed.sql`](file:///supabase/seed.sql) in this repository, copy its contents, paste it into the editor, and click **Run**.
3. This populates realistic Indian smallholder farms, crops (Tomato, Cotton, Wheat), KVK laboratory soil cards, leaf spot scans, and irrigation timeline records.

#### D. Link Supabase to Vercel
1. In your Supabase Dashboard, go to **Project Settings > API**.
2. Copy:
   - **Project URL**
   - **anon / public key**
3. In your Vercel Dashboard, add them under **Project Settings > Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......
   ```
4. Trigger a redeploy in Vercel.

---

### 3. Self-Hosted Docker / Node.js Production Server

You can also run KisanSense AI on any Linux VPS or container platform (AWS EC2, Google Cloud Run, Railway, DigitalOcean):

```bash
# 1. Build the optimized production bundle
npm run build

# 2. Start the production server
npm run start
```
The server will start listening on port `3000` (or the port specified by `$PORT`).

---

## 🔒 Security & Secrets Management

- **Zero Hardcoded Secrets:** All API keys, passwords, and tokens are read exclusively from `process.env`.
- **Git Protection:** The repository includes a strict `.gitignore` that prevents `.env*.local`, `.next`, and build artifacts from ever being committed.
- **Production Headers:** `next.config.js` sets strict security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(self), geolocation=(self)`
  - `poweredByHeader: false` (removes Next.js signature).

---

## 📸 Image Upload & Processing Limits

| Parameter | Limit | Enforcement Mechanism |
| :--- | :---: | :--- |
| **Max Raw Upload Size** | **15 MB** | Client-side validation in `ScanView.tsx` rejects files $> 15\text{MB}$ before processing. |
| **Max API Request Payload** | **20 MB (base64)** | Server-side validation in `/api/scan` returns HTTP 413 `PAYLOAD_TOO_LARGE`. |
| **Client Compression** | **1280px / 0.78 JPEG** | Automatically compresses photos using HTML5 Canvas before network transmission, reducing payload size by ~85% (down to ~200KB). |
| **Supported Image Formats** | **JPEG, PNG, WebP** | MIME-type validated in `ScanView.tsx` with trilingual rejection notices. |
| **Image Quality Evaluation** | **Score 0 – 100** | Canvas pixel analysis tests brightness ($0-255$) and sharpness. Flags blurry or low-light photos. |

---

## 📡 API Routes Configuration

### 1. `POST /api/scan`
- **Route Segment Config:** `export const dynamic = 'force-dynamic'`, `export const maxDuration = 30`
- **Request Body:**
  ```json
  {
    "cropName": "Tomato",
    "imageDataUrl": "data:image/jpeg;base64,...",
    "qualityScore": 85,
    "imageType": "leaf",
    "provider": "demo",
    "strictErrors": false
  }
  ```
- **Response Format:**
  ```json
  {
    "result_category": "fungal_disease",
    "confidence": 86,
    "image_quality": 85,
    "observed_symptoms": [
      "Concentric dark rings with yellow halos on lower foliage"
    ],
    "explanation": "Early Blight (Alternaria solani) detected...",
    "recommended_next_step": "Prune infected lower foliage; apply copper oxychloride (3g/L)..."
  }
  ```
- **Status Codes:** `200 OK`, `400 Bad Request`, `413 Payload Too Large`, `429 Quota Exceeded`, `504 Timeout`.

### 2. `GET /api/weather`
- **Route Segment Config:** `export const dynamic = 'force-dynamic'`, `export const maxDuration = 10`
- **Query Parameters:** `lat` (latitude), `lon` (longitude), `simulate_fail` (boolean)
- **Response Format:** Real-time Open-Meteo meteorological metrics (Temperature, Relative Humidity, Wind Speed, 48h Precipitation, and ET₀ Evapotranspiration).
- **Offline Fallback:** If upstream Open-Meteo is unreachable, returns fallback dataset with `is_demo: true` and `is_stale: true` rather than throwing a fatal 500 error.

---

## 📋 Status of Features (Live vs. Demo Mode)

To provide complete transparency for production evaluators:

| Feature | Operational Mode | Notes & Production Readiness |
| :--- | :---: | :--- |
| **Weather Integration** | **LIVE** | Fetches live meteorological data directly from the **Open-Meteo REST API** based on field GPS coordinates. Falls back to cached estimates if offline. |
| **Water Requirement ($ET_c$) Calculator** | **LIVE** | Fully operational mathematical engine implementing FAO-56 Penman-Monteith crop coefficients ($K_c$), soil infiltration, pump flow-rate runtimes, and rain forecast adjustments. |
| **Soil-Test Fertilizer Guidance** | **LIVE** | Fully operational ICAR nutrient model. Calculates N-P-K mineral splits and enforces strict safety disclaimers when lab tests are missing. |
| **Data Persistence & Offline Sync** | **LIVE** | Fully operational via client `localStorage` with offline action queuing (`QueuedSyncItem`). Compatible with PostgreSQL / Supabase via `schema.sql`. |
| **Multilingual Engine** | **LIVE** | Fully operational across English, Hindi, and Tamil with 462-key parity and zero missing translations. |
| **Crop Leaf Image Analysis** | **CONFIGURABLE (DEMO DEFAULT)** | Defaults to deterministic agronomic rule-engine and sample fixtures (`VISION_PROVIDER=demo`). **Can be switched to LIVE** by setting `VISION_PROVIDER=gemini` or `VISION_PROVIDER=openai` along with the corresponding API key in `.env.local` or Vercel. |
| **Agronomist Expert Review Escalation** | **DEMO / LOCAL** | Escalated reviews are saved to the local offline timeline and displayed in the agronomist portal tab. To connect to an SMS/WhatsApp/Email dispatch gateway, configure a webhook in `handleAskExpert`. |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. Built for smallholder farmers with scientific agronomic integrity.
