// build-json.js
// Robust Excel→JSON converter for a 3-sheet workbook.
// Install: npm i xlsx
// Run:     node build-json.js ./excel/Neue_Daten.xlsx
//
// Sheets (by index):
//  0) Struktur: Dimension (ID+name) → Handlungsfeld (ID+name) → Frage (ID+name)
//  1) Handlungsempfehlungen: Handlungsempfehlung (ID+name) → Antwort (ID-ARRAY) → Handlungsfeld ID (attached to each Antwort)
//  2) Fragen & Antworten: Frage (ID+name) → Handlungsfeld ID → Antwort (ID+name) → Stufe
//
// Outputs (./rgm-setup):
//  - struktur.json
//  - handlungsempfehlungen.json
//  - fragen.json
//
// This script is tolerant to header variations by normalizing column names.
// It also cross-links answer texts from sheet 3 where possible.

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ---------- CLI ----------
const inputPath = process.argv[2] || path.resolve(__dirname, 'excel', 'Daten.xlsx');
if (!fs.existsSync(inputPath)) {
  console.error('❌ Excel file not found:', inputPath);
  process.exit(1);
}

const OUT_DIR = path.resolve(__dirname, 'rgm-setup');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Helpers ----------
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[ü]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildHeaderMap(row) {
  const map = new Map();
  for (const key of Object.keys(row)) {
    map.set(normalize(key), key);
  }
  return map;
}

function pick(row, headerMap, aliases, asNumber = false) {
  for (const a of aliases) {
    const k = headerMap.get(normalize(a));
    if (k && String(row[k]).trim() !== '') {
      const v = row[k];
      return asNumber ? (isFinite(+v) ? +v : null) : String(v).trim();
    }
  }
  // Also try direct normalized presence (if alias is already normalized-ish)
  for (const nk of headerMap.keys()) {
    if (aliases.map(normalize).includes(nk)) {
      const k = headerMap.get(nk);
      const v = row[k];
      return asNumber ? (isFinite(+v) ? +v : null) : String(v).trim();
    }
  }
  return asNumber ? null : '';
}

function parseIdArray(val) {
  if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
  if (val == null) return [];
  const s = String(val).trim();
  if (!s) return [];
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('(') && s.endsWith(')'))) {
    try {
      const normalized = s
        .replace(/^\(/, '[').replace(/\)$/, ']')
        .replace(/'/g, '"')
        .replace(/,\s*]/g, ']');
      const arr = JSON.parse(normalized);
      return (Array.isArray(arr) ? arr : [arr]).map(String).map(t => t.trim()).filter(Boolean);
    } catch { /* fallthrough */ }
  }
  if (s.includes(',') || s.includes(';')) {
    return s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
  }
  return [s];
}

