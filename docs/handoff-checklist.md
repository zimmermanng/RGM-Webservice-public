# Handoff Checklist

Use this checklist before sharing or deploying the Shuffle webservice.

## Required Setup

- Install backend dependencies in `backend/` with `npm install`.
- Install frontend dependencies in `frontend/` with `npm install`.
- Copy `backend/.env.example` to `backend/.env` and adjust values if needed.

## Verification

- Backend: run `node -e "require('./app'); console.log('backend app loads')"` from `backend/`.
- Frontend: run `npm run build` from `frontend/`.
- The legacy frontend `npm test` command currently needs separate maintenance because the existing React Scripts test runner does not resolve the installed React Router package.

## Data Generator

- The optional Excel-to-JSON generator lives in `frontend/data-generator/`.
- It writes generated JSON to `frontend/data-generator/rgm-setup/`.
- Review generated JSON before copying it into `frontend/src/components/data/`; output from the current `Daten.xlsx` is not identical to the active app data.

## Local Files Not For Handoff

- `frontend/node_modules/`
- `backend/node_modules/`
- `frontend/build/` unless intentionally sharing a production build
- real `.env` files with local or secret values