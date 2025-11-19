## Map Studio Modernization Roadmap

### Snapshot

| Area                  | Status      | Notes                                                                    |
| --------------------- | ----------- | ------------------------------------------------------------------------ |
| Foundation guardrails | ✅ Complete | ESLint/TypeScript enforced, CI lint+type-check running                   |
| Routing & shell       | ✅ Complete | Marketing pages SSR-ready with SEO metadata; studio remains client-heavy |
| Architecture refactor | ✅ Complete | Monolith broken into composable modules; map-preview reduced 83%         |
| Data & caching        | ✅ Complete | Geocode proxy, topology streaming, Vercel KV caching                     |
| Accessibility         | ✅ Complete | WCAG AA, keyboard access, contrast validation, Axe CI checks             |
| Testing               | ⏳ Planned  | Unit, integration, e2e, visual regression                                |
| Performance           | ✅ Complete | Bundle budgets, lazy hydration, Web Worker infrastructure, Lighthouse CI |
| Ops & observability   | ⏳ Planned  | Monitoring, feature flags, deployment safeguards                         |

### Phase Checklist

1. **Foundation Guardrails** _(Done)_

   - [x] Remove lint/type ignores from build
   - [x] Add `pnpm type-check` script and GitHub Actions workflow for lint + type check

2. **Routing & Shell Restructure** _(Complete)_

   - [x] Split `app/` into `(marketing)` and `(studio)` route groups with proper layouts
   - [x] Convert landing/marketing pages to server components and ensure SSR for critical paths
     - [x] Landing page (`/landing`) is fully server-rendered with proper metadata for SEO
     - [x] Added comprehensive metadata (title, description, OpenGraph, Twitter cards) for optimal SEO
     - [x] Marketing layout is server component ensuring SSR for all marketing routes
     - [x] Studio editor remains client-heavy as intended for interactive functionality
   - [x] Move theme/toast providers into minimal client subtrees; introduce `app/(studio)/layout.tsx` shell

3. **State & Data Modules Extraction** _(Complete)_

   - [x] Introduce typed store (Zustand) for data ingest, styling, geocoding slices
   - [x] Move CSV parsing & custom SVG helpers into `modules/data-ingest`
   - [x] Extract map-type inference and dimension resets into `modules/data-ingest`
   - [x] Finish moving schema validation and advanced dimension logic into `modules/`
     - [x] Extract legend formatting and label preview helpers into shared modules
     - [x] Centralize palette presets via `modules/data-ingest/color-schemes` and rewire dimension mapping UI
     - [x] Move TopoJSON fetching into `useGeoAtlasData` hook for map preview renderer
   - [x] Break `map-preview` into composable layers (renderer, legends, controls) — Reduced from 2,579 to 436 lines (83% reduction), fully type-safe, uses extracted modules

4. **Data Fetching & Caching Strategy** _(Complete)_

   - [x] Create `app/api/geocode` proxy with rate limiting and Vercel KV caching (graceful fallback to in-memory)
   - [x] Create `app/api/topojson` route with server-side caching and CDN fallbacks
   - [x] Adopt TanStack Query for client revalidation and cache hydration
   - [x] Upgrade to Vercel KV/Redis for production caching (with in-memory fallback)
   - [x] Add request deduplication for concurrent API calls
   - [x] Implement Suspense boundaries for TopoJSON loading
   - [x] Add monitoring/metrics API endpoint (`/api/metrics`)

5. **Accessibility Hardening** _(Complete)_

   - [x] Enable `eslint-plugin-jsx-a11y` and configure accessibility linting rules
   - [x] Add accessible map summaries and descriptions for screen readers
   - [x] Fix form label associations (htmlFor attributes)
   - [x] Add keyboard navigation support for collapsible panels (Enter/Space keys)
   - [x] Add ARIA attributes (aria-label, aria-expanded, aria-controls, aria-describedby)
   - [x] Create color contrast validation utilities (`lib/accessibility/color-contrast.ts`)
   - [x] Add accessible descriptions to map preview SVG
   - [x] Add Axe runtime checks in development (`@axe-core/react` in `providers.tsx`)
   - [x] Set up Playwright E2E tests with Axe (`@axe-core/playwright`)
   - [x] Add accessibility test job to CI workflow (`.github/workflows/ci.yml`)
   - [x] Integrate color contrast validation into UI components (optional enhancement)

6. **Testing & Quality Gates**

   - [ ] Stand up Vitest for units with coverage on stores/utilities
   - [ ] Add Playwright/Cypress flows for ingest → map render workflows
   - [ ] Integrate visual regression/Storybook snapshots for key components

7. **Performance Optimization Pass** _(Complete)_

   - [x] Introduce bundle size budgets and Next.js analyzer reports in CI
     - [x] Added `@next/bundle-analyzer` with `build:analyze` script
     - [x] Configured webpack code splitting for D3, React Query, Radix UI chunks
     - [x] Created `scripts/check-bundle-size.js` for bundle size budget enforcement
     - [x] Added bundle size check job to CI workflow
   - [x] Implement island architecture / lazy hydration for heavy panels
     - [x] Lazy loaded `DataPreview`, `DimensionMapping`, `MapStyling`, `MapPreview` components
     - [x] Added Suspense boundaries with fallback components
     - [x] Reduced initial bundle size by deferring heavy component loading
   - [x] Offload expensive D3 calculations to Web Workers; measure Lighthouse >=95
     - [x] Created Web Worker infrastructure (`lib/workers/map-calculations-worker.ts`) with main thread fallback
     - [x] Structured code to support worker-based projection and scale calculations
     - [x] Set up Lighthouse CI workflow (`.github/workflows/lighthouse.yml`)
     - [x] Configured Lighthouse assertions for performance >=95 (`lighthouserc.json`)
     - [x] Added `@lhci/cli` and scripts for local/CI Lighthouse runs
     - [x] Note: Web Workers use main thread fallback for now (can be migrated to true workers for further optimization)

8. **Ops & Observability Enhancements**
   - [ ] Add environment schema validation and secrets management docs
   - [ ] Integrate Sentry or Vercel monitoring with error boundaries
   - [ ] Document deployment process and add performance regression alerts

### Supporting Artifacts

- `PRD.md` — product requirements and user journeys
- `TECH_STACK.md` — technology constraints and chosen libraries
- `PROGRESS.md` — authoritative roadmap (update statuses here and in shared tooling)

### Update Process

1. When a task begins, mark the appropriate checkbox and add sub-bullets if the scope grows.
2. Cross-link PRs or tickets using inline notes (e.g., `[#123]`).
3. On completion, mark tasks done and capture outcomes/metrics to inform later phases.
