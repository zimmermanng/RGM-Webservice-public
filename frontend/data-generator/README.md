# Shuffle Data Generator

This folder contains the Excel-to-JSON helper used to generate questionnaire data for the frontend.

## Purpose

`build-json.js` reads a source Excel workbook and writes three JSON files:

- `struktur.json`
- `handlungsempfehlungen.json`
- `fragen.json`

Those files match the data shape consumed by `frontend/src/components/data/`.

## Usage

From this folder:

```bash
node build-json.js ./excel/Daten.xlsx
```

The script writes generated files into `rgm-setup/`. Review the generated JSON before copying it into `frontend/src/components/data/`; generated output from `Daten.xlsx` is not currently identical to the active app data.

## Notes

The script depends on the frontend `xlsx` package. If dependencies are installed in `frontend/`, run the script from this folder with Node so it can resolve that package through the parent project.

The `excel/` folder contains source and test workbooks. Keep only files that are needed to regenerate or validate the current Shuffle questionnaire data.
