// build-json.js
// Robust Excel→JSON converter for a 4-sheet workbook.
// Install: npm i xlsx
// Run:     node build-json.js ./Daten.xlsx
//
// Sheets (by index):
//  0) Struktur: Dimension (ID+name) → Handlungsfeld (ID+name) → Frage (ID+name)
//  1) Handlungsempfehlungen: Handlungsempfehlung (ID+name) → Antwort (ID-ARRAY / ranges) → Handlungsfeld ID
//  2) Fragen & Antworten: Frage (ID+name) → Handlungsfeld ID → Antwort (ID+name) → Stufe
//  3) Dimension_Beschreibung: Dimension ID → Beschreibung
//
// Outputs:
//  - struktur.json
//  - handlungsempfehlungen.json
//  - fragen.json
//  - dimensionen_content.json

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// ---------- CLI ----------
const inputPath =
  process.argv[2] || path.resolve(__dirname, "Daten.xlsx");

if (!fs.existsSync(inputPath)) {
  console.error("❌ Excel file not found:", inputPath);
  process.exit(1);
}

const OUT_DIR = path.resolve(__dirname, "rgm-setup");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Helpers ----------
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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
    if (k && String(row[k]).trim() !== "") {
      const v = row[k];
      return asNumber ? (isFinite(+v) ? +v : null) : String(v).trim();
    }
  }

  for (const nk of headerMap.keys()) {
    if (aliases.map(normalize).includes(nk)) {
      const k = headerMap.get(nk);
      const v = row[k];
      if (String(v).trim() === "") continue;
      return asNumber ? (isFinite(+v) ? +v : null) : String(v).trim();
    }
  }

  return asNumber ? null : "";
}

