# KisanSense AI — UX & UI Specification (ui.md)

**Design Version:** 1.0.0  
**Design Philosophy:** Trustworthy, Accessible, Mobile-First Agronomy  
**Primary Language Tokens:** English (`en`), Hindi (`hi` - हिन्दी)

---

## 1. Visual Identity & Design System

### 1.1 Color Palette & Semantics
Our palette avoids generic artificial greens or sterile corporate blues. It mirrors healthy foliage, fertile soils, clean irrigation, and high-visibility field indicators.

| Token | Hex Value | Purpose / Semantic Meaning |
| :--- | :--- | :--- |
| `--color-brand-primary` | `#1B5E20` | Deep Forest/Agri Green: Headers, primary buttons, branding |
| `--color-brand-accent` | `#2E7D32` | Growth Green: Active states, success tags, positive indicators |
| `--color-brand-light` | `#E8F5E9` | Light Sprout Green: Pill badges, subtle cards, active backgrounds |
| `--color-bg-canvas` | `#FBFDF9` | Warm Cream/Off-White: Main application background (reduces glare) |
| `--color-bg-card` | `#FFFFFF` | Crisp White: Elevated card surfaces |
| `--color-text-main` | `#142918` | Dark Botanical Green: Body and headings, high contrast WCAG AAA |
| `--color-text-muted` | `#4B5E4F` | Soft Foliage Slate: Secondary labels, metadata, captions |
| `--color-water-blue` | `#0277BD` | Canal Blue: Water planner, irrigation metrics, rainfall indicators |
| `--color-water-bg` | `#E1F5FE` | Crisp Stream: Water card backgrounds, droplet badges |
| `--color-amber-alert` | `#B45309` | Warning Amber: Weather caution, low-confidence warning, soil-missing badge |
| `--color-amber-bg` | `#FEF3C7` | Soft Amber Canvas: Advisory banners, caution alerts |
| `--color-danger` | `#B91C1C` | Crimson Alert: Serious disease outbreaks, extreme drought, destructive pests |
| `--color-border` | `#DDE7DF` | Soft Mineral Grey-Green: Card borders, input outlines |

