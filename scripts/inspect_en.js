const fs = require('fs');

const content = fs.readFileSync('src/i18n/translations.ts', 'utf8');
const startIdx = content.indexOf('en: {') + 3;
const endIdx = content.indexOf('ta: {');
const enBlock = content.substring(startIdx, endIdx).trim().replace(/,\s*$/, '');
const en = JSON.parse(enBlock);

fs.writeFileSync('scripts/en_data.json', JSON.stringify(en, null, 2));
console.log('Successfully extracted', Object.keys(en).length, 'keys');
