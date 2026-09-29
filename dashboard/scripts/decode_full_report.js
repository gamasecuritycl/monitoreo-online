const fs = require('fs');
const path = 'C:/Users/tetor/Downloads/xlsx_temp/xl/';

// 1. Shared Strings
const ssXml = fs.readFileSync(path + 'sharedStrings.xml', 'utf8');
const siList = ssXml.split('</si>');
const strings = siList.map(si => {
  const matches = [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)];
  return matches.map(m => m[1]).join('');
});

// 2. Workbook
const wbXml = fs.readFileSync(path + 'workbook.xml', 'utf8');
const sheetMatches = [...wbXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"/g)];

sheetMatches.forEach((sm, idx) => {
  const sheetName = sm[1];
  const sf = 'sheet' + (idx + 1) + '.xml';
  const fullPath = path + 'worksheets/' + sf;
  if (!fs.existsSync(fullPath)) return;

  console.log('\n' + '='.repeat(70));
  console.log(`📑 PESTAÑA: ${sheetName.toUpperCase()}`);
  console.log('='.repeat(70));

  const xml = fs.readFileSync(fullPath, 'utf8');
  const rows = xml.split('</row>');

  rows.forEach((r, rIdx) => {
    const cells = [...r.matchAll(/<c[^>]*?(?:t="([^"]*)")?[^>]*>(?:<v>([^<]*)<\/v>)?<\/c>/g)];
    if (cells.length === 0) return;

    const rowValues = cells.map(c => {
      const type = c[1];
      const val = c[2];
      if (val === undefined) return '';
      if (type === 's') return strings[parseInt(val, 10)] || val;
      return val;
    });

    if (rowValues.some(v => v !== '')) {
      // Formatear columnas
      console.log(rowValues.map(v => String(v).padEnd(20)).join(' | '));
    }
  });
});
