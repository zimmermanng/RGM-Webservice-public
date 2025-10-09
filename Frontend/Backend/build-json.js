// Erzeugt: rgm-setup/indikatoren.json, rgm-setup/struktur.json, rgm-setup/fragen.json
// Install: npm i xlsx
// Run: node build-json.js

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// === Ausgabe-Ordner ===
const OUT_DIR = path.resolve(__dirname, "rgm-setup");
fs.mkdirSync(OUT_DIR, { recursive: true });

// === Pfade zu den Excel-Dateien (bei Bedarf anpassen) ===
const FILE_1 = path.resolve(__dirname, "excel/struktur.xlsx");           
const FILE_2 = path.resolve(__dirname, "excel/Handlungsempfehlungen_mit_Indikatoren.xlsx");     
const FILE_3 = path.resolve(__dirname, "excel/fragen.xlsx");   

function readFirstSheetAsJson(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function parseMaybeArray(val) {
  if (Array.isArray(val)) return val.map(String).map(s => s.trim());
  if (val == null) return [];
  const s = String(val).trim();
  if (!s) return [];
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const normalized = s.replace(/'/g, '"').replace(/,\s*]/g, "]");
      const arr = JSON.parse(normalized);
      return (Array.isArray(arr) ? arr : [arr]).map(String).map(t => t.trim());
    } catch {
      return s.slice(1, -1).split(",").map(x => x.replace(/['"\s]/g, "")).filter(Boolean);
    }
  }
  if (s.includes(",") || s.includes(";")) {
    return s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
  }
  return [s];
}

// === 1) Daten laden ===
const t1 = readFirstSheetAsJson(FILE_1);
const t2 = readFirstSheetAsJson(FILE_2);
const t3 = readFirstSheetAsJson(FILE_3);

// === 2) Indikatoren extrahieren (nur aus t1) ===
const indikatorMap = new Map(); // id -> { id, name }
t1.forEach(r => {
  const id = String(r["ID Indikator"]).trim();
  const name = String(r["Indikator"]).trim();
  if (!id) return;
  if (!indikatorMap.has(id)) indikatorMap.set(id, { id, name });
});
const indikatoren = Array.from(indikatorMap.values());

// -> indikatoren.json im rgm-setup Ordner
fs.writeFileSync(path.join(OUT_DIR, "indikatoren.json"), JSON.stringify({ indikatoren }, null, 2), "utf8");

// === 3) Dimensionen-Hierarchie (ohne globale Indikatorenliste) ===
const dimNameById = new Map();
t1.forEach(r => {
  const did = String(r["ID Dimension"]).trim();
  const dname = String(r["Dimension"]).trim();
  if (did && dname && !dimNameById.has(did)) dimNameById.set(did, dname);
});

const dimensionenMap = new Map();
/*
Je Dimension:
{
  id, name,
  handlungsfelder: [
    { id, name, stufen: { "0": [{ id, titel, indikatorIds: [...] }], ... } }
  ]
}
*/

t2.forEach(r => {
  const hid = String(r["ID Handlungsempfehlung"]).trim();
  const hName = String(r["Handlungsempfehlung"]).trim();
  const dimId = String(r["Handlungsfeld ID"]).trim(); // in den Testdaten = Dimension-ID
  const stufe = Number(r["Stufe"]);
  const indIds = parseMaybeArray(r["Indikator IDs"]).filter(Boolean);

  if (!dimId) return;

  if (!dimensionenMap.has(dimId)) {
    dimensionenMap.set(dimId, {
      id: dimId,
      name: dimNameById.get(dimId) || dimId,
      handlungsfelder: new Map(), // hfId -> { id, name, stufen: Map<stufe, Array<...>> }
    });
  }
  const dimEntry = dimensionenMap.get(dimId);

  const hfId = hid; // HID als Handlungsfeld-ID
  if (!dimEntry.handlungsfelder.has(hfId)) {
    dimEntry.handlungsfelder.set(hfId, {
      id: hfId,
      name: hName || hfId,
      stufen: new Map(),
    });
  }
  const hfEntry = dimEntry.handlungsfelder.get(hfId);

  if (!hfEntry.stufen.has(stufe)) hfEntry.stufen.set(stufe, []);
  hfEntry.stufen.get(stufe).push({
    id: hid,
    titel: hName || hid,
    indikatorIds: indIds,
  });
});

// Maps → JSON
const dimensionen = Array.from(dimensionenMap.values()).map(dim => ({
  id: dim.id,
  name: dim.name,
  handlungsfelder: Array.from(dim.handlungsfelder.values()).map(hf => ({
    id: hf.id,
    name: hf.name,
    stufen: Object.fromEntries(
      Array.from(hf.stufen.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([stufe, arr]) => [String(stufe), arr])
    ),
  })),
}));

fs.writeFileSync(path.join(OUT_DIR, "struktur.json"), JSON.stringify({ dimensionen }, null, 2), "utf8");

// === 4) Fragen-JSON ===
const fragenMap = new Map(); // fId -> obj
t3.forEach(r => {
  const fId = String(r["ID Frage"]).trim();
  const frage = String(r["Frage"]).trim();
  const hid = String(r["Handlungsempfehlungs ID"]).trim();
  const aId = String(r["Antwort ID"]).trim();
  const antwort = String(r["Antwort"]).trim();
  const stufe = Number(r["Stufe"]);
  const indIds = parseMaybeArray(r["Indikator IDs"]).filter(Boolean);

  if (!fId) return;
  if (!fragenMap.has(fId)) {
    fragenMap.set(fId, {
      id: fId,
      frage,
      handlungsempfehlungsId: hid || "",
      antworten: [],
    });
  }
  fragenMap.get(fId).antworten.push({
    id: aId,
    antwort,
    indikatorIds: indIds,
    stufe: Number.isFinite(stufe) ? stufe : null,
  });
});

const fragenJson = { fragen: Array.from(fragenMap.values()) };
fs.writeFileSync(path.join(OUT_DIR, "fragen.json"), JSON.stringify(fragenJson, null, 2), "utf8");

console.log("✅ Dateien erzeugt unter:", OUT_DIR);
