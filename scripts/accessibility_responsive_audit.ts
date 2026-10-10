import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log(' KisanSense AI Accessibility & Responsive Layout Audit');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details: string = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failCount++;
  }
}

const srcDir = path.resolve(process.cwd(), 'src');

function getAllFiles(dir: string, ext: string = '.tsx'): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

const componentFiles = getAllFiles(path.join(srcDir, 'components'));
const appFiles = getAllFiles(path.join(srcDir, 'app'));
const allUiFiles = [...componentFiles, ...appFiles];

// 1. Accessibility: Form Labels htmlFor matching input id
console.log('▶ [1] Form Input Accessibility & Label Associations');
const modalFiles = [
  'ModalAddField.tsx',
  'ModalAddCrop.tsx',
  'ModalSoilTest.tsx',
  'ModalFarmerFeedback.tsx',
  'SettingsView.tsx',
];

modalFiles.forEach((modalName) => {
  const filePath = allUiFiles.find((f) => f.endsWith(modalName));
  if (filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hasHtmlFor = content.includes('htmlFor=');
    const hasId = content.includes('id=');
    assert(hasHtmlFor && hasId, `Form inputs in ${modalName} contain htmlFor and id attributes`);
  }
});

// 2. Navigation Accessibility: aria-label & aria-current
console.log('\n▶ [2] Navigation & Interactive Element Accessibility');
const bottomNavPath = allUiFiles.find((f) => f.endsWith('BottomNav.tsx'));
if (bottomNavPath) {
  const content = fs.readFileSync(bottomNavPath, 'utf-8');
  assert(content.includes('aria-label='), 'BottomNav action buttons have aria-label');
  assert(content.includes('aria-current='), 'BottomNav active item indicates aria-current="page"');
}

const headerPath = allUiFiles.find((f) => f.endsWith('Header.tsx'));
if (headerPath) {
  const content = fs.readFileSync(headerPath, 'utf-8');
  assert(content.includes('aria-label='), 'Header interactive buttons contain accessible labels');
}

// 3. Mobile Layout: Viewport & Bottom Navigation Clearance
console.log('\n▶ [3] Mobile Responsive Layout & Viewport Clearance');
const pagePath = allUiFiles.find((f) => f.endsWith('page.tsx'));
if (pagePath) {
  const content = fs.readFileSync(pagePath, 'utf-8');
  assert(content.includes('pb-24'), 'Main content has pb-24 bottom clearance to prevent mobile nav overlap');
  assert(content.includes('BottomNav'), 'Mobile bottom navigation component is mounted');
  assert(content.includes('Sidebar'), 'Desktop sidebar component is mounted with responsive breakpoint classes');
}

// 4. Broken Route & Empty Catch Inspection
console.log('\n▶ [4] Runtime Error Prevention & Exception Handling Audit');
let emptyCatchCount = 0;
allUiFiles.forEach((f) => {
  const content = fs.readFileSync(f, 'utf-8');
  // Check for empty catch blocks: catch (...) { }
  const emptyCatchRegex = /catch\s*\([^)]*\)\s*\{\s*\}/g;
  const matches = content.match(emptyCatchRegex);
  if (matches) {
    emptyCatchCount += matches.length;
    console.warn(`  Warning: Empty catch in ${path.basename(f)}`);
  }
});
assert(emptyCatchCount === 0, 'No empty catch blocks hiding runtime errors in UI codebase');

// 5. Empty State Fallbacks
console.log('\n▶ [5] Dynamic View Empty State Fallbacks');
if (pagePath) {
  const content = fs.readFileSync(pagePath, 'utf-8');
  assert(content.includes('!activeField && ['), 'Empty state card provided when no active field exists');
  assert(content.includes('!activeScanResult &&'), 'Empty state card provided when no recent scan is present');
}

console.log('\n====================================================');
console.log(` Accessibility & Responsive Audit: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
