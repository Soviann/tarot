# Issue #1: Project Setup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up a working dev environment with Symfony 7.4 + API Platform backend and React 19 + Vite frontend, both served via DDEV.

**Architecture:** Monorepo with `backend/` (Symfony) and `frontend/` (React) directories. DDEV manages the PHP/MariaDB backend and exposes the Vite dev server via `web_extra_exposed_ports`. The frontend runs inside the DDEV web container as a daemon.

**Tech Stack:** PHP 8.3, Symfony 7.4, API Platform 4, MariaDB, React 19, TypeScript, Vite, Tailwind CSS 4, vite-plugin-pwa, TanStack Query, React Router, Vitest

---

### Task 1: Initialize DDEV configuration for the backend

**Files:**
- Create: `backend/.ddev/config.yaml`

**Step 1: Create DDEV config**

```bash
cd /Users/nicolasvasse/Siqual/tarot
mkdir -p backend
cd backend
ddev config --project-name=tarot --project-type=symfony --php-version=8.3 --database=mariadb:10.11 --docroot=public
```

**Step 2: Configure Vite port exposure and frontend daemon**

Add to `backend/.ddev/config.yaml`:

```yaml
web_extra_exposed_ports:
  - name: vite
    container_port: 5173
    http_port: 5172
    https_port: 5173

web_extra_daemons:
  - name: vite
    command: bash -c 'cd /var/www/html/frontend && npm install && npm run dev'
    directory: /var/www/html/frontend
```

**Step 3: Start DDEV**

```bash
ddev start
```

Expected: DDEV starts successfully, `https://tarot.ddev.site` shows default page.

**Step 4: Commit**

```bash
git add backend/.ddev
git commit -m "chore(ddev): initialize DDEV config with PHP 8.3, MariaDB, Vite port

#1"
```

---

### Task 2: Create Symfony 7.4 project with API Platform

**Files:**
- Create: `backend/` (full Symfony skeleton)

**Step 1: Create Symfony project inside DDEV**

```bash
cd /Users/nicolasvasse/Siqual/tarot/backend
ddev composer create symfony/skeleton:"7.4.*" tmp && cp -a tmp/. . && rm -rf tmp
```

**Step 2: Install core dependencies**

```bash
ddev composer require symfony/orm-pack
ddev composer require api-platform/symfony
ddev composer require nelmio/cors-bundle
ddev composer require symfony/uid
ddev composer require --dev symfony/test-pack symfony/maker-bundle
```

**Step 3: Configure database URL**

The `.env` should already have `DATABASE_URL` configured by DDEV. Verify:

```bash
ddev exec grep DATABASE_URL .env
```

Expected: `DATABASE_URL="mysql://db:db@db:3306/db?serverVersion=10.11.0-MariaDB"`

**Step 4: Configure NelmioCorsBundle**

Create/edit `backend/config/packages/nelmio_cors.yaml`:

```yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin:
            - '%env(CORS_ALLOW_ORIGIN)%'
        allow_headers: ['Content-Type', 'Authorization']
        allow_methods: ['DELETE', 'GET', 'PATCH', 'POST', 'PUT']
        max_age: 3600
    paths:
        '^/api/': ~
```

Set in `.env`:

```
CORS_ALLOW_ORIGIN='^https?://(tarot\.ddev\.site)(:\d+)?$'
```

**Step 5: Configure API Platform**

Verify `backend/config/packages/api_platform.yaml` exists and set:

```yaml
api_platform:
    title: 'Tarot API'
    version: '1.0.0'
    formats:
        jsonld: ['application/ld+json']
    defaults:
        stateless: true
        cache_headers:
            vary: ['Content-Type', 'Authorization', 'Accept']
        extra_properties:
            standard_put: true
            rfc_7807_compliant_errors: true
    event_listeners_backward_compatibility_layer: false
```

**Step 6: Verify Symfony runs**

```bash
ddev launch
```

Expected: Symfony welcome page at `https://tarot.ddev.site`.

```bash
ddev launch /api
```

Expected: API Platform documentation page at `https://tarot.ddev.site/api`.

**Step 7: Create .gitignore for backend**

Ensure `backend/.gitignore` includes standard Symfony ignores. Symfony skeleton should already provide this.

**Step 8: Commit**

```bash
git add backend/ -f
git commit -m "feat(backend): initialize Symfony 7.4 with API Platform 4

Install Symfony skeleton, API Platform, Doctrine ORM, NelmioCorsBundle.
Configure CORS for DDEV domain and API Platform defaults.

#1"
```

---

### Task 3: Create React 19 frontend with Vite + TypeScript

**Files:**
- Create: `frontend/` (full Vite React project)

**Step 1: Scaffold React project inside DDEV**

```bash
cd /Users/nicolasvasse/Siqual/tarot
ddev exec bash -c 'cd /var/www/html && npm create vite@latest frontend -- --template react-ts'
```

**Step 2: Install dependencies**

```bash
ddev exec bash -c 'cd /var/www/html/frontend && npm install'
```

**Step 3: Install additional packages**

```bash
ddev exec bash -c 'cd /var/www/html/frontend && npm install react-router-dom @tanstack/react-query @tanstack/react-query-devtools'
ddev exec bash -c 'cd /var/www/html/frontend && npm install -D @tailwindcss/vite tailwindcss vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom jsdom'
```

**Step 4: Configure Vite for DDEV**

