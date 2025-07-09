// utils/dataExtractor.js

import * as XLSX from 'xlsx';

// Function to map stages to numbers
export const mapStageToInteger = (stage) => {
    const stageMap = {
        "Stufe 0": 1,
        "Stufe 1": 2,
        "Stufe 2": 3,
        "Stufe 3": 4,
        "Stufe 4": 5,
    };
    return stageMap[stage] || 0; // Default to 0 if the stage is not recognized
};

// Function to process the raw Excel data and extract usable data
export const processData = (jsonData) => {
    const [header, ...rows] = jsonData;
    return rows.map((row) => ({
        group: row[0],
        category: row[1],
        value: mapStageToInteger(row[2]),
    }));
};

// Function to read the Excel file and process its data
export const readExcelFile = (file, callback) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const binaryStr = e.target.result;
        const wb = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = "Datenexport";

        if (!wb.SheetNames.includes(sheetName)) {
            alert(`Excel Datei mit Tabelle "${sheetName}" wurde nicht gefunden. Bitte laden Sie die korrekte Datei hoch.`);
            return;
        }

        const ws = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const processedData = processData(jsonData);
        callback(processedData); // Call the callback to update the state with the data
    };
    
    reader.readAsBinaryString(file);
};
