import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REGION_HEADERS = {
  10: 'Ahafo',
  11: 'Ashanti',
  12: 'Bono',
  13: 'Bono East',
  14: 'Central',
  15: 'Eastern',
  16: 'Greater Accra',
  17: 'Northern',
  18: 'North East',
  19: 'Oti',
  20: 'Savannah',
  21: 'Upper East',
  22: 'Upper West',
  23: 'Volta',
  24: 'Western',
  25: 'Western North',
};

function stripWiki(s) {
  return s
    .replace(/\{\{efn[^}]*\}\}/g, '')
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .trim();
}

function parseDistrictName(cell) {
  const cleaned = stripWiki(cell);
  return cleaned.replace(/\s*\(district\)\s*$/i, '').trim();
}

function parseDistrictsFromWikitext(wt) {
  const districts = [];
  const parts = wt.split(/\n\|-\n/);
  for (const part of parts) {
    const rowLine = part
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('|') && !l.startsWith('|}') && !l.startsWith('|-'));
    if (!rowLine) continue;
    const cells = rowLine.split('||').map((c) => c.replace(/^\|/, '').trim());
    if (cells.length < 2) continue;
    const name = parseDistrictName(cells[0]);
    const category = stripWiki(cells[1]);
    if (!name || /^District$/i.test(name) || /^Category$/i.test(name)) continue;
    if (/^Capital$/i.test(name)) continue;

    let label = name;
    if (/^Metropolitan$/i.test(category) && !/Metropolitan/i.test(label)) {
      label = `${label} Metropolitan`;
    } else if (/^Municipal$/i.test(category) && !/Municipal/i.test(label)) {
      label = `${label} Municipal`;
    } else if (/^District$/i.test(category) && !/District/i.test(label)) {
      label = `${label} District`;
    }
    districts.push(label);
  }
  return [...new Set(districts)].sort((a, b) => a.localeCompare(b));
}

function loadSectionWikitext(section) {
  const localPath = path.join(__dirname, `sec${section}.json`);
  if (fs.existsSync(localPath)) {
    const json = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    return json.parse?.wikitext?.['*'] ?? '';
  }
  return '';
}

const byRegion = {};

for (const [section, region] of Object.entries(REGION_HEADERS)) {
  const wt = loadSectionWikitext(Number(section));
  if (!wt) {
    console.error(`Missing section ${section} (${region})`);
    process.exitCode = 1;
    continue;
  }
  byRegion[region] = parseDistrictsFromWikitext(wt);
  console.error(`${region}: ${byRegion[region].length} districts`);
}

const total = Object.values(byRegion).reduce((n, list) => n + list.length, 0);
console.error('Total districts:', total);

const outPath = path.join(process.cwd(), 'components/constants/ghanaDistricts.data.json');
fs.writeFileSync(outPath, JSON.stringify(byRegion, null, 2));
console.log('Wrote', outPath);
