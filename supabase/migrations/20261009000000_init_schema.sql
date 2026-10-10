-- ==============================================================================
-- Migration: 20261009000000_init_schema.sql
-- Description: KisanSense AI Initial Database Schema & RLS Policies
-- Compatibility: PostgreSQL 14+ / Supabase
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'hi', 'ta')),
    role VARCHAR(50) DEFAULT 'farmer' CHECK (role IN ('farmer', 'expert', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. Fields Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) DEFAULT 'Wardha, Maharashtra',
    latitude DECIMAL(10, 6) DEFAULT 20.745300,
    longitude DECIMAL(10, 6) DEFAULT 78.602200,
    area DECIMAL(10, 2) NOT NULL CHECK (area > 0),
    area_unit VARCHAR(20) DEFAULT 'acre' CHECK (area_unit IN ('acre', 'hectare')),
    soil_type VARCHAR(50) DEFAULT 'loamy' CHECK (soil_type IN ('sandy', 'loamy', 'clay', 'silt', 'unknown')),
    irrigation_method VARCHAR(50) DEFAULT 'drip' CHECK (irrigation_method IN ('drip', 'sprinkler', 'flood', 'rain_fed')),
    flow_rate DECIMAL(10, 2) DEFAULT 3000 CHECK (flow_rate >= 0), -- Litres/hr
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. Crops Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL CHECK (crop_name IN ('Tomato', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Potato')),
    variety VARCHAR(150),
    sowing_date DATE NOT NULL,
    growth_stage VARCHAR(50) DEFAULT 'vegetative' CHECK (growth_stage IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'maturity')),
    expected_harvest_date DATE,
    previous_fertilizer TEXT,
    previous_irrigation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. Soil Tests Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.soil_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    ph DECIMAL(4, 2) CHECK (ph IS NULL OR (ph >= 0 AND ph <= 14)),
    nitrogen DECIMAL(10, 2) CHECK (nitrogen IS NULL OR nitrogen >= 0), -- kg/ha
    phosphorus DECIMAL(10, 2) CHECK (phosphorus IS NULL OR phosphorus >= 0), -- kg/ha
    potassium DECIMAL(10, 2) CHECK (potassium IS NULL OR potassium >= 0), -- kg/ha
    organic_carbon DECIMAL(5, 2) CHECK (organic_carbon IS NULL OR organic_carbon >= 0), -- %
    electrical_conductivity DECIMAL(6, 3) CHECK (electrical_conductivity IS NULL OR electrical_conductivity >= 0), -- dS/m
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. Crop Images Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50) DEFAULT 'leaf' CHECK (image_type IN ('leaf', 'field', 'soil')),
    image_quality INT DEFAULT 80 CHECK (image_quality BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. Scan Results Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    crop_image_id UUID REFERENCES public.crop_images(id) ON DELETE SET NULL,
    result_category VARCHAR(100) NOT NULL CHECK (result_category IN ('healthy', 'water_stress', 'nitrogen_stress', 'fungal_disease', 'pest_damage', 'uncertain')),
    confidence INT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
    observed_symptoms JSONB DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    recommended_next_step TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. Recommendations Table (Irrigation & Fertilizer Advice)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('irrigation', 'fertilizer')),
    action VARCHAR(255) NOT NULL,
    quantity DECIMAL(12, 2),
    unit VARCHAR(50),
    reason TEXT NOT NULL,
    confidence VARCHAR(20) DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
    source VARCHAR(50) DEFAULT 'ai_estimate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. Field Activities Table (Timeline History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.field_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('scan', 'irrigation', 'fertilizer', 'soil_test', 'weather_event', 'expert_note')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(12, 2),
    unit VARCHAR(50),
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT TRUE,
    farmer_feedback VARCHAR(50) CHECK (farmer_feedback IS NULL OR farmer_feedback IN ('helpful', 'unsure', 'harmful', 'resolved'))
);

-- ------------------------------------------------------------------------------
-- 9. Expert Reviews Table (Agronomist Triage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_result_id UUID REFERENCES public.scan_results(id) ON DELETE CASCADE,
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    expert_notes TEXT NOT NULL,
    corrected_result VARCHAR(100),
    review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_review', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- Indexes for Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fields_user ON public.fields(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_field ON public.crops(field_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_field ON public.soil_tests(field_id);
CREATE INDEX IF NOT EXISTS idx_activities_field ON public.field_activities(field_id);
CREATE INDEX IF NOT EXISTS idx_scan_results_field ON public.scan_results(field_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.expert_reviews(review_status);

-- ------------------------------------------------------------------------------
-- Row-Level Security (RLS) Setup
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- Default open access policies for anonymous/authenticated access in demo mode:
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read fields" ON public.fields FOR SELECT USING (true);
CREATE POLICY "Allow public insert fields" ON public.fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read crops" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Allow public insert crops" ON public.crops FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read soil_tests" ON public.soil_tests FOR SELECT USING (true);
CREATE POLICY "Allow public insert soil_tests" ON public.soil_tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read activities" ON public.field_activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert activities" ON public.field_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read scans" ON public.scan_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert scans" ON public.scan_results FOR INSERT WITH CHECK (true);
