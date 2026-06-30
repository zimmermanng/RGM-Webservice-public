# RGM Shuffle Webservice

RGM Shuffle Webservice is a Shuffle-only web application for running and evaluating the SHUFFLE maturity-model questionnaire for digital accessibility at universities. The project contains a React frontend, a small Express backend, static questionnaire data, and an optional Excel-to-JSON data generator.

The project was originally prepared for multiple company/layout variants. The current handover state is intentionally Shuffle-only: legacy company switching, authentication leftovers, and unused dependencies have been removed where they were not needed by the active Shuffle flow.

## Project Structure

```text
backend/                  Express service for health checks and session routes
frontend/                 React application, Shuffle pages, styles, assets, and app data
frontend/data-generator/  Optional Excel-to-JSON helper for regenerating questionnaire data
docs/                     Handoff notes and cleanup checklist
docker-compose.yml        Local container setup for frontend and backend
```

## Requirements

- Node.js and npm for local development
- Docker and Docker Compose for container-based usage

The Dockerfiles currently use Node 24 images. For local development without Docker, use a recent Node version compatible with the installed dependencies.

## Configuration

The backend reads configuration from `backend/.env`. Use `backend/.env.example` as the template:

```env
PORT=3011
FRONTEND_URL=http://localhost:3000
```

`PORT` is optional and defaults to `3011`. `FRONTEND_URL` controls the backend CORS origin and defaults to `http://localhost:3000`.

## Run With Docker

From the project root:

```bash
docker compose up --build
```

The services are exposed locally as:

- Frontend: `http://127.0.0.1:3010`
- Backend: `http://127.0.0.1:3011`

## Run Locally

Install and start the backend:

```bash
cd backend
npm install
npm start
```

Install and start the frontend in a second terminal:

```bash
cd frontend
npm install
npm start
```

The React development server usually opens on `http://localhost:3000`.

## Verification

Recommended checks before handover or deployment:

```bash
cd backend
node -e "require('./app'); console.log('backend app loads')"
```

```bash
cd frontend
npm run build
```

There is currently no backend test suite. The frontend production build is the reliable verification command right now. The legacy Create React App `npm test` command still exists, but it currently needs separate maintenance because the old Jest resolver does not resolve the installed React Router package.

## Backend Overview

The backend is intentionally small. It exposes a root health check and session routes under `/session`. Questionnaire results are not persisted by the backend; the current implementation keeps answer and result data on the client side.

## Frontend Overview

The frontend is a React application using React Router. It contains:

- Shuffle home page
- download page for supporting files
- upload flow for offline Excel assessments
- online questionnaire flow
- result pages with chart and table views
- static JSON data for questions, structure, indicators, and recommendations
- Shuffle theme setup in `src/theme.js` and `src/theme.css`

The upload flow parses the Excel file and opens the result page. It no longer triggers an automatic JSON download after parsing.

## Questionnaire Data

Active app data lives in:

```text
frontend/src/components/data/
```

The optional generator lives in:

```text
frontend/data-generator/
```

Run it from `frontend/data-generator/` with an Excel file path, for example:

```bash
node build-json.js ./excel/Daten.xlsx
```

The generator writes output to `frontend/data-generator/rgm-setup/`. Review generated JSON before copying it into `frontend/src/components/data/`; output from the current `Daten.xlsx` is not identical to the active app data.

## Accessibility Status

Several source-level accessibility improvements have been made during cleanup:

- single main landmark from `App.js`
- clearer heading structure on route pages
- accessible names and states for navigation, questionnaire buttons, upload controls, result toggles, and dimension controls
- chart/table alternatives and named result regions
- focusable skip-link targets on result pages
- semantic fieldsets for result filters
- non-interactive table rows no longer create extra keyboard stops

A real browser-based BIK/BITV audit is still required before public release. The footer legal links are intentional placeholders for a later external legal-service integration.

## Cleanup Rules For Future Work

- Keep existing Shuffle functionality and design unchanged unless a requested cleanup explicitly requires a behavior change.
- Remove legacy company-switching code only after confirming the active Shuffle path does not rely on it.
- Add file-level summaries where they help a new developer understand the file.
- Add function comments for non-obvious logic, data contracts, or side effects.
- Avoid comments that repeat what the code already says.
- Before deleting code or content, check whether it is imported, routed, or used by generated assets.
- Treat `frontend/build/`, `node_modules/`, and real `.env` files as local artifacts, not source handoff material.

## Handoff Notes

See `docs/handoff-checklist.md` before sharing or deploying the project. The repository has been cleaned gradually; prefer small, reviewable changes over broad rewrites.