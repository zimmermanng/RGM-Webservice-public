# Digital Accessibility Maturity Model
## Contents

- [Main features](#main-features)
- [Technology](#technology)
- [Repository structure](#repository-structure)
- [Architecture and data flow](#architecture-and-data-flow)
- [Set up from zero without Docker](#set-up-from-zero-without-docker)
- [Set up with Docker](#set-up-with-docker)
- [Configure the backend](#configure-the-backend)
- [Configure the frontend](#configure-the-frontend)
- [Database setup and team seed data](#database-setup-and-team-seed-data)
- [Database migrations](#database-migrations)
- [Edit the maturity model with Excel and the JSON converter](#edit-the-maturity-model-with-excel-and-the-json-converter)
- [Available commands](#available-commands)
- [Troubleshooting](#troubleshooting)
- [Production and server deployment](#production-and-server-deployment)

## Main features

- Team-based login with a hierarchical organisational structure
- Session and team-lock handling
- Selection and locking of maturity-model dimensions
- Accessibility questionnaire with maturity levels
- Storage of current answers and completed survey runs
- Result views, charts, raw results, and recommendations for action
- Administrative team and evaluation-round management
- Evaluation summaries
- Excel-to-JSON workflow for maintaining the maturity-model content

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 18, React Router, Axios, D3, Chart.js |
| Backend | Node.js, Express 5 |
| Database | SQLite |
| ORM/migrations | Prisma 6 |
| Authentication | Express sessions and bcrypt password hashes |
| Model authoring | Excel (`.xlsx`) and the `xlsx` Node package |
| Container frontend | Multi-stage Node build served by nginx |
| Container backend | Node image with Prisma Client generation |

### Prerequisites

For a local installation:

- Node.js 18 or newer
- npm 9 or newer
- Git

For the container-based setup:

- Docker Engine or Docker Desktop
- Docker Compose v2 (`docker compose`)

## Repository structure

```text
.
├── backend/
│   ├── db/                     # Prisma client
│   ├── prisma/
│   │   ├── migrations/         # Database migrations
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Initial team hierarchy and passwords
│   ├── routes/                 # Auth, session, team, and evaluation APIs
│   ├── .env                    # Local configuration (not committed)
│   ├── Dockerfile
│   ├── index.js                # Backend entry point; port 3011
│   └── package.json
├── frontend/
│   ├── Backend/excel/
│   │   ├── Daten.xlsx          # Four-sheet model source workbook
│   │   └── build-json.js       # Excel-to-JSON converter
│   ├── public/                 # Static files and downloads
│   ├── src/
│   │   ├── components/data/    # Generated maturity-model JSON used by the app
│   │   ├── pages/              # Application pages
│   │   ├── services/           # Result extraction/calculation
│   │   └── config.ts           # API base URL
│   ├── .env                    # Local configuration (not committed)
|   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .env                        # Local configuration required for building docker images (not committed)
├── docker-compose.yml
└── README.md
```

## Architecture and data flow

The React frontend and the Express API run on `http://localhost` during local development.
Ports must be assigned in `frontend/.env` and `backend/.env`.
These ports are by default `3000` for the React frontend and `3011` for the Express API.
The backend persists teams, settings,
sessions, answers, survey runs, snapshots, and evaluation rounds in SQLite
through Prisma.

The maturity-model definition itself is not stored in the database. It is
maintained in `frontend/Backend/excel/Daten.xlsx`, converted into four JSON
files, and imported at frontend build time from
`frontend/src/components/data/`. The backend evaluation route also loads
`struktur.json` from that directory.

```text
Daten.xlsx
    │
    ▼
build-json.js
    │
    ├── struktur.json
    ├── fragen.json
    ├── handlungsempfehlungen.json
    └── dimensionen_content.json
            │
            ▼
frontend/src/components/data/
            │
            ├── React questionnaire and result views
            └── Backend evaluation logic (struktur.json)
```

Because JSON is imported into the application bundle, restart the development
server after replacing it. For a production frontend, create a new build.

## Set up from zero without Docker

### 1. Clone and enter the repository

```bash
git clone <repository-url>
cd RGM-Webservice
```

### 2. Install dependencies

Install the backend and frontend independently:

```bash
cd backend
npm ci
cd ../frontend
npm ci
cd ..
```

Use `npm install` instead if intentionally updating dependencies or if a lock
file is unavailable. Commit resulting lock-file changes deliberately.

### 3 Create `.env` files

#### 3.1 Create `backend/.env`
Create the `backend/.env` file from scratch:

```dotenv
DATABASE_URL="file:./dev.db"
APP_PASSWORD="replace-with-a-local-login-password"
SESSION_SECRET="replace-with-a-long-random-secret"
FRONTEND_URL="http://localhost:3000"
REACT_APP_BACKEND_PORT="3011"
```

Optional session settings:

```dotenv
# Ten years is currently used when this variable is omitted.
SESSION_TIMEOUT_MS=86400000

# Warning shown before expiry; defaults to five minutes.
SESSION_WARNING_MS=300000
```

See [Configure the backend](#configure-the-backend) before using real or
production data.

#### 3.2 Create `frontend/.env`
Create the `frontend/.env` file from scratch:
```dotenv
PORT="3000"
REACT_APP_BACKEND_PORT="3011"
```
> [!IMPORTANT]  
> The value of the environment variable `PORT` in `frontend/.env` must be identical to the port declared in `FRONTEND_URL` in `backend/.env`.
Additionally, the value of the environment variable REACT_APP_BACKEND_PORT must be identical in both `frontend/.env` and `backend/.env`.

See [Configure the frontend](#configure-the-frontend) before using real or
production data.

### 4. Initialise the database

From `backend/`:

```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

`prisma migrate deploy` creates/updates the SQLite database using the checked-in
migrations without creating a new development migration.

The seed creates the initial organisational team tree and an `Administration`
team. Every selectable team receives a bcrypt hash of `APP_PASSWORD`.

### 5. Start the backend

In terminal 1:

```bash
cd backend
npm start
```

The API listens on `http://localhost` under the assigned port (default settings assign port `3011`).

### 6. Start the frontend

In terminal 2:

```bash
cd frontend
npm start
```

Open `http://localhost` including the assigned port (default settings assign port `3000`). Select a seeded team and use the value configured
as `APP_PASSWORD`.

## Set up with Docker

Port mappings are declared in the `./.env` file:

| Service | Host URL | Container port |
| --- | --- | --- |
| Frontend | `http://localhost:${PORT}` | `8080` |
| Backend | `http://localhost:${REACT_APP_BACKEND_PORT}` | Variable |

Ports may need to be adjusted according to personal configurations.

The repository includes Dockerfiles and a Compose file:

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

Stop the services with:

```bash
docker compose down
```

### Current Docker limitations

The checked-in container configuration is **not production-ready** and does not provide a complete clean-machine bootstrap:

- Backend CORS is currently hard-coded to `http://localhost:3000`, but Compose
  exposes the frontend at `http://localhost:3010`. Browser API requests from the
  containerised frontend will therefore require the planned CORS adjustment. **(Fixed?)**
- `FRONTEND_URL` is read by the backend but is not currently used by its CORS
  middleware. **(Fixed?)**
- The frontend API base is build-time source configuration in
  `frontend/src/config.ts` and currently points to `http://localhost:3011`. **(Fixed?)**
- Compose does not run Prisma migrations or seed automatically.
- The SQLite file has no Docker volume, so container replacement can lose data.
- Compose reads `backend/.env`, `frontend/.env` and `./.env`; create it before building/running.
- TLS, reverse proxy routing, secret management, health checks, backups,
  resource limits, and production session storage are not configured.
- Both published ports bind to `127.0.0.1`; this is useful behind a local reverse
  proxy but does not expose the application directly on a server network.
- The frontend images use `dhi.io`; access to that registry/image source must be
  available in the build environment.

For now, the non-Docker setup is the reliable development path. The existing
Docker files should be treated as the basis for the later server deployment
work, not as final deployment instructions.

## Configure the backend

`backend/.env` is ignored by Git. Never commit real secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma SQLite URL, normally `file:./dev.db` |
| `APP_PASSWORD` | Yes for seed | Password assigned to all selectable seeded teams |
| `SESSION_SECRET` | Yes | Signs session cookies; use a long random value |
| `FRONTEND_URL` | Yes | Frontend origin(; currently not wired into CORS) |
| `REACT_APP_BACKEND_PORT` | Yes | Assigned backend port | 
| `SESSION_TIMEOUT_MS` | No | Session/lock lifetime in milliseconds |
| `SESSION_WARNING_MS` | No | Pre-expiry warning period in milliseconds |
| `NODE_ENV` | No | In `production`, marks cookies as `secure` |

Important current behaviour:

- The backend listens on port `3011`; this is not environment-configurable. **(Fixed?)**
- Backend CORS currently permits `http://localhost:3000` only. **(Fixed?)**
- If `SESSION_SECRET` is absent, the backend falls back to an unsafe development
  string. Always set it.
- Production `secure` cookies require HTTPS.
- The default session timeout is currently ten years. Configure an appropriate
  value for the intended environment.
- Express's default in-memory session store is suitable only for development,
  not a multi-instance production deployment.

## Configure the frontend

`frontend/.env` is ignored by Git. Never commit real secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Yes | Assigned frontend port |
| `REACT_APP_BACKEND_PORT` | Yes | Assigned backend port | 
| `NODE_ENV` | No | In `production`, marks cookies as `secure` |

## Database setup and team seed data

The Prisma schema is in `backend/prisma/schema.prisma`. The application uses
SQLite and includes checked-in migration history.

Useful commands, run from `backend/`:

```bash
# Regenerate Prisma Client after schema/dependency changes
npm run prisma:generate

# Apply existing migrations in a clean/deployment environment
npx prisma migrate deploy

# Create a new migration while developing a schema change
npm run prisma:migrate -- --name describe_the_change

# Seed/update the initial teams and password hashes
npm run prisma:seed
```

The organisational structure is currently code-defined in
`backend/prisma/seed.js`. To change the initially seeded hierarchy, edit
`TEAM_TREE` before running the seed.

Seeding uses `upsert`, so matching team names are updated and missing teams are
created. It does not remove database teams that were deleted from `TEAM_TREE`.
All selectable seeded teams share `APP_PASSWORD`; rerunning the seed updates
their password hashes to the current value.

Before experimenting with a database that contains useful survey data, make a
copy of the SQLite file referenced by `DATABASE_URL`.

## Database migrations

Changes to the Prisma database schema under `backend\prisma\schema.prisma` require the creation of a down and up migration.

### Creating migrations

#### 1. Creating a down migration
In order to create a down migration, run the following command from `backend/`:
```bash
# Create a down migration based on differences 
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script > down.sql
```
This command creates a down migration by comparing it to the current state of the database. This method relies on the database having an up-to-date schema.
The down migration can be found as `down.sql` at the root of the `backend` directory.

#### 2. Creating an up migration
After successfully creating a down migration, an up migration needs to be created.
Creating an up migration requires running the following command from `backend/`:
```bash
# Create an up migration
npx prisma migrate dev --name example_migration
```
Running this command creates a new directory titled `<timestamp>_<migration_name>` inside the `prisma/migrations` directory.

#### 3. Placing the down migration inside the up migration directory
Lastly, place the newly created `down.sql` file from step 1 inside the up migration folder created during step 2.
The new directory with the name `<timestamp>_<migration_name>` should now contain two files: `down.sql` (down migration) and `migrations.sql` (up migration). 

### Applying a down migration
> [!NOTE]
> The commands need to be adjusted by replacing `example_migration` with the actual failed migration name.
If a migration failed, a down migration can be applied.

First, the down migration needs to be executed by running the following command from `backend/`:
```bash
# Execute the down migration
npx prisma db execute --file ./prisma/migrations/example_migration/down.sql --url="file:./dev.db"
```

Second, it has to be recorded that the migration was rolled back by running the following command from `backend/`:
```bash
# Record the rolled back migration
npx prisma migrate resolve --rolled-back example_migration
```

More information can be found in the [PrismaDB v6 docs](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/generating-down-migrations).

## Edit the maturity model with Excel and the JSON converter

### Overview

The converter is:

```text
frontend/Backend/excel/build-json.js
```

Its default input is:

```text
frontend/Backend/excel/Daten.xlsx
```

It reads worksheets **by position, not by worksheet name**. Do not reorder the
four sheets.

| Position | Content | Output |
| --- | --- | --- |
| 1 | Dimensions → fields of action → questions | `struktur.json` |
| 2 | Recommendations → answer references → field of action | `handlungsempfehlungen.json` |
| 3 | Questions → answers → maturity levels | `fragen.json` |
| 4 | Dimension descriptions | `dimensionen_content.json` |

The output is first written to:

```text
frontend/Backend/excel/rgm-setup/
```

The converter creates that folder if necessary. It does **not** automatically
replace the live JSON files used by the application.

### Required columns

Header matching is case-insensitive and accepts several German/English aliases.
For the least surprising result, use these canonical headers.

#### Sheet 1: structure

| Column | Meaning |
| --- | --- |
| `ID Dimension` | Stable unique dimension ID |
| `Dimension` | Dimension display name |
| `ID Handlungsfeld` | Stable unique field-of-action ID |
| `Handlungsfeld` | Field-of-action display name |
| `ID Frage` | Stable unique question ID |
| `Frage` | Question text |

Each row represents a question and repeats its parent dimension and field.

#### Sheet 2: recommendations

| Column | Meaning |
| --- | --- |
| `ID Handlungsempfehlung` | Stable unique recommendation ID |
| `Handlungsempfehlung` | Recommendation text |
| `Antwort IDs` | One or more answer IDs that trigger it |
| `ID Handlungsfeld` | Related field-of-action ID |

Answer references may be written as:

- comma- or semicolon-separated IDs: `A1, A2; A3`
- JSON-like arrays: `["A1", "A2"]`
- parenthesised/single-quoted arrays: `('A1', 'A2')`
- ranges with one shared letter prefix: `A1-A4`

Ranges expand inclusively. A range such as `A4-A1` is normalised to `A1-A4`.
Mixed-prefix ranges such as `A1-B4` are not expanded.

#### Sheet 3: questions and answers

| Column | Meaning |
| --- | --- |
| `ID Frage` | Question ID; must match sheet 1 |
| `Frage` | Question text |
| `ID Handlungsfeld` | Parent field ID; must match sheet 1 |
| `ID Antwort` | Stable unique answer ID |
| `Antwort` | Answer text |
| `Stufe` | Numeric maturity level |

Use one row per possible answer. Recommendation answer text is also looked up
from this sheet, so every answer referenced on sheet 2 should exist here.

#### Sheet 4: dimension descriptions

| Column | Meaning |
| --- | --- |
| `ID Dimension` | Dimension ID; must match sheet 1 |
| `Beschreibung` | Explanatory content displayed for the dimension |

### Recommended editing rules

1. Keep IDs stable once surveys have been used. IDs connect all four datasets
   and may also occur in stored survey payloads.
2. IDs must be unique within their entity type.
3. Do not add leading/trailing spaces to IDs.
4. Keep every question's field ID consistent between sheets 1 and 3.
5. Keep every dimension ID on sheet 4 present on sheet 1.
6. Ensure every sheet-2 answer reference exists on sheet 3.
7. Use numeric values in `Stufe`; invalid or empty levels become `null`.
8. Keep the four worksheets in the required order.
9. Save a backup of both the workbook and current JSON before publishing a
   changed model.

### Run the converter

The converter uses the frontend's `xlsx` dependency. Install frontend
dependencies first, then run from the repository root:

```bash
node frontend/Backend/excel/build-json.js
```

To convert another workbook:

```bash
node frontend/Backend/excel/build-json.js path/to/another-workbook.xlsx
```

Relative input paths are resolved from the shell's current directory. Quote a
path that contains spaces.

The command prints output file locations. It also currently prints diagnostic
information for sheet 4; this is expected.

### Review and activate the generated files

Review all four files in `frontend/Backend/excel/rgm-setup/`. Check especially:

- expected numbers of dimensions, fields, questions, and answers
- empty names or descriptions
- `null` maturity levels
- recommendations with missing answer text
- references to IDs that no longer exist

After review, copy the generated files into the live data directory.

PowerShell:

```powershell
Copy-Item frontend\Backend\excel\rgm-setup\*.json `
  frontend\src\components\data\
```

Bash:

```bash
cp frontend/Backend/excel/rgm-setup/*.json \
  frontend/src/components/data/
```

Then restart `npm start`, or rebuild the frontend:

```bash
cd frontend
npm run build
```

Commit the workbook and the four generated JSON files together so the editable
source and runtime data remain in sync. Review their Git diff before committing.

### Generated JSON shapes

`struktur.json`:

```json
{
  "dimensionen": [
    {
      "id": "D1",
      "name": "Dimension",
      "handlungsfelder": [
        {
          "id": "HF1",
          "name": "Field",
          "fragen": [{ "id": "F1", "name": "Question" }]
        }
      ]
    }
  ]
}
```

`fragen.json`:

```json
{
  "fragen": [
    {
      "id": "F1",
      "frage": "Question",
      "antworten": [
        {
          "id": "A1",
          "antwort": "Answer",
          "handlungsfeldId": "HF1",
          "stufe": 1
        }
      ]
    }
  ]
}
```

`handlungsempfehlungen.json`:

```json
{
  "handlungsempfehlungen": [
    {
      "id": "HE1",
      "name": "Recommendation",
      "antworten": [
        {
          "id": "A1",
          "antwort": "Answer",
          "handlungsfeldId": "HF1"
        }
      ]
    }
  ]
}
```

`dimensionen_content.json`:

```json
{
  "dimensionen": [
    {
      "id": "D1",
      "beschreibung": "Dimension description"
    }
  ]
}
```

## Available commands

### Backend

Run in `backend/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the API |
| `npm run dev` | Start the API in watch mode (changes in watched files cause process to restart) |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create/apply a development migration |
| `npm run prisma:seed` | Seed the initial team hierarchy |
| `npx prisma migrate deploy` | Apply checked-in migrations |

The backend currently has no automated test suite.

### Frontend

Run in `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the React development server |
| `npm run build` | Create a production bundle in `frontend/build/` |
| `npm test` | Run React tests interactively |

## Troubleshooting

### The frontend cannot reach the backend

- Confirm that the backend is running on port `3011`. **(Fixed?)**
- Confirm `frontend/src/config.ts` points to the correct browser-accessible API.
- For local development, open the frontend through
  `http://localhost:3000`; backend CORS currently permits that origin only. **(Fixed?)**
- If cookies/sessions are missing, check CORS origin, Axios credentials, cookie
  security, protocol, and hostname together.

### Login fails after changing `APP_PASSWORD`

Changing `backend/.env` does not change existing hashes by itself. Run:

```bash
cd backend
npm run prisma:seed
```

This resets selectable seeded teams to the configured shared password.

### Prisma reports that the database or tables do not exist

From `backend/`:

```bash
npm run prisma:generate
npx prisma migrate deploy
```

Also verify that `DATABASE_URL` exists in `backend/.env`.

### Converter says `Excel file not found`

- Run the default command from the repository root, or pass an explicit path.
- Quote paths containing spaces.
- Ensure the workbook is saved as `.xlsx`.

### Converted data is missing

- Verify sheet order; names do not control routing.
- Verify the canonical headers above.
- Rows without the required parent/entity ID are skipped.
- Inspect the converter's `rgm-setup/` output before copying.
- Restart/rebuild the frontend after copying generated JSON.

### Docker frontend loads but login/API calls fail

Ensure that the assigned ports in `./.env`, `backend/.env` and `frontend/.env` are identical.
The following environment variables must have identical port declarations:
- `REACT_APP_BACKEND_PORT` in `./.env`, `backend/.env` and `frontend/.env`.
- `PORT` in `./.env` and `frontend/.env`. The port declared in this variable must match the declared port for `FRONTEND_URL` in `backend/.env`.

## Production and server deployment

The person preparing the final server Docker configuration should, at minimum:

- make frontend origin, API URL, and backend port environment-aware
- serve frontend and API behind one HTTPS reverse proxy/domain where practical
- use `FRONTEND_URL` in a strict CORS allowlist
- replace the in-memory session store with a persistent production store
- use externally managed secrets and a strong `SESSION_SECRET`
- select an appropriate session timeout
- add an SQLite volume and tested backup/restore procedure, or move to a
  production database selected for the expected concurrency
- run `prisma migrate deploy` as a controlled deployment step
- seed only when explicitly intended
- add service health checks and startup ordering based on readiness
- pin and review base images and ensure registry access
- add logging, monitoring, resource limits, and a non-root runtime where
  applicable
- define rollback procedures for both database and maturity-model JSON changes

The current `docker-compose.yml`, `backend/Dockerfile`, and
`frontend/Dockerfile` should be reviewed and adjusted during that work. They are to be treated as presets.
