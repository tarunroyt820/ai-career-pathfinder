# Localhost Error Resolution Report

Date: 2026-05-16
Project: `Nextaro`

## Problem

The website shows a localhost error in the browser even though:

- backend is running
- API keys are loaded
- MongoDB is available

## Root Cause

The frontend is not being served from the correct project root.

Current structure:

- real frontend app lives in `frontend/`
- real frontend HTML entry is `frontend/index.html`
- real React entry is `frontend/src/main.tsx`

But the root scripts still run Vite like the app lives at the repository root:

- `package.json` uses `"dev": "vite"`
- `package.json` uses `"build": "tsc && vite build"`
- `package.json` uses `"preview": "vite preview"`

Because there is no root `index.html`, Vite starts but does not serve the app at `/`.

Verified behavior:

- `http://localhost:5173/` -> `404 Not Found`
- `http://localhost:5173/frontend/` -> `200 OK`
- `http://localhost:5000/health` -> backend responds correctly

So the issue is primarily a frontend startup configuration problem, not a backend failure.

## Resolution Strategy

## Recommended Fix

Treat `frontend/` as the actual Vite app root and update root scripts accordingly.

### Scripts to change

In [package.json](C:/Users/prabh/Downloads/Nextaro/package.json:6), update the scripts so Vite runs against `frontend/`.

Recommended direction:

```json
"scripts": {
  "dev": "vite --config frontend/vite.config.ts",
  "dev:all": "concurrently \"npm run dev\" \"cd backend && npm run dev\"",
  "run:program": "npm run dev:all",
  "run:website": "npm run dev:all",
  "build": "tsc && vite build --config frontend/vite.config.ts",
  "lint": "eslint .",
  "preview": "vite preview --config frontend/vite.config.ts"
}
```

## Important note

Using only `--config frontend/vite.config.ts` may still require the Vite config to explicitly set the app root, depending on how Vite resolves `index.html` in your setup.

That leads to the next required change.

### Vite config to change

In [vite.config.ts](C:/Users/prabh/Downloads/Nextaro/frontend/vite.config.ts:1), explicitly set the frontend root and keep aliases aligned with `frontend/src`.

Recommended shape:

```ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react/") || id.includes("react-jsx-runtime")) {
              return "vendor-react";
            }

            if (id.includes("react-router-dom")) {
              return "vendor-router";
            }

            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }

            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }

            if (id.includes("recharts")) {
              return "vendor-charts";
            }

            if (id.includes("react-markdown")) {
              return "vendor-markdown";
            }

            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            if (id.includes("sonner")) {
              return "vendor-toast";
            }

            return "vendor";
          }
        },
      },
    },
  },
})
```

## Why this resolves the issue

This makes Vite behave as if `frontend/` is the real app folder, which it is.

That means:

- `/` serves `frontend/index.html`
- the script `/src/main.tsx` resolves correctly inside the frontend project
- `npm run build` stops failing on missing `index.html`
- the browser can finally load the React app shell at the expected localhost URL

## Validation Steps After The Fix

After updating scripts and config, run these checks:

1. Start frontend only:
   - `npm run dev`
2. Open:
   - `http://localhost:5173/`
3. Confirm:
   - landing page loads
   - no 404 at root
4. Start full stack:
   - `npm run dev:all`
5. Confirm:
   - frontend opens at `http://localhost:5173/`
   - backend health works at `http://localhost:5000/health`
6. Run:
   - `npm run build`
7. Confirm:
   - build completes without `Could not resolve entry module "index.html"`

## Backend Checks After Frontend Fix

Once the frontend root issue is fixed, then validate backend-dependent flows:

1. Login
2. Signup
3. Dashboard overview
4. Profile fetch
5. One protected API route

This ordering matters because right now the browser is failing before many of those flows can even begin.

## Fallback Option

If you do not want `frontend/` to remain its own app root, the alternative is to move:

- `frontend/index.html` -> repository root
- `frontend/src` -> repository root `src`

Then the existing root Vite scripts would make more sense.

This is a larger restructure and is not the recommended first move.

## Extra Cleanup Recommended

These items are not the main cause, but they will reduce future confusion:

- remove or clarify the root `src/` folder if it is no longer the real frontend source
- avoid duplicated config responsibilities between root and `frontend/`
- document clearly that backend lives in `backend/` and frontend lives in `frontend/`
- consider adding a root README run section with exact commands

## Final Resolution Summary

To resolve the localhost error:

1. Point Vite to `frontend/` as the real app root.
2. Update root scripts to use the frontend Vite config.
3. Set `root` explicitly in `frontend/vite.config.ts`.
4. Re-test `npm run dev` and `npm run build`.

This should fix the browser-side localhost failure even when the backend was already healthy.
