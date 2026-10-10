const fs = require('fs');

const original = fs.readFileSync('src/i18n/translations.ts', 'utf8');
const hiData = JSON.parse(fs.readFileSync('scripts/hi_data.json', 'utf8'));

// Format hiData as a nice formatted TS object string
const hiString = '  hi: ' + JSON.stringify(hiData, null, 4).replace(/\n/g, '\n  ') + ',\n';

const taIndex = original.indexOf('  ta: {');
if (taIndex === -1) {
  console.error('Could not find ta: { in translations.ts');
  process.exit(1);
}

const updated = original.substring(0, taIndex) + hiString + original.substring(taIndex);
fs.writeFileSync('src/i18n/translations.ts', updated, 'utf8');
console.log('Successfully added hi dictionary to src/i18n/translations.ts');