### 1.2 Typography
- **Primary Latin Font:** `Inter`, `Outfit`, or system `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- **Indic/Devanagari Font:** `Nirmala UI`, `Noto Sans Devanagari`, `system-ui`
- **Scale:**
  - Display Title: `28px` (Mobile) / `34px` (Desktop), Bold (700)
  - Page Heading (`h1`): `22px` (Mobile) / `26px` (Desktop), Semi-Bold (600)
  - Section Heading (`h2`): `18px`, Semi-Bold (600)
  - Card Title (`h3`): `16px`, Medium (500)
  - Body Text: `15px`, Regular (400), Line-Height `1.5`
  - Captions & Meta: `13px`, Regular (400)
  - Button Text: `16px`, Medium (500), min 48px touch height

### 1.3 Iconography & Touch Guidelines
- Clean, agricultural, highly recognizable SVG icons (Leaf, Droplet, Sprout, Sun, CloudRain, Microscope, ShieldCheck, History, UserCheck, AlertTriangle).
- Minimum touch target area for interactive elements: $48 \times 48\text{ px}$.
- Card corners: Smooth rounded radius `16px` (`rounded-2xl`).

---

## 2. Layout Structure & Responsive Architecture

### 2.1 Navigation Model
- **Desktop / Tablet Landscape ($\ge 768\text{px}$):**
  - Left persistent sidebar (width `260px`) with app logo, language toggle, field selector dropdown, primary navigation links with icon + label, and farmer profile badge at the bottom.
  - Main scrollable content canvas (`flex-1 max-w-6xl mx-auto p-6`).
- **Mobile ($\le 767\text{px}$):**
  - Slim top app bar: Logo + Field badge + Language switcher toggle button.
  - Sticky bottom navigation bar (5 primary targets):
    1. **Home / Dashboard** (Icon: Home/Grid)
    2. **Scan Leaf** (Icon: Camera/Scan, prominent floating green pill)
    3. **Water** (Icon: Droplet)
    4. **Nutrients** (Icon: Sprout/Flask)
    5. **Timeline** (Icon: History/Calendar)
  - More drawer / settings available from top profile icon.

---

## 3. Screen Specifications & User Experience Flows

### 3.1 Landing Page (`/` or View Mode `landing`)
- **Hero Section:**
  - Headline: "KisanSense AI: Smarter decisions for healthier fields"
  - Subhead in plain Hindi/English explaining the 3 pillars (Visual health check, precise irrigation schedule, soil-tested fertilizer).
  - Prominent Action Buttons:
    - Primary: **"Open Farmer Dashboard"** (Goes to live workspace)
    - Secondary: **"Try Demo with Sample Data"** (Pre-populates sample fields, scans, and weather)
  - Trust / Safety Banner prominently displayed:  
    `"AI recommendations are estimates and should be verified with local agricultural experts."`
- **Feature Highlights:**
  - 4 Cards: Crop Image Analysis, Water Planner, Soil-Aware Fertilizer, Field History.
  - Interactive Language Toggle demo.

### 3.2 Farmer Dashboard (`/dashboard`)
- **Top Greeting & Field Switcher:**
  - Dynamic greeting ("Namaste Ramesh" / "Good morning Ramesh"), active field selector pill (e.g., "North Tomato Patch - 2.5 Acres").
- **Hero Action Banner / Recommendation Card:**
  - Large card featuring immediate actionable advice: Next scheduled irrigation (e.g., "Water 18mm tomorrow 6:00 AM") or urgent pest alert.
- **Weather Widget:**
  - Current temperature, humidity, rain probability, evapotranspiration estimate ($ET_0$).
  - Clear label: "Live Weather via Open-Meteo" or "Demo Weather (Offline / Fallback)" with quick-refresh button.
- **Quick Action Grid (4 Large Touch Buttons):**
  - Scan Crop Image, Plan Irrigation, Add Soil Test, Add Field Activity.
- **Recent Field Highlights & Alerts:**
  - Health summary, soil test age reminder ("Soil test is 8 months old - time for retesting").

### 3.3 Add Field & Crop Setup Pages
- **Add Field:**
  - Field Name, Location (village/pin), GPS fetch button ("Use current location" with fallback lat/long inputs), Area (numeric) + Unit selector (Acre / Hectare), Soil Type radio/selector with visual representations, Irrigation System selector (Drip, Sprinkler, Flood, Rain-fed), Pump flow rate (L/hr).
- **Crop Setup:**
  - Crop Selector with icons: Tomato, Rice, Wheat, Maize, Cotton, Potato.
  - Variety input, Sowing date picker, Current growth stage visual stepper (Seedling $\to$ Vegetative $\to$ Flowering $\to$ Fruiting/Maturity), expected harvest date.

### 3.4 Crop Scanning & Visual Quality Check Page
- **Upload / Camera Zone:**
  - Big drag-and-drop / tap-to-take photo target.
  - Selection: Leaf / Plant close-up, Whole field, Soil sample.
  - Illustrated guidance cards: "Take photo in daylight", "Keep camera steady and focused", "Include healthy and affected parts".
- **Client-Side Image Quality Evaluation:**
  - Real-time pre-upload analysis assessing brightness, sharpness/blur, and resolution.
  - Quality score gauge (e.g., 88% - Good Quality).
  - Validation checks: File size check ($<10\text{MB}$), format check (JPEG, PNG, WebP).

### 3.5 Scan Result & Advisory Screen
- **Visual Split/Card Layout:**
  - Left/Top: Captured photo with highlighted bounding zone.
  - Right/Bottom: Diagnostic outcome card.
- **Confidence Badges:**
  - High Confidence (Green), Medium Confidence (Amber), Low Confidence (Muted Orange).
  - Prominent scientific safeguard:  
    `"The image suggests Possible Fungal Early Blight (Confidence: 82%). Note: A photograph cannot determine exact chemical dosages. Confirm with local extension officers."`
- **Low Confidence Safeguard UI:**
  - When confidence $< 50\%$ or image quality is poor, big amber banner instructs: *"Image quality low or symptoms ambiguous. Please take a closer shot under sunlight or request extension expert review."*
- **Action Buttons:**
  - "Save to Field Timeline", "Ask an Agricultural Expert", "Re-scan".

### 3.6 Water Planner Page
- **Formula transparency & Inputs:**
  - Selected field & crop automatically pulls stage and area.
  - Live calculation display showing $ET_c = ET_0 \times K_c$.
  - Irrigation efficiency multiplier displayed transparently (e.g., Drip = 90% efficiency).
- **Calculated Results Card:**
  - Estimated net depth in mm.
  - Total water volume in Litres.
  - Pumping time in Hours & Minutes based on pump capacity.
  - Rain forecast radar (if rain $> 10\text{mm}$ predicted in 48 hours, advises: *"Rain predicted; consider postponing irrigation"*).
- **Save Irrigation Plan:** Logs directly to field timeline.

### 3.7 Soil-Aware Fertilizer Guidance Page
- **Soil Test Entry Modal / Form:**
  - pH scale visual slider (acidic, neutral, alkaline).
  - N, P, K numeric inputs (kg/ha) with rating badges (Low, Medium, High).
  - Organic carbon (%) and Electrical Conductivity (EC).
- **Safe Advisory Logic:**
  - If soil test present: Recommends split-dose balanced nutrient schedule (Urea/DAP/MOP ratios) matched to crop growth stage.
  - If soil test **absent**: Shows cautionary educational notice: *"No soil test on record. Precise fertilizer quantity cannot be determined safely. Educational guideline only: do not apply heavy fertilizers."*

### 3.8 Field Timeline & Farmer Feedback Page
- **Interactive Chronological Stream:**
  - Filter by event type: All, Scans, Irrigations, Fertilizers, Soil Tests, Expert Reviews.
  - Each card shows timestamp, photo thumbnail (if any), action taken, and status.
  - Interactive feedback button on past advice: "Did this recommendation help your crop?" (Thumbs Up / Thumbs Down / Resolved).

### 3.9 Agricultural Expert Review Portal
- **Extension Agent Dashboard:**
  - Triage queue of low-confidence or farmer-submitted flags.
  - Detailed view of farmer name, phone/village, field history, uploaded image, AI hypothesis.
  - Verification form: Expert diagnosis input, agronomic prescription, status toggle (Pending $\to$ Reviewed $\to$ Resolved).

### 3.10 Settings, Demo Mode & Language Switcher
- User profile (Farmer name, phone, language preference, units).
- **Instant Demo Switch:** Single button to seed realistic mock data across 3 fields (Tomato, Rice, Wheat) with historical records.
- Agricultural safety disclaimer in full.
- Privacy policy and data storage information.