function sheetToJsonByIndex(wb, idx) {
  const name = wb.SheetNames[idx];
  if (!name) return [];
  const ws = wb.Sheets[name];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ---------- Load workbook ----------
const wb = XLSX.readFile(inputPath);

// ---------- Column alias sets ----------
const S1 = { // Sheet 1
  dimId:   ['ID Dimension', 'Dimension ID', 'Dim ID', 'DimID', 'DimensionId', 'dim id'],
  dimName: ['Dimension', 'Name Dimension', 'Dimension Name'],
  hfId:    ['ID Handlungsfeld', 'Handlungsfeld ID', 'ID Handlungsempfehlung', 'Handlungsempfehlungs ID', 'HF ID'],
  hfName:  ['Handlungsfeld', 'Handlungsempfehlung', 'HF Name'],
  frageId: ['ID Frage', 'Frage ID', 'FrageId', 'Question ID'],
  frage:   ['Frage', 'Fragetext', 'Frage Text', 'Question'],
};

const S2 = { // Sheet 2
  heId:    ['ID Handlungsempfehlung', 'Handlungsempfehlungs ID', 'ID Handlungsfeld', 'HF ID'],
  heName:  ['Handlungsempfehlung', 'Handlungsfeld', 'HF Name'],
  antwortIds: ['Antwort IDs', 'Antworten', 'Antwort ID(s)', 'Antwort ID Liste', 'Antwort'],
  hfId:    ['Handlungsfeld ID', 'ID Handlungsfeld', 'HF ID'],
};

const S3 = { // Sheet 3
  frageId:   ['ID Frage', 'Frage ID', 'FrageId', 'Question ID'],
  frage:     ['Frage', 'Fragetext', 'Frage Text', 'Question'],
  hfId:      ['Handlungsfeld ID', 'ID Handlungsfeld', 'HF ID'],
  antwortId: ['Antwort ID', 'ID Antwort', 'Answer ID'],
  antwort:   ['Antwort', 'Antworttext', 'Answer'],
  stufe:     ['Stufe', 'Level'],
};

// ---------- SHEET 3 FIRST: build answer-text lookup ----------
const s3 = sheetToJsonByIndex(wb, 2);
const answerTextById = new Map();
for (const r of s3) {
  const hdr = buildHeaderMap(r);
  const aId = pick(r, hdr, S3.antwortId);
  const aTxt = pick(r, hdr, S3.antwort);
  if (aId) {
    if (!answerTextById.has(aId)) answerTextById.set(aId, aTxt || '');
    if (!answerTextById.get(aId) && aTxt) answerTextById.set(aId, aTxt);
  }
}

// ---------- SHEET 1 → struktur.json ----------
const s1 = sheetToJsonByIndex(wb, 0);
const dimMap = new Map();

for (const r of s1) {
  const hdr = buildHeaderMap(r);

  const dimId = pick(r, hdr, S1.dimId);
  const dimName = pick(r, hdr, S1.dimName) || dimId || '';
  if (!dimId) continue;

  if (!dimMap.has(dimId)) {
    dimMap.set(dimId, { id: dimId, name: dimName || dimId, hfs: new Map() });
  }
  const dim = dimMap.get(dimId);

  const hfId = pick(r, hdr, S1.hfId) || pick(r, hdr, S1.hfName);
  const hfName = pick(r, hdr, S1.hfName) || pick(r, hdr, S1.hfId) || hfId || '';
  if (!hfId) continue;

  if (!dim.hfs.has(hfId)) {
    dim.hfs.set(hfId, { id: hfId, name: hfName || hfId, fragen: new Map() });
  }
  const hf = dim.hfs.get(hfId);

  const frageId = pick(r, hdr, S1.frageId);
  const frageTxt = pick(r, hdr, S1.frage);
  if (frageId || frageTxt) {
    const fid = frageId || frageTxt;
    const fname = frageTxt || frageId || '';
    if (!hf.fragen.has(fid)) hf.fragen.set(fid, { id: fid, name: fname });
  }
}

const strukturJson = {
  dimensionen: Array.from(dimMap.values()).map(d => ({
    id: d.id,
    name: d.name,
    handlungsfelder: Array.from(d.hfs.values()).map(hf => ({
      id: hf.id,
      name: hf.name,
      fragen: Array.from(hf.fragen.values()),
    })),
  })),
};
fs.writeFileSync(path.join(OUT_DIR, 'struktur.json'), JSON.stringify(strukturJson, null, 2), 'utf8');

// ---------- SHEET 2 → handlungsempfehlungen.json ----------
const s2 = sheetToJsonByIndex(wb, 1);
const heMap = new Map();
for (const r of s2) {
  const hdr = buildHeaderMap(r);

  const heId = pick(r, hdr, S2.heId);
  if (!heId) continue;
  const heName = pick(r, hdr, S2.heName) || heId;
  const hfId = pick(r, hdr, S2.hfId);
  const arr = parseIdArray(pick(r, hdr, S2.antwortIds));

  if (!heMap.has(heId)) heMap.set(heId, { id: heId, name: heName, antworten: [], _set: new Set() });
  const he = heMap.get(heId);

  for (const aId of arr) {
    const key = `${aId}::${hfId || ''}`;
    if (aId && !he._set.has(key)) {
      he._set.add(key);
      const aTxt = answerTextById.get(aId) || '';
      he.antworten.push({ id: aId, antwort: aTxt, handlungsfeldId: hfId || '' });
    }
  }
}
const handlungsempfehlungenJson = {
  handlungsempfehlungen: Array.from(heMap.values()).map(h => ({
    id: h.id,
    name: h.name,
    antworten: h.antworten,
  })),
};
fs.writeFileSync(path.join(OUT_DIR, 'handlungsempfehlungen.json'), JSON.stringify(handlungsempfehlungenJson, null, 2), 'utf8');

// ---------- SHEET 3 → fragen.json ----------
const qMap = new Map();
for (const r of s3) {
  const hdr = buildHeaderMap(r);

  const frageId = pick(r, hdr, S3.frageId);
  if (!frageId) continue;
  const frageTxt = pick(r, hdr, S3.frage);
  const hfId = pick(r, hdr, S3.hfId);
  const antwortId = pick(r, hdr, S3.antwortId);
  const antwortTxt = pick(r, hdr, S3.antwort);
  const stufe = pick(r, hdr, S3.stufe, true);

  if (!qMap.has(frageId)) {
    qMap.set(frageId, { id: frageId, frage: frageTxt || '', antworten: [], _set: new Set() });
  } else if (!qMap.get(frageId).frage && frageTxt) {
    qMap.get(frageId).frage = frageTxt;
  }

  if (antwortId) {
    const key = `${antwortId}::${hfId || ''}::${Number.isFinite(stufe) ? stufe : ''}`;
    if (!qMap.get(frageId)._set.has(key)) {
      qMap.get(frageId)._set.add(key);
      const aTxt = antwortTxt || answerTextById.get(antwortId) || '';
      qMap.get(frageId).antworten.push({
        id: antwortId,
        antwort: aTxt,
        handlungsfeldId: hfId || '',
        stufe: Number.isFinite(stufe) ? stufe : null,
      });
    }
  }
}

const fragenJson = {
  fragen: Array.from(qMap.values()).map(q => ({
    id: q.id,
    frage: q.frage,
    antworten: q.antworten,
  })),
};
fs.writeFileSync(path.join(OUT_DIR, 'fragen.json'), JSON.stringify(fragenJson, null, 2), 'utf8');

console.log('✅ Written:');
console.log(' -', path.join(OUT_DIR, 'struktur.json'));
console.log(' -', path.join(OUT_DIR, 'handlungsempfehlungen.json'));
console.log(' -', path.join(OUT_DIR, 'fragen.json'));
console.log('Source XLSX:', inputPath);
