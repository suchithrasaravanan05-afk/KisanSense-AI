export interface SampleImageOption {
  id: string;
  cropName: string;
  title: string;
  condition: string;
  description: string;
  quality: number;
  dataUrl: string;
  expectedCategory: 'fungal_disease' | 'healthy' | 'water_stress' | 'nitrogen_stress' | 'pest_damage' | 'uncertain';
  confidence: number;
  symptoms: string[];
  explanation: string;
  nextStep: string;
}

// Generate realistic crisp SVGs for leaf visual triage demo
const createLeafSvg = (bgColor: string, leafColor: string, spotsColor: string, pattern: 'spots' | 'yellowing' | 'wilting' | 'chewed' | 'healthy' | 'blurry') => {
  let overlay = '';
  if (pattern === 'spots') {
    overlay = `
      <circle cx="180" cy="160" r="14" fill="${spotsColor}" opacity="0.85" stroke="#3e2723" stroke-width="2"/>
      <circle cx="180" cy="160" r="6" fill="#2d1500"/>
      <circle cx="230" cy="220" r="18" fill="${spotsColor}" opacity="0.85" stroke="#3e2723" stroke-width="2"/>
      <circle cx="230" cy="220" r="8" fill="#2d1500"/>
      <circle cx="150" cy="250" r="12" fill="${spotsColor}" opacity="0.85" stroke="#3e2723" stroke-width="2"/>
      <circle cx="200" cy="290" r="16" fill="${spotsColor}" opacity="0.85" stroke="#3e2723" stroke-width="2"/>
      <circle cx="200" cy="290" r="6" fill="#2d1500"/>
      <circle cx="140" cy="180" r="10" fill="${spotsColor}" opacity="0.8" stroke="#3e2723" stroke-width="1.5"/>
    `;
  } else if (pattern === 'yellowing') {
    overlay = `
      <path d="M 120 180 Q 200 230 160 320 Q 240 270 270 200 Z" fill="${spotsColor}" opacity="0.8" filter="blur(6px)"/>
      <line x1="200" y1="100" x2="200" y2="350" stroke="#7cb342" stroke-width="5"/>
    `;
  } else if (pattern === 'wilting') {
    overlay = `
      <path d="M 170 120 Q 250 200 180 340" stroke="#8d6e63" stroke-width="6" fill="none"/>
      <path d="M 130 190 Q 180 230 170 300" fill="#a1887f" opacity="0.5"/>
    `;
  } else if (pattern === 'chewed') {
    overlay = `
      <circle cx="150" cy="180" r="22" fill="${bgColor}"/>
      <circle cx="240" cy="240" r="28" fill="${bgColor}"/>
      <circle cx="180" cy="270" r="16" fill="${bgColor}"/>
      <path d="M 130 160 Q 160 170 145 200" stroke="#ff5722" stroke-width="3" fill="none"/>
    `;
  } else if (pattern === 'blurry') {
    overlay = `
      <filter id="heavyBlur"><feGaussianBlur stdDeviation="14"/></filter>
      <rect width="400" height="400" fill="#558b2f" opacity="0.6" filter="url(#heavyBlur)"/>
      <text x="200" y="210" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#ffffff" font-weight="bold">LOW LIGHT / BLURRY</text>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}"/>
          <stop offset="100%" stop-color="#1b3022"/>
        </linearGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="${leafColor}"/>
          <stop offset="100%" stop-color="#2e7d32"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bgGrad)"/>
      <!-- Grid field lines -->
      <line x1="0" y1="360" x2="400" y2="360" stroke="#33691e" stroke-width="2" opacity="0.3"/>
      <!-- Main Leaf Body -->
      <g transform="translate(0, 0)">
        <path d="M 200 70 C 290 120, 310 260, 200 350 C 90 260, 110 120, 200 70 Z" fill="url(#leafGrad)" stroke="#1b5e20" stroke-width="4"/>
        <!-- Central stem -->
        <path d="M 200 70 Q 200 220 200 370" stroke="#1b5e20" stroke-width="5" stroke-linecap="round"/>
        <!-- Veins -->
        <path d="M 200 130 Q 250 150 280 180" stroke="#388e3c" stroke-width="2.5" fill="none"/>
        <path d="M 200 130 Q 150 150 120 180" stroke="#388e3c" stroke-width="2.5" fill="none"/>
        <path d="M 200 190 Q 255 210 275 250" stroke="#388e3c" stroke-width="2.5" fill="none"/>
        <path d="M 200 190 Q 145 210 125 250" stroke="#388e3c" stroke-width="2.5" fill="none"/>
        <path d="M 200 250 Q 240 270 260 300" stroke="#388e3c" stroke-width="2" fill="none"/>
        <path d="M 200 250 Q 160 270 140 300" stroke="#388e3c" stroke-width="2" fill="none"/>
        ${overlay}
      </g>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const sampleImageOptions: SampleImageOption[] = [
  {
    id: 'sample-tomato-blight',
    cropName: 'Tomato',
    title: 'Tomato — Concentric Ring Lesions',
    condition: 'Possible Early Blight (Alternaria solani)',
    description: 'Distinctive dark target-board concentric spots on lower leaves with yellow halos.',
    quality: 92,
    dataUrl: createLeafSvg('#263238', '#43a047', '#5d4037', 'spots'),
    expectedCategory: 'fungal_disease',
    confidence: 86,
    symptoms: [
      'Concentric circular brown/black target lesions',
      'Chlorotic yellow halo around lesions',
      'Initial symptom expression on older, lower foliage'
    ],
    explanation: 'The observed concentric ring patterns strongly match Early Blight fungus (Alternaria solani), common in warm, humid weather. Spores propagate via soil splash.',
    nextStep: 'Prune infected lower foliage. Ensure drip irrigation rather than overhead spraying to keep leaves dry. Consult agricultural extension officer for biological (Trichoderma) or copper-based fungicide advisories.'
  },
  {
    id: 'sample-rice-blast',
    cropName: 'Rice',
    title: 'Rice — Spindle-Shaped Lesions',
    condition: 'Possible Rice Blast (Pyricularia oryzae)',
    description: 'Elliptical spindle-shaped spots with grey ash-colored centers and dark borders on rice foliage.',
    quality: 89,
    dataUrl: createLeafSvg('#1b2e1e', '#66bb6a', '#4e342e', 'spots'),
    expectedCategory: 'fungal_disease',
    confidence: 84,
    symptoms: [
      'Spindle-shaped diamond lesions on leaf blades',
      'Grey/ash-colored necrotic center with brown margins',
      'Higher severity on high-density vegetative tillers'
    ],
    explanation: 'The visual symptoms indicate probable Rice Blast fungus, often triggered by cool nights, high humidity, and excess urea application.',
    nextStep: 'Avoid excess split application of chemical nitrogen fertilizer. Maintain optimal field water levels. Take sample to local KVK agronomist for confirmation before spraying tricyclazole or validamycin.'
  },
  {
    id: 'sample-wheat-rust',
    cropName: 'Wheat',
    title: 'Wheat — Yellow Pustules',
    condition: 'Possible Stripe / Yellow Rust (Puccinia striiformis)',
    description: 'Linear stripes of bright yellow-orange fungal pustules along leaf veins.',
    quality: 91,
    dataUrl: createLeafSvg('#212121', '#81c784', '#f57f17', 'spots'),
    expectedCategory: 'fungal_disease',
    confidence: 88,
    symptoms: [
      'Linear yellow-orange powdery pustules arranged in stripes',
      'Desiccation of leaf blade margins',
      'Rapid spread under cool moist morning conditions'
    ],
    explanation: 'Visual alignment with Stripe Rust (Puccinia striiformis). Air-borne spores spread quickly under cool temperatures (10-15°C) and morning dew.',
    nextStep: 'Alert neighboring wheat growers and report to state agriculture department. Field inspection recommended within 24 hours. Consider protective propiconazole spray if confirmed by local extension.'
  },
  {
    id: 'sample-healthy-tomato',
    cropName: 'Tomato',
    title: 'Tomato — Lush Green Leaf',
    condition: 'Healthy Vigorous Canopy',
    description: 'Uniform deep green color, smooth edges, no spots, wilting, or pest marks.',
    quality: 95,
    dataUrl: createLeafSvg('#1c311f', '#43a047', '#43a047', 'healthy'),
    expectedCategory: 'healthy',
    confidence: 94,
    symptoms: [
      'Uniform rich green chlorophyll pigmentation',
      'Intact leaf margins without necrotic or chlorotic spots',
      'Healthy turgid leaf veins and petiole'
    ],
    explanation: 'Plant canopy displays excellent vigor, normal leaf cell turgor, and no visible pathogenic or abiotic distress.',
    nextStep: 'Continue current balanced irrigation and monitor weekly. No pesticide or chemical intervention required.'
  },
  {
    id: 'sample-cotton-stress',
    cropName: 'Cotton',
    title: 'Cotton — Wilt & Curled Leaves',
    condition: 'Possible Water Stress / Moisture Deficit',
    description: 'Drooping petioles, leaf curling, and loss of cell turgidity during mid-day.',
    quality: 85,
    dataUrl: createLeafSvg('#2e1c1c', '#7cb342', '#d7ccc8', 'wilting'),
    expectedCategory: 'water_stress',
    confidence: 79,
    symptoms: [
      'Loss of leaf turgor (wilting)',
      'Inward rolling of upper leaf margins',
      'Dull grey-green coloration under high solar irradiance'
    ],
    explanation: 'Visual drooping and leaf roll indicate moisture deficit in the root zone or high atmospheric vapor pressure deficit.',
    nextStep: 'Check root-zone soil moisture with finger probe. Utilize the KisanSense Water Planner to calculate required irrigation volume.'
  },
  {
    id: 'sample-nitrogen-deficiency',
    cropName: 'Maize',
    title: 'Maize — V-Shaped Yellowing',
    condition: 'Possible Nitrogen Deficiency Chlorosis',
    description: 'Characteristic V-shaped yellowing starting at the leaf tip and progressing down the midrib of older leaves.',
    quality: 88,
    dataUrl: createLeafSvg('#263238', '#689f38', '#ffeb3b', 'yellowing'),
    expectedCategory: 'nitrogen_stress',
    confidence: 82,
    symptoms: [
      'Inverted V-shaped yellow chlorosis from tip down midrib',
      'Prominently seen on bottom, older leaves first',
      'Stunted stalk thickness'
    ],
    explanation: 'Classic visual symptom of nitrogen mobility: the plant mobilizes scarce nitrogen from older leaves to newer growing points.',
    nextStep: 'Do NOT apply heavy urea immediately based only on photo. Perform or review field soil-test. If soil nitrogen is low, apply split top-dressing near root zone during next irrigation.'
  },
  {
    id: 'sample-unclear-low-confidence',
    cropName: 'Potato',
    title: 'Potato — Blurry / Low Light Photo',
    condition: 'Uncertain Image / Low Reliability',
    description: 'Out of focus, low contrast image simulating real farmer camera challenges.',
    quality: 34,
    dataUrl: createLeafSvg('#1c1c1c', '#33691e', '#000000', 'blurry'),
    expectedCategory: 'uncertain',
    confidence: 38,
    symptoms: [
      'Severe optical blur and lens defocus',
      'Insufficient contrast to isolate fungal lesions or pest punctures',
      'Low lighting prevents accurate color evaluation'
    ],
    explanation: 'The image resolution and lighting are insufficient for reliable machine learning diagnosis. Inconclusive symptoms.',
    nextStep: 'Please retake a clear photo in natural daylight at 15-20 cm distance, or submit directly to Agricultural Expert Review.'
  }
];
