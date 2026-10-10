import {
  Field,
  Crop,
  SoilTest,
  FertilizerRecommendation,
  GrowthStage,
} from '../types';

// ICAR Standard baseline fertilizer requirements (N-P-K kg/hectare) for optimal yield
const CROP_BASE_NPK_HA: Record<string, { n: number; p: number; k: number }> = {
  Tomato: { n: 120, p: 60, k: 60 },
  Rice: { n: 100, p: 50, k: 50 },
  Wheat: { n: 120, p: 60, k: 40 },
  Maize: { n: 120, p: 60, k: 40 },
  Cotton: { n: 100, p: 50, k: 50 },
  Potato: { n: 150, p: 80, k: 100 },
};

export function generateFertilizerRecommendation(
  field: Field,
  crop: Crop,
  soilTest?: SoilTest
): FertilizerRecommendation {
  const base = CROP_BASE_NPK_HA[crop.crop_name] || { n: 100, p: 50, k: 50 };

  // Convert field area to hectare equivalent for proportional dosage
  const areaInHa = field.area_unit === 'acre' ? field.area * 0.404686 : field.area;

  // CASE 1: NO SOIL TEST AVAILABLE (STRICT SAFETY COMPLIANCE)
  if (!soilTest || (soilTest.nitrogen === undefined && soilTest.ph === undefined)) {
    return {
      id: `rec-fert-${Date.now()}`,
      field_id: field.id,
      crop_name: crop.crop_name,
      growth_stage: crop.growth_stage,
      has_soil_test: false,
      nutrient_status: 'unknown',
      deficiency_suspected: 'Unverified without chemical soil testing',
      recommended_nutrients: {
        // Zero exact chemical dosages given!
        organic_compost_tons_ha: Math.round(5 * areaInHa * 10) / 10,
      },
      suggested_timing: 'Obtain laboratory soil analysis before applying synthetic fertilizers.',
      split_guidance: [
        'Standard Agronomic Guideline: Prioritize well-rotted Farmyard Manure (FYM) or Vermicompost (3-5 tonnes/ha equivalent) to enhance soil organic carbon.',
        'Do not apply large doses of chemical nitrogen (Urea) without soil N test, as excess nitrogen promotes succulent foliage prone to pest and fungal attacks.',
        'Visit your block Krishi Vigyan Kendra (KVK) or soil health testing laboratory to generate an official Soil Health Card.'
      ],
      explanation: `No verified soil test record exists for ${field.name}. Agronomic science dictates that nutrient buffering capacity and native fertility cannot be assessed from plant appearance alone.`,
      soil_test_reminder: 'Crucial: Record a laboratory soil test to unlock customized N-P-K mineral fertilizer calculations.',
      safety_warning: 'Do not apply a large quantity of fertilizer based only on this image. Visual chlorosis can easily be confused with root rot, salinity, nematode damage, or viral pathogens.',
      confidence: 'low',
      created_at: new Date().toISOString(),
    };
  }

  // CASE 2: SOIL TEST DATA IS AVAILABLE
  const ph = soilTest.ph || 7.0;
  const soilN = soilTest.nitrogen || 250; // kg/ha
  const soilP = soilTest.phosphorus || 20; // kg/ha
  const soilK = soilTest.potassium || 180; // kg/ha

  // Soil Nutrient Rating Adjustments (Indian Soil Science Standards)
  // Low (< 280 N, < 10 P, < 110 K) -> +25%
  // Medium (280-560 N, 10-25 P, 110-280 K) -> Standard 100%
  // High (> 560 N, > 25 P, > 280 K) -> -25%
  const nFactor = soilN < 280 ? 1.25 : soilN > 560 ? 0.75 : 1.0;
  const pFactor = soilP < 15 ? 1.25 : soilP > 35 ? 0.75 : 1.0;
  const kFactor = soilK < 120 ? 1.25 : soilK > 280 ? 0.75 : 1.0;

  const targetN_ha = Math.round(base.n * nFactor);
  const targetP_ha = Math.round(base.p * pFactor);
  const targetK_ha = Math.round(base.k * kFactor);

  const totalN_field = Math.round(targetN_ha * areaInHa);
  const totalP_field = Math.round(targetP_ha * areaInHa);
  const totalK_field = Math.round(targetK_ha * areaInHa);

  // Growth-stage split strategy
  const split_guidance: string[] = [];
  if (crop.growth_stage === 'seedling') {
    split_guidance.push(`Basal Dose: Apply 100% of Phosphorus (${totalP_field} kg P₂O₅) and 50% of Potassium (${Math.round(totalK_field * 0.5)} kg K₂O) alongside 25% Nitrogen (${Math.round(totalN_field * 0.25)} kg N) at planting.`);
    split_guidance.push('Reserve remaining 75% Nitrogen for vegetative and flowering side dressings.');
  } else if (crop.growth_stage === 'vegetative') {
    split_guidance.push(`First Top Dressing: Apply 40% Nitrogen (${Math.round(totalN_field * 0.40)} kg N) along the crop root perimeter.`);
    split_guidance.push('Apply during evening hours and follow with light irrigation to prevent volatilization loss.');
  } else if (crop.growth_stage === 'flowering') {
    split_guidance.push(`Second Top Dressing: Apply remaining 35% Nitrogen (${Math.round(totalN_field * 0.35)} kg N) and 50% Potassium (${Math.round(totalK_field * 0.5)} kg K₂O) to support floral fruit set.`);
    split_guidance.push('Avoid excess nitrogen at flowering stage to prevent flower dropping and fungal susceptibility.');
  } else {
    split_guidance.push('Late crop stage: Do not apply heavy nitrogen top dressing. Foliar spray of 1% potassium nitrate (13:0:45) may be applied if fruit bulking requires it.');
  }

  // pH-specific guidance
  let phNote = '';
  if (ph < 6.0) {
    phNote = ' Soil pH is moderately acidic; phosphorus fixation is high. Consider applying agricultural lime.';
  } else if (ph > 8.0) {
    phNote = ' Soil pH is alkaline; micronutrient (Zinc, Iron) availability may be restricted. Apply gypsum or sulfur compost.';
  }

  return {
    id: `rec-fert-${Date.now()}`,
    field_id: field.id,
    crop_name: crop.crop_name,
    growth_stage: crop.growth_stage,
    has_soil_test: true,
    nutrient_status: soilN < 280 ? 'deficient' : 'adequate',
    deficiency_suspected: soilN < 280 ? 'Low Available Nitrogen' : undefined,
    recommended_nutrients: {
      nitrogen_kg_ha: totalN_field,
      phosphorus_kg_ha: totalP_field,
      potassium_kg_ha: totalK_field,
    },
    suggested_timing: `Tailored for ${crop.growth_stage} stage across ${field.area} ${field.area_unit}s.`,
    split_guidance,
    explanation: `Calculated against Soil Health Test dated ${soilTest.test_date} (pH: ${ph}, N: ${soilN} kg/ha, P: ${soilP} kg/ha, K: ${soilK} kg/ha).${phNote}`,
    soil_test_reminder: `Soil test is on record from ${soilTest.test_date}. Retest annually after harvest season.`,
    safety_warning: 'All values are calculated estimates based on standard ICAR regional response curves. Verify with your local agricultural officer before purchasing commercial fertilizer grades.',
    confidence: 'high',
    created_at: new Date().toISOString(),
  };
}
