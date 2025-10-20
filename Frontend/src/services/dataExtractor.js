// services/dataExtractor.js

import * as XLSX from 'xlsx';

/** Map raw stage labels to integers 0..5 (0 = unknown) */
export const mapStageToInteger = (stage) => {
  const stageMap = {
    'Stufe 0': 1,
    'Stufe 1': 2,
    'Stufe 2': 3,
    'Stufe 3': 4,
    'Stufe 4': 5,
  };
  return stageMap[stage] || 0;
};

/**
 * Turn a cell (semicolon- or newline-separated) into a clean string[]
 * - trims whitespace
 * - removes empty entries
 * - de-duplicates while preserving order
 */
const splitToList = (raw) => {
  if (raw == null) return [];
  const text = String(raw).trim();
  if (!text) return [];
  const seen = new Set();
  return text
    .split(/;|\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !seen.has(s) && (seen.add(s), true));
};

/**
 * Convert the 2D array from XLSX (header + rows) into app data
 * Expected columns:
 *   A: group, B: category, C: stage (maps to value), D: recommendations (optional)
 *
 * @param {any[][]} jsonData
 * @returns {{group:string, category:string, value:number, recommendations:string[]}[]}
 */
export const processData = (jsonData) => {
  const [, ...rows] = jsonData; // drop header row
  return rows
    .filter((row) => row && (row[0] || row[1] || row[2])) // ignore empty lines
    .map((row) => {
      const group = row[0] ?? '';
      const category = row[1] ?? '';
      const value = mapStageToInteger(row[2]);
      const recommendations = splitToList(row[3]); // ← always an array; [] if empty
      return { group, category, value, recommendations };
    });
};

// Trigger a JSON download in the browser
export const downloadJSON = (data, filename = 'rgm-data.json') => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('JSON download failed:', err);
  }
};

/**
 * Read + parse the Excel file.
 *
 * @param {File} file - the uploaded Excel file
 * @param {(data: Array) => void} callback - receives processed data
 * @param {Object} options
 * @param {boolean} [options.downloadJson=false] - save processed data as JSON
 * @param {boolean} [options.logToConsole=false] - print processed data to console
 * @param {string}  [options.sheetName='Datenexport'] - override the expected sheet name
 * @param {string}  [options.filename='rgm-data.json'] - filename for the JSON download
 */
export const readExcelFile = (
  file,
  callback,
  {
    downloadJson = false,
    logToConsole = false,
    sheetName = 'Datenexport',
    filename = 'rgm-data.json',
  } = {}
) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const binaryStr = e.target.result;
    const wb = XLSX.read(binaryStr, { type: 'binary' });

    if (!wb.SheetNames.includes(sheetName)) {
      alert(
        `Excel Datei mit Tabelle "${sheetName}" wurde nicht gefunden. Bitte laden Sie die korrekte Datei hoch.`
      );
      return;
    }

    const ws = wb.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const processedData = processData(jsonData);

    if (logToConsole) {
      console.log('✅ Verarbeitete Daten (Array):', processedData);
      try { console.table(processedData); } catch {}
    }

    if (downloadJson) {
      downloadJSON(processedData, filename);
    }

    callback(processedData);
  };

  reader.readAsBinaryString(file);
};
