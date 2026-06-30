# Shuffle Frontend

This folder contains the React frontend for the Shuffle RGM questionnaire tool. It provides the public pages, questionnaire flow, result views, upload/download screens, routing, styling, Shuffle theme setup, static app data, and the optional Excel-to-JSON data generator.

## Main Entry Points

- `src/index.js` mounts the React application.
- `src/App.js` defines the active routes and the single page `<main>` landmark.
- `src/theme.js` applies the Shuffle theme to the document.
- `src/components/` contains reusable UI components.
- `src/pages/` contains route-level screens.
- `src/services/` contains data transformation helpers.
- `src/components/data/` contains active questionnaire and recommendation JSON data.
- `data-generator/` contains the optional Excel-to-JSON helper used to regenerate data files.

## Development

Install dependencies once:

```bash
npm install
```

Start the local development server:

```bash
npm start
```

The app usually opens at `http://localhost:3000`.

## Build

Create a production build:

```bash
npm run build
```

The Docker setup serves this build through nginx.

## Tests

The production build is currently the reliable verification command:

```bash
npm run build
```

`npm test` is still available from the original Create React App setup, but it currently does not pass because the old Jest resolver cannot resolve the installed React Router package. Treat test-runner repair as a separate tooling task.

## Data Notes

Active JSON data is stored in `src/components/data/`. The optional generator in `data-generator/` writes generated files to `data-generator/rgm-setup/`. Review generated output before replacing active app data.

## Accessibility Notes

The current cleanup added source-level accessibility improvements for landmarks, headings, navigation states, questionnaire controls, upload feedback, result chart/table regions, filter fieldsets, skip-link targets, and semantic data tables.

A real browser-based BIK/BITV audit is still needed before public release. The footer legal links are placeholders for a later external legal-service integration.

## Cleanup Notes

The frontend is now treated as a Shuffle-only app. Remove legacy company/layout switching only when the active Shuffle routes and visual behavior remain unchanged. Before deleting a page, component, service, or data file, check whether it is imported by `src/App.js`, another component, or a generated data workflow.