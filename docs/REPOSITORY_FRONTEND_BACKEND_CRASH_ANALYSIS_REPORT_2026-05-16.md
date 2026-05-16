# Nextaro Repository Analysis And Localhost Crash Report

Date: 2026-05-16
Workspace: `C:\Users\prabh\Downloads\Nextaro`

## Executive Summary

The backend is not the primary reason the website appears down in the browser.

The verified blocking issue is a frontend dev-server root mismatch:

- The frontend application source lives in `frontend/`.
- The root `package.json` starts Vite from the repository root with `"dev": "vite"`.
- There is no root `index.html` in the repository.
- As a result, Vite starts successfully, but `http://localhost:5173/` responds with `404 Not Found`.
- The actual frontend entry file is reachable under `http://localhost:5173/frontend/`, because `frontend/index.html` exists there.

So the browser symptom is not "MongoDB is down" or "API keys are broken". The browser cannot load the app from `/` because the frontend is mounted in the wrong project root during development.

## Verification Performed

### Backend verification

- Started the backend dev server from `backend/`.
- Requested `http://localhost:5000/health`.
- Response returned `{"status":"ok"}`.

This confirms the Express server is reachable on port `5000`.

### Frontend verification

- Started the frontend dev server from the repository root using the existing root script.
- Requested `http://localhost:5173/`.
- Received `404 Not Found`.
- Requested `http://localhost:5173/frontend/`.
- Received `200 OK`.

This confirms the frontend server process is up, but the app is not being served from the root URL the team is likely opening in the browser.

### Build verification

- Ran the root production build.
- Vite failed with: `Could not resolve entry module "index.html"`.

This matches the same structural problem seen in development.

## Frontend Analysis

### Frontend structure

The real frontend application is located inside `frontend/`:

- HTML entry: `frontend/index.html`
- React bootstrap: `frontend/src/main.tsx`
- Main router: `frontend/src/App.tsx`
- Shared HTTP setup: `frontend/src/services/http.ts`

The frontend is a React + TypeScript + Vite application using:

- `react-router-dom` for routing
- `@tanstack/react-query` for client-side data fetching state
- `axios` with auth/refresh interceptors
- Tailwind-based styling and a large custom component library
- Lazy-loaded route segments for dashboard and landing page sections

### Frontend entry flow

`frontend/src/main.tsx` mounts the app with:

- `QueryClientProvider`
- `BrowserRouter`
- `App`

`frontend/src/App.tsx` defines:

- Public marketing pages
- Auth flows
- Protected dashboard routes
- Admin route gating
- Skill exchange and messaging areas

### Frontend API behavior

The frontend is correctly configured to talk to the backend:

- `frontend/src/services/http.ts` uses `VITE_API_URL` or defaults to `http://localhost:5000`
- root `.env` defines `VITE_API_URL=http://localhost:5000`

This means API targeting is not the reason the browser says localhost is missing.

### Frontend structural issue

The dev server scripts are rooted incorrectly for the current folder layout.

Relevant evidence:

- Root script uses Vite from repo root: `package.json:7-13`
- Frontend HTML lives in subfolder: `frontend/index.html:1-15`
- Frontend HTML expects `/src/main.tsx`: `frontend/index.html:13`
- The actual `main.tsx` is also inside `frontend/src/`: `frontend/src/main.tsx:1-19`

Because Vite is launched from the repository root, it looks for a root `index.html` during build and root URL serving. That file does not exist.

Result:

- Dev server process starts
- Root URL does not serve the app
- Production build fails

## Backend Analysis

### Backend structure

The backend is a Node/Express API inside `backend/`:

- startup: `backend/server.js`
- app wiring: `backend/app.js`
- Mongo connection: `backend/config/db.js`
- controllers, services, models, middleware, jobs, queues, and scripts are organized by concern

### Backend responsibilities

The backend exposes:

- authentication
- dashboard overview
- profiles
- AI endpoints
- career plans
- resume upload and analysis
- skills, requests, matches, agreements, sessions, disputes, reviews
- notifications
- discovery/search
- admin analytics and admin users
- push subscriptions

### Backend startup behavior

`backend/server.js`:

- loads `backend/.env`
- starts Express on `PORT` or `5000`
- starts even if Mongo is not yet connected
- retries DB connectivity in the background
- initializes the AI queue if possible
- logs the allowed frontend origin

This behavior is intentional and means the API can still answer `/health` even while Mongo reconnects.

### Backend middleware behavior

`backend/app.js` includes:

- `helmet`
- custom XSS sanitization
- CORS allowing localhost origins and dynamic localhost ports
- request logging
- rate limiting
- `/health`
- a DB guard that returns `503` for `/api/*` when Mongo is disconnected

Important distinction:

- If Mongo were the issue, the browser would still load the frontend shell, and API calls would fail with `503`.
- Your current symptom is happening before that stage because the frontend root page is not being served correctly.

## Root Cause Of The Browser Crash

Primary root cause:

- The frontend application is stored in `frontend/`, but the root Vite scripts run as if the app root were the repository root.

Concrete evidence:

1. `package.json:7` uses `"dev": "vite"`.
2. `package.json:11` uses `"build": "tsc && vite build"`.
3. There is no repository-root `index.html`.
4. The real HTML entry is `frontend/index.html`.
5. Direct request results were:
   - `http://localhost:5173/` -> `404 Not Found`
   - `http://localhost:5173/frontend/` -> `200 OK`
6. Root build fails because Vite cannot find `index.html`.

## Why It Looks Like "localhost not found"

From the developer perspective, the terminal is misleading in a very specific way:

- Vite prints a local URL such as `http://localhost:5173/`.
- But that URL is not actually serving your app because the entry HTML is not at the repo root.
- If someone opens only `localhost:5173`, they see a failure page or not-found page and conclude the site crashed.

The backend being healthy does not fix this, because the browser never reaches the React app shell at the expected root URL.

## Secondary Observations

These are not the primary crash cause, but they are worth cleaning up:

- The root `src/` folder only contains `index.css`, which increases confusion about which folder is the real frontend root.
- There are duplicated frontend-related configs at the root and inside `frontend/`.
- The backend log during testing showed background jobs skipping when Mongo was not yet connected. That is not the browser crash, but it may still affect authenticated features if DB connectivity is unstable.
- The frontend and backend logs in the repository root are mostly empty, so they are not currently helping with diagnosis.

## Recommended Fix

Use one of these approaches and keep it consistent:

### Preferred approach

Treat `frontend/` as the actual Vite project root.

That means:

- run Vite against `frontend/`
- build from `frontend/`
- preview from `frontend/`
- keep backend execution in `backend/`

Examples of the direction:

- change root scripts to point Vite at `frontend`
- or set `root: "frontend"` in the active Vite config and update related paths carefully

### Alternative approach

Move the frontend entry files up to the repository root so that:

- root `index.html` exists
- root `src/main.tsx` exists
- the current root Vite scripts become structurally correct

This is a bigger reorganization and is less attractive unless the team wants a flatter layout.

## Most Likely Minimal Fix Path

1. Make the root Vite scripts explicitly target `frontend/`.
2. Verify `npm run dev` serves the app at `http://localhost:5173/` instead of `/frontend/`.
3. Re-run `npm run build` and confirm the `index.html` resolution error disappears.
4. After that, test login, dashboard, and one protected API call.

## Final Conclusion

The website is not crashing because the API keys failed, the Express server failed, or MongoDB alone failed.

The main failure is a project-structure and dev-server-root mismatch:

- backend is reachable
- frontend code exists
- frontend is being served from the wrong base location
- root browser URL does not map to the actual app entry

Until that frontend root mismatch is corrected, `localhost` will continue to look broken even when the backend, API keys, and MongoDB are running.
