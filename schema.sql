-- ==============================================================================
-- KisanSense AI — PostgreSQL / Supabase Database Schema
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en',
    role VARCHAR(50) DEFAULT 'farmer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fields Table
CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    area DECIMAL(10, 2) NOT NULL,
    area_unit VARCHAR(20) DEFAULT 'acre', -- 'acre' or 'hectare'
    soil_type VARCHAR(50) DEFAULT 'loamy', -- 'sandy', 'loamy', 'clay', 'silt', 'unknown'
    irrigation_method VARCHAR(50) DEFAULT 'drip', -- 'drip', 'sprinkler', 'flood', 'rain_fed'
    flow_rate DECIMAL(10, 2) DEFAULT 3000, -- Litres per hour
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crops Table
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    crop_name VARCHAR(100) NOT NULL, -- 'Tomato', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Potato'
    variety VARCHAR(150),
    sowing_date DATE NOT NULL,
    growth_stage VARCHAR(50) DEFAULT 'vegetative', -- 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturity'
    expected_harvest_date DATE,
    previous_fertilizer TEXT,
    previous_irrigation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Soil Tests Table
CREATE TABLE IF NOT EXISTS soil_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    ph DECIMAL(4, 2),
    nitrogen DECIMAL(10, 2), -- kg/ha
    phosphorus DECIMAL(10, 2), -- kg/ha
    potassium DECIMAL(10, 2), -- kg/ha
    organic_carbon DECIMAL(5, 2), -- percentage
    electrical_conductivity DECIMAL(6, 3), -- dS/m
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crop Images Table
CREATE TABLE IF NOT EXISTS crop_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50) DEFAULT 'leaf', -- 'leaf', 'field', 'soil'
    image_quality INT DEFAULT 80, -- 0 to 100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Scan Results Table
CREATE TABLE IF NOT EXISTS scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_image_id UUID REFERENCES crop_images(id) ON DELETE CASCADE,
    result_category VARCHAR(100) NOT NULL, -- 'healthy', 'water_stress', 'nitrogen_stress', 'fungal_disease', 'pest_damage', 'uncertain'
    confidence INT NOT NULL, -- 0 to 100
    observed_symptoms JSONB DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    recommended_next_step TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'irrigation' or 'fertilizer'
    action VARCHAR(255) NOT NULL,
    quantity DECIMAL(12, 2),
    unit VARCHAR(50),
    reason TEXT NOT NULL,
    confidence VARCHAR(20) DEFAULT 'high', -- 'high', 'medium', 'low'
    source VARCHAR(50) DEFAULT 'ai_estimate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Field Activities Table
CREATE TABLE IF NOT EXISTS field_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'scan', 'irrigation', 'fertilizer', 'soil_test', 'weather_event', 'expert_note'
    title VARCHAR(255) NOT NULL,
    quantity DECIMAL(12, 2),
    unit VARCHAR(50),
    notes TEXT,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT TRUE,
    farmer_feedback VARCHAR(50), -- 'helpful', 'unsure', 'harmful', 'resolved'
    feedback_id UUID,
    feedback_status VARCHAR(50), -- 'done', 'partly_done', 'not_done'
    actual_quantity DECIMAL(12, 2),
    actual_unit VARCHAR(50),
    completed_date TIMESTAMP WITH TIME ZONE,
    outcome VARCHAR(50), -- 'improved', 'no_change', 'got_worse', 'too_early'
    outcome_date TIMESTAMP WITH TIME ZONE,
    outcome_note TEXT,
    follow_up_image_url TEXT
);

-- 9. Expert Reviews Table
CREATE TABLE IF NOT EXISTS expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_result_id UUID REFERENCES scan_results(id) ON DELETE CASCADE,
    expert_notes TEXT NOT NULL,
    corrected_result VARCHAR(100) NOT NULL,
    review_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_review', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Field Feedback & Outcome Records Table
CREATE TABLE IF NOT EXISTS field_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    recommendation_id VARCHAR(100),
    recommendation_title VARCHAR(255) NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- 'irrigation', 'fertilizer', 'scan', 'soil_test', 'general'
    status VARCHAR(50) NOT NULL, -- 'done', 'partly_done', 'not_done'
    completed_date TIMESTAMP WITH TIME ZONE,
    actual_quantity DECIMAL(12, 2),
    actual_unit VARCHAR(50),
    farmer_note TEXT,
    outcome VARCHAR(50), -- 'improved', 'no_change', 'got_worse', 'too_early'
    outcome_date TIMESTAMP WITH TIME ZONE,
    outcome_note TEXT,
    follow_up_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rapid timeline, field, and feedback queries
CREATE INDEX IF NOT EXISTS idx_fields_user ON fields(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_field ON crops(field_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_field ON soil_tests(field_id);
CREATE INDEX IF NOT EXISTS idx_activities_field ON field_activities(field_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON expert_reviews(review_status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_field ON field_feedbacks(field_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_rec ON field_feedbacks(recommendation_id);