Edit `frontend/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tarot Score Tracker",
        short_name: "Tarot",
        description: "Track scores for 5-player French Tarot",
        theme_color: "#1e3a5f",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    origin: `${process.env.DDEV_PRIMARY_URL_WITHOUT_PORT}:5173`,
    cors: {
      origin:
        /https?:\/\/([A-Za-z0-9\-\.]+)?(\.ddev\.site)(?::\d+)?$/,
    },
  },
});
```

**Step 5: Set up Tailwind CSS 4**

Replace `frontend/src/index.css`:

```css
@import "tailwindcss";
```

**Step 6: Verify Vite dev server via DDEV**

```bash
ddev restart
```

Wait a few seconds for the Vite daemon to start, then:

```bash
ddev launch :5173
```

Expected: React default page loads at `https://tarot.ddev.site:5173`.

**Step 7: Commit**

```bash
git add frontend/ -f
git commit -m "feat(frontend): initialize React 19 + Vite + Tailwind CSS 4 + PWA

Scaffold React TypeScript app with Vite. Install TanStack Query,
React Router, Tailwind CSS 4 (Vite plugin), vite-plugin-pwa, Vitest.
Configure Vite dev server for DDEV integration.

#1"
```

---

### Task 4: Set up frontend project structure and base configuration

**Files:**
- Create: `frontend/src/main.tsx` (modify)
- Create: `frontend/src/App.tsx` (modify)
- Create: `frontend/src/pages/Home.tsx`
- Create: `frontend/src/pages/Stats.tsx`
- Create: `frontend/src/pages/Players.tsx`
- Create: `frontend/src/components/BottomNav.tsx`
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/vitest.config.ts`

**Step 1: Configure Vitest**

Create `frontend/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
  },
});
```

Create `frontend/src/test-setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

Add to `frontend/package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 2: Create API client**

Create `frontend/src/services/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/ld+json",
      "Content-Type": "application/ld+json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

**Step 3: Create page stubs**

Create `frontend/src/pages/Home.tsx`:

```tsx
export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Tarot</h1>
      <p className="text-gray-600">Select 5 players to start a session</p>
    </div>
  );
}
```

Create `frontend/src/pages/Stats.tsx`:

```tsx
export default function Stats() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Statistics</h1>
    </div>
  );
}
```

Create `frontend/src/pages/Players.tsx`:

```tsx
export default function Players() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Players</h1>
    </div>
  );
}
```

**Step 4: Create Layout with BottomNav**

Create `frontend/src/components/BottomNav.tsx`:

```tsx
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/stats", label: "Stats", icon: "📊" },
  { to: "/players", label: "Players", icon: "👥" },
] as const;

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around">
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 text-xs ${
                isActive
                  ? "text-[#1e3a5f] font-semibold"
                  : "text-gray-500"
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

Create `frontend/src/components/Layout.tsx`:

```tsx
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Outlet />
      <BottomNav />
    </div>
  );
}
```

**Step 5: Wire up main.tsx and App.tsx**

Replace `frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Stats from "./pages/Stats";
import Players from "./pages/Players";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/players" element={<Players />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Replace `frontend/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Step 6: Add .env for frontend API URL**

Create `frontend/.env`:

```
VITE_API_URL=https://tarot.ddev.site/api
```

**Step 7: Run the dev server and verify**

```bash
ddev restart
ddev launch :5173
```

Expected: React app with bottom navigation, three tabs, Home page with "Tarot" heading.

**Step 8: Run tests to verify setup**

```bash
ddev exec bash -c 'cd /var/www/html/frontend && npm test'
```

Expected: Tests pass (or no tests yet, just verify Vitest runs).

**Step 9: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): add routing, layout, page stubs, API client

Set up React Router with 3 routes (Home, Stats, Players).
Add Layout with BottomNav. Configure TanStack Query provider.
Add API client service. Configure Vitest with jsdom.

#1"
```

---

### Task 5: Create test environment and backend test config

**Files:**
- Create: `backend/.env.test`
- Modify: `backend/phpunit.xml.dist`

**Step 1: Configure test environment**

Create `backend/.env.test`:

```
KERNEL_CLASS='App\Kernel'
APP_SECRET='test_secret_for_testing'
SYMFONY_DEPRECATIONS_HELPER=disabled
DATABASE_URL="mysql://db:db@db:3306/db_test?serverVersion=10.11.0-MariaDB"
```

**Step 2: Create test database**

```bash
ddev exec bin/console doctrine:database:create --env=test --if-not-exists
```

**Step 3: Verify PHPUnit runs**

```bash
ddev exec bin/phpunit
```

Expected: PHPUnit runs (0 tests, or default Symfony test passes).

**Step 4: Commit**

```bash
git add backend/.env.test backend/phpunit.xml.dist
git commit -m "chore(backend): configure test environment with db_test

#1"
```

---

### Task 6: Final verification and cleanup

**Step 1: Verify full stack**

```bash
ddev restart
```

- `https://tarot.ddev.site` → Symfony welcome or API doc
- `https://tarot.ddev.site/api` → API Platform docs
- `https://tarot.ddev.site:5173` → React app with navigation

**Step 2: Clean up default files**

Remove default Vite/React boilerplate files that are no longer needed:
- `frontend/src/App.css`
- `frontend/src/assets/react.svg`
- `frontend/public/vite.svg`

**Step 3: Update README and CHANGELOG**

Update `README.md` access URLs if needed.
Add to `CHANGELOG.md` under `[Unreleased] > Added`.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: clean up boilerplate, update docs

Remove default Vite/React template files.
Update README with actual access URLs.

fixes #1"
```

**Step 5: Push**

```bash
git push
```