function sheetToJsonByIndex(wb, idx) {
  const name = wb.SheetNames[idx];
  if (!name) return [];
  const ws = wb.Sheets[name];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function uniq(arr) {
  return [...new Set(arr)];
}

function cleanAnswerToken(token) {
  return String(token || "")
    .trim()
    .replace(/\?+$/g, "")
    .trim();
}

function expandAnswerRef(token) {
  const cleaned = cleanAnswerToken(token);
  if (!cleaned) return [];

  const rangeMatch = cleaned.match(/^([A-Za-z]+)(\d+)\s*-\s*([A-Za-z]+)?(\d+)$/);
  if (rangeMatch) {
    const prefixStart = rangeMatch[1];
    const startNum = Number(rangeMatch[2]);
    const prefixEnd = rangeMatch[3] || prefixStart;
    const endNum = Number(rangeMatch[4]);

    if (prefixStart === prefixEnd && Number.isFinite(startNum) && Number.isFinite(endNum)) {
      const from = Math.min(startNum, endNum);
      const to = Math.max(startNum, endNum);
      const out = [];
      for (let i = from; i <= to; i += 1) {
        out.push(`${prefixStart}${i}`);
      }
      return out;
    }
  }

  return [cleaned];
}

function parseIdArray(val) {
  if (Array.isArray(val)) {
    return uniq(
      val.flatMap((item) => expandAnswerRef(item)).filter(Boolean)
    );
  }

  if (val == null) return [];

  const s = String(val).trim();
  if (!s) return [];

  if (
    (s.startsWith("[") && s.endsWith("]")) ||
    (s.startsWith("(") && s.endsWith(")"))
  ) {
    try {
      const normalized = s
        .replace(/^\(/, "[")
        .replace(/\)$/, "]")
        .replace(/'/g, '"')
        .replace(/,\s*]/g, "]");

      const arr = JSON.parse(normalized);
      return uniq(
        (Array.isArray(arr) ? arr : [arr])
          .flatMap((item) => expandAnswerRef(item))
          .filter(Boolean)
      );
    } catch {
      // fall through
    }
  }

  return uniq(
    s
      .split(/[;,]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .flatMap((token) => expandAnswerRef(token))
      .filter(Boolean)
  );
}

// ---------- Load workbook ----------
const wb = XLSX.readFile(inputPath);

// ---------- Column alias sets ----------
const S1 = {
  dimId: ["ID Dimension", "Dimension ID", "Dim ID", "DimID", "DimensionId"],
  dimName: ["Dimension", "Name Dimension", "Dimension Name"],
  hfId: ["ID Handlungsfeld", "Handlungsfeld ID", "HF ID"],
  hfName: ["Handlungsfeld", "HF Name"],
  frageId: ["ID Frage", "Frage ID", "FrageId", "Question ID"],
  frage: ["Frage", "Fragetext", "Frage Text", "Question"],
};

const S2 = {
  heId: ["ID Handlungsempfehlung", "Handlungsempfehlungs ID"],
  heName: ["Handlungsempfehlung"],
  antwortIds: [
    "Antwort Ids",
    "Antwort IDs",
    "Antworten",
    "Antwort ID(s)",
    "Antwort ID Liste",
    "Antwort",
  ],
  hfId: ["ID Handlungsfeld", "Handlungsfeld ID", "HF ID"],
};

const S3 = {
  frageId: ["ID Frage", "Frage ID", "FrageId", "Question ID"],
  frage: ["Frage", "Fragetext", "Frage Text", "Question"],
  hfId: ["ID Handlungsfeld", "Handlungsfeld ID", "HF ID"],
  antwortId: ["ID Antwort", "Antwort ID", "Answer ID"],
  antwort: ["Antwort", "Antworttext", "Answer"],
  stufe: ["Stufe", "Level"],
};

const S4 = {
  dimId: ["ID Dimension", "Dimension ID", "Dim ID", "DimID", "DimensionId"],
  beschreibung: [
    "Beschreibung",
    "Description",
    "Dimension Beschreibung",
    "Dimensionsbeschreibung",
  ],
};

// ---------- SHEET 3 FIRST: build answer-text lookup ----------
const s3 = sheetToJsonByIndex(wb, 2);
const answerTextById = new Map();

for (const r of s3) {
  const hdr = buildHeaderMap(r);
  const aId = cleanAnswerToken(pick(r, hdr, S3.antwortId));
  const aTxt = pick(r, hdr, S3.antwort);

  if (aId) {
    if (!answerTextById.has(aId)) answerTextById.set(aId, aTxt || "");
    if (!answerTextById.get(aId) && aTxt) answerTextById.set(aId, aTxt);
  }
}

// ---------- SHEET 1 → struktur.json ----------
const s1 = sheetToJsonByIndex(wb, 0);
const dimMap = new Map();

for (const r of s1) {
  const hdr = buildHeaderMap(r);

  const dimId = pick(r, hdr, S1.dimId);
  const dimName = pick(r, hdr, S1.dimName) || dimId || "";
  if (!dimId) continue;

  if (!dimMap.has(dimId)) {
    dimMap.set(dimId, { id: dimId, name: dimName || dimId, hfs: new Map() });
  }
  const dim = dimMap.get(dimId);

  const hfId = pick(r, hdr, S1.hfId) || pick(r, hdr, S1.hfName);
  const hfName = pick(r, hdr, S1.hfName) || pick(r, hdr, S1.hfId) || hfId || "";
  if (!hfId) continue;

  if (!dim.hfs.has(hfId)) {
    dim.hfs.set(hfId, { id: hfId, name: hfName || hfId, fragen: new Map() });
  }
  const hf = dim.hfs.get(hfId);

  const frageId = pick(r, hdr, S1.frageId);
  const frageTxt = pick(r, hdr, S1.frage);

  if (frageId || frageTxt) {
    const fid = frageId || frageTxt;
    const fname = frageTxt || frageId || "";
    if (!hf.fragen.has(fid)) {
      hf.fragen.set(fid, { id: fid, name: fname });
    }
  }
}

const strukturJson = {
  dimensionen: Array.from(dimMap.values()).map((d) => ({
    id: d.id,
    name: d.name,
    handlungsfelder: Array.from(d.hfs.values()).map((hf) => ({
      id: hf.id,
      name: hf.name,
      fragen: Array.from(hf.fragen.values()),
    })),
  })),
};

fs.writeFileSync(
  path.join(OUT_DIR, "struktur.json"),
  JSON.stringify(strukturJson, null, 2),
  "utf8"
);

// ---------- SHEET 4 → dimensionen_content.json ----------
const s4 = sheetToJsonByIndex(wb, 3);

console.log("sheet names:", wb.SheetNames);
console.log("sheet 4 raw rows:", s4);
console.log("sheet 4 row count:", s4.length);

const dimensionenContentJson = {
  dimensionen: s4
    .map((r) => {
      const hdr = buildHeaderMap(r);
      const dimId = pick(r, hdr, S4.dimId);
      const beschreibung = pick(r, hdr, S4.beschreibung);

      console.log("sheet 4 parsed row:", {
        raw: r,
        dimId,
        beschreibung,
      });

      if (!dimId) return null;

      return {
        id: dimId,
        beschreibung: beschreibung || "",
      };
    })
    .filter(Boolean),
};

console.log(
  "dimensionen_content entries:",
  dimensionenContentJson.dimensionen.length
);

fs.writeFileSync(
  path.join(OUT_DIR, "dimensionen_content.json"),
  JSON.stringify(dimensionenContentJson, null, 2),
  "utf8"
);
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

  if (!heMap.has(heId)) {
    heMap.set(heId, {
      id: heId,
      name: heName,
      antworten: [],
      _set: new Set(),
    });
  }

  const he = heMap.get(heId);

  for (const aId of arr) {
    const key = `${aId}::${hfId || ""}`;
    if (!aId || he._set.has(key)) continue;

    he._set.add(key);
    const aTxt = answerTextById.get(aId) || "";
    he.antworten.push({
      id: aId,
      antwort: aTxt,
      handlungsfeldId: hfId || "",
    });
  }
}

const handlungsempfehlungenJson = {
  handlungsempfehlungen: Array.from(heMap.values()).map((h) => ({
    id: h.id,
    name: h.name,
    antworten: h.antworten,
  })),
};

fs.writeFileSync(
  path.join(OUT_DIR, "handlungsempfehlungen.json"),
  JSON.stringify(handlungsempfehlungenJson, null, 2),
  "utf8"
);

// ---------- SHEET 3 → fragen.json ----------
const qMap = new Map();

for (const r of s3) {
  const hdr = buildHeaderMap(r);

  const frageId = pick(r, hdr, S3.frageId);
  if (!frageId) continue;

  const frageTxt = pick(r, hdr, S3.frage);
  const hfId = pick(r, hdr, S3.hfId);
  const antwortId = cleanAnswerToken(pick(r, hdr, S3.antwortId));
  const antwortTxt = pick(r, hdr, S3.antwort);
  const stufe = pick(r, hdr, S3.stufe, true);

  if (!qMap.has(frageId)) {
    qMap.set(frageId, {
      id: frageId,
      frage: frageTxt || "",
      antworten: [],
      _set: new Set(),
    });
  } else if (!qMap.get(frageId).frage && frageTxt) {
    qMap.get(frageId).frage = frageTxt;
  }

  if (antwortId) {
    const key = `${antwortId}::${hfId || ""}::${Number.isFinite(stufe) ? stufe : ""}`;
    if (!qMap.get(frageId)._set.has(key)) {
      qMap.get(frageId)._set.add(key);
      const aTxt = antwortTxt || answerTextById.get(antwortId) || "";
      qMap.get(frageId).antworten.push({
        id: antwortId,
        antwort: aTxt,
        handlungsfeldId: hfId || "",
        stufe: Number.isFinite(stufe) ? stufe : null,
      });
    }
  }
}

const fragenJson = {
  fragen: Array.from(qMap.values()).map((q) => ({
    id: q.id,
    frage: q.frage,
    antworten: q.antworten,
  })),
};

fs.writeFileSync(
  path.join(OUT_DIR, "fragen.json"),
  JSON.stringify(fragenJson, null, 2),
  "utf8"
);

console.log("✅ Written:");
console.log(" -", path.join(OUT_DIR, "struktur.json"));
console.log(" -", path.join(OUT_DIR, "handlungsempfehlungen.json"));
console.log(" -", path.join(OUT_DIR, "fragen.json"));
console.log(" -", path.join(OUT_DIR, "dimensionen_content.json"));
console.log("Source XLSX:", inputPath);