-- ==============================================================================
-- KisanSense AI — Sample Database Seed Data (supabase/seed.sql)
-- Populates demo users, fields, crops, soil tests, scans, and timeline events
-- ==============================================================================

-- 1. Create Demo Farmer User
INSERT INTO public.users (id, name, phone, language, role)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Ramesh Patel',
    '+91 98765 43210',
    'en',
    'farmer'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create Demo Agricultural Fields
INSERT INTO public.fields (id, user_id, name, location_name, latitude, longitude, area, area_unit, soil_type, irrigation_method, flow_rate)
VALUES 
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'North Plot - Tomato Block',
    'Wardha, Maharashtra',
    20.745300,
    78.602200,
    2.50,
    'acre',
    'loamy',
    'drip',
    3200.00
),
(
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'East Field - Cotton Block',
    'Wardha, Maharashtra',
    20.749000,
    78.608000,
    4.00,
    'acre',
    'clay',
    'drip',
    4500.00
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'South Acre - Wheat Block',
    'Wardha, Maharashtra',
    20.741000,
    78.598000,
    1.80,
    'acre',
    'sandy',
    'flood',
    2800.00
) ON CONFLICT (id) DO NOTHING;

-- 3. Create Crops
INSERT INTO public.crops (id, field_id, crop_name, variety, sowing_date, growth_stage, expected_harvest_date, previous_fertilizer)
VALUES
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Tomato',
    'Abhinav F1 Hybrid',
    '2026-08-01',
    'flowering',
    '2026-11-20',
    'Vermicompost 2 tons/acre at basal'
),
(
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Cotton',
    'RCH 659 BG II',
    '2026-07-15',
    'vegetative',
    '2026-12-15',
    'DAP 50 kg/acre at sowing'
),
(
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'Wheat',
    'Sharbati Lok-1',
    '2026-09-01',
    'seedling',
    '2026-12-30',
    'Farmyard manure basal application'
) ON CONFLICT (id) DO NOTHING;

-- 4. Create Soil Health Tests
INSERT INTO public.soil_tests (id, field_id, test_date, ph, nitrogen, phosphorus, potassium, organic_carbon, electrical_conductivity, notes)
VALUES
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    '2026-08-10',
    6.80,
    210.00, -- Low (< 280 kg/ha)
    18.50,  -- Medium
    220.00, -- Medium
    0.55,
    0.42,
    'Official KVK Wardha laboratory test. Nitrogen moderately deficient.'
),
(
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    '2026-07-05',
    7.40,
    290.00,
    14.00,
    310.00,
    0.72,
    0.35,
    'Black cotton soil profile. Good water retention capacity.'
) ON CONFLICT (id) DO NOTHING;

-- 5. Create Diagnostic Leaf Scans
INSERT INTO public.scan_results (id, field_id, result_category, confidence, observed_symptoms, explanation, recommended_next_step)
VALUES
(
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'fungal_disease',
    86,
    '["Concentric dark rings with yellow chlorotic halos on lower foliage", "Target-board spot patterns on older leaflets", "Absence of white mycelial powdery bloom"]'::jsonb,
    'Early Blight (Alternaria solani) detected with 86% confidence. Common fungal infection caused by intermittent humidity and warm temperatures.',
    'Prune affected bottom leaves; apply copper oxychloride (3g/L) or mancozeb (2g/L); prevent overhead foliage wetting.'
),
(
    'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'healthy',
    92,
    '["Vibrant dark green canopy", "No necrotic lesions or chlorosis", "Vigorous vegetative node development"]'::jsonb,
    'Cotton foliage displays vigorous vegetative growth with balanced chlorophyll and zero visible pest damage.',
    'Maintain scheduled drip irrigation and monitor weekly for sucking pests (jassids/thrips).'
) ON CONFLICT (id) DO NOTHING;

-- 6. Create Field Activities Timeline
INSERT INTO public.field_activities (field_id, type, title, description, quantity, unit, activity_date, completed, farmer_feedback)
VALUES
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'irrigation',
    'Drip Irrigation Run (Morning)',
    'Delivered daily evapotranspiration water requirement based on Open-Meteo ET0.',
    28500.00,
    'Litres',
    '2026-10-08 06:30:00+00',
    true,
    'helpful'
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'scan',
    'Crop Leaf Diagnosis Scan',
    'Diagnosed Early Blight with 86% confidence. Recommended copper oxychloride spray.',
    NULL,
    NULL,
    '2026-10-07 11:20:00+00',
    true,
    'helpful'
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'fertilizer',
    'Split Dose Top-Dressing',
    'Applied split nitrogen dose for flowering stage.',
    25.00,
    'kg',
    '2026-10-04 08:00:00+00',
    true,
    'helpful'
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'soil_test',
    'Laboratory Soil Test Completed',
    'KVK soil card recorded: pH 6.8, Nitrogen 210 kg/ha, Phosphorus 18.5 kg/ha.',
    NULL,
    NULL,
    '2026-08-10 14:00:00+00',
    true,
    'helpful'
);
