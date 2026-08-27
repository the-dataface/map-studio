# Map Studio V2 Plan

Planning document for the V2 revamp. Captures architectural decisions, scope, and phasing agreed after V1 shipped.

**Status:** Draft  
**Branch:** `feat/v2-revamp`  
**Last updated:** August 2026

---

## Context

V1 delivers exportable SVG and PNG maps in two data modes (symbols and choropleth), overlaid on preset geographies (US, Canada, world) or custom SVG uploads. The D3 + TopoJSON render pipeline, dimension mapping, geocoding, styling controls, and Figma-ready SVG export are production-ready and remain core to user workflows.

V2 expands Map Studio into:

- Real geographic context (zoomed views, basemaps, street-level detail)
- Richer visualization types (flows, spikes, heatmaps, mini charts, locators)
- Broader choropleth coverage (any admin level, scoped regions)
- Embeddable interactive maps
- Faster project setup via programmatic configuration (including natural-language intent)

V2 adds capability. It does not replace V1's SVG pipeline.

---

## Guiding principles

1. **Two render targets, one project config.** Data, dimension mapping, and styling intent are shared. SVG and MapLibre are parallel renderers, not separate products.

2. **Editorial quality is universal.** Maps should look publication-ready regardless of render target or whether the output is static or interactive. "Editorial" describes polish, not a pipeline choice.

3. **Interactivity is an output property.** Zoom, hover tooltips, and embed behavior are configured at publish time. They are not tied to a specific renderer or workflow.

4. **The SVG pipeline stays first-class.** Figma handoff, fixed-layout region maps, custom SVG uploads, drawn paths, and precise label control remain supported and actively maintained.

5. **Config is the source of truth.** UI panels, templates, and programmatic setup all mutate the same project state. Renderers consume what they support and surface clear compatibility boundaries.

6. **Boundary and join logic is shared.** Choropleth data-to-geography matching runs once; both renderers consume the result.

---

## Architecture overview

```
                    ┌─────────────────────────┐
  CSV / data ──────►│     Project config      │◄──── UI panels
                    │      (shared core)      │◄──── Templates
                    │                         │◄──── Programmatic setup
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
         SVG renderer                      MapLibre renderer
         D3 + TopoJSON                     WebGL + vector tiles
                │                                 │
                ▼                                 ▼
    SVG / PNG (Figma)                   PNG / embed / live map
```

### Render target

Each project declares a primary render target:

```ts
type RenderTarget = 'svg' | 'maplibre';
```

Users set this at project creation, via a toggle in the map chrome, or through templates/programmatic setup. One preview canvas is active at a time based on `renderTarget`.

Switching render targets carries shared config forward. Renderer-specific settings are preserved but may become dormant when inactive.

---

## What V1 keeps (SVG renderer)

The existing pipeline in `modules/map-preview/` continues unchanged in role:

| Capability | Notes |
|---|---|
| Fixed canvas (975×610) | Designed layout, predictable export dimensions |
| Projections | Albers USA, Mercator, Equal Earth, Albers |
| Preset geographies | `usa-states`, `usa-counties`, `usa-nation`, `canada-provinces`, `canada-nation`, `world` |
| Custom SVG upload | User-provided boundary files |
| Symbol + choropleth layers | Existing dimension mapping |
| Labels, legends, paths | Including inspect/select/move tools |
| SVG export + copy to clipboard | Primary Figma workflow |
| PNG rasterization | From SVG |

SVG is the right choice when users need vector output, fixed aspect ratios, custom uploaded boundaries in SVG format, or preset region maps that already exist in the catalog.

---

## What V2 adds (MapLibre renderer)

MapLibre becomes the second render target for geographic context and richer layers.

| Capability | Notes |
|---|---|
| Pan / zoom viewport | Any location from street to world |
| Basemap styles | Light, dark, terrain, minimal, satellite; custom style JSON later |
| Full boundary picker | Countries, states/provinces, counties, regions, scoped filters |
| Choropleth on MapLibre | Required from day one of MapLibre work—not a follow-up |
| Symbol layers on basemap | Points with size/color mapping |
| Flow / arrow layers | Origin → destination lines |
| Spike / extrusion layers | 3D bars from point or polygon data |
| Heatmap layer | Density visualization |
| Locator inset | Overview map showing context |
| Mini charts on markers | HTML markers with chart components |
| PNG export at viewport | Static snapshot of current view |
| Embeds | Published URL, iframe snippet, configurable interactivity |

Recommended stack: `maplibre-gl` + `react-map-gl/maplibre`, lazy-loaded to avoid impacting initial bundle size.

Tile sources: OpenFreeMap, Protomaps, MapTiler, or self-hosted—MapLibre-compatible style JSON. Attribution requirements must be surfaced in embeds and exports.

---

## Shared project config

These fields are render-target agnostic. Both renderers read them; each ignores what it cannot implement.

| Config area | Examples |
|---|---|
| Data | Raw CSV, parsed rows, column types, column formats |
| Map type | `symbol`, `choropleth` (extended types on MapLibre only) |
| Dimension mapping | `colorBy`, `sizeBy`, scales, palettes, label templates |
| Boundary intent | See `BoundaryConfig` below |
| Style presets | Named presets affecting data layers and (where applicable) basemap |
| Legend config | Position, formatting, visibility |

### Renderer-specific config

**SVG slice** (`svgConfig`):

```ts
interface SvgConfig {
  projection: ProjectionType;
  clipToCountry: boolean;
  customMapData: string;       // uploaded SVG
  canvasWidth: number;
  canvasHeight: number;
  labelOverrides: IndividualLabelOverride[];
  drawnPaths: DrawnPath[];
}
```

**MapLibre slice** (`maplibreConfig`):

```ts
interface MapLibreConfig {
  viewport: {
    center: [lng, lat];
    zoom: number;
    bearing?: number;
    pitch?: number;
  };
  basemapStyle: BasemapStyle;
  interactivity: {
    allowZoom: boolean;
    allowPan: boolean;
    showTooltips: boolean;
  };
}

interface BasemapStyle {
  id: string;
  name: string;
  url: string;           // style.json URL or inline spec
  attribution: string;
}
```

---

## Boundary config (shared choropleth glue)

Replace the flat `GeographyKey` enum as the *intent* layer. SVG maps `BoundaryConfig` to existing preset keys where possible; MapLibre resolves the full boundary catalog.

```ts
interface BoundaryConfig {
  level: 'world' | 'admin1' | 'admin2' | 'admin3' | 'custom';
  scope: {
    countries?: string[];    // ISO 3166-1 alpha-2: ['US'], ['CA'], ['US', 'CA']
    region?: string;         // e.g. 'US-CA' for California counties only
    bbox?: [west, south, east, north];
  };
  joinColumn: string;
  joinKey: 'name' | 'iso' | 'fips' | 'hasc' | 'geoid';
  source?: 'natural-earth' | 'geoboundaries' | 'census' | 'custom';
  customGeoJson?: string;    // URL or inline for custom boundaries
}
```

### Boundary picker UX

Hierarchical controls, not a flat dropdown:

```
Level:     [ Countries ▾ ]
Scope:     [ United States ▾ ]
Sub-level: [ States ▾ ]   →  or Counties, Provinces, etc.
Filter:    [ Optional: within California ▾ ]
```

Must support:

- World countries
- US states, US counties (nationally or within a state)
- Canadian provinces
- Other countries' admin levels via geoBoundaries (UK regions, French départements, etc.)
- Custom uploaded GeoJSON (evolution of custom SVG upload)

### Join pipeline (shared module)

```
BoundaryConfig + CSV
        ↓
normalizeGeoIdentifier (existing logic in geography.ts)
        ↓
join data to boundary features
        ↓
match report ("47/50 matched, 3 unmatched")
        ↓
    ┌───┴───┐
    ▼       ▼
 SVG     MapLibre
 join    GeoJSON source + fill layer
```

Match reports are surfaced in the UI regardless of render target.

### Renderer compatibility matrix

| Boundary intent | SVG renderer | MapLibre renderer |
|---|---|---|
| US states | ✅ `usa-states` | ✅ admin1 GeoJSON for US |
| World countries | ✅ `world` | ✅ Natural Earth countries |
| US counties (national) | ✅ `usa-counties` | ✅ Census / geoBoundaries admin2 |
| US counties in one state | ❌ Not in SVG presets | ✅ scope filter on admin2 |
| Canadian provinces | ✅ `canada-provinces` | ✅ admin1 GeoJSON for CA |
| Arbitrary admin levels globally | ❌ | ✅ via geoBoundaries |
| Custom boundaries | ✅ SVG upload (today) | ✅ GeoJSON upload |

When a boundary config is unsupported by the active render target, show an explicit message (e.g. "County-level maps in California require the MapLibre canvas") rather than failing silently.

### Boundary data service

Extend the existing `/api/topojson` pattern:

- New route: `/api/boundaries`
- Params: `{ level, scope, source }`
- Server-side caching via Vercel KV (same as geocode and topojson routes)
- CDN fallbacks for upstream boundary providers

Candidate sources:

| Source | Coverage | License notes |
|---|---|---|
| Natural Earth | Countries, admin1 | Public domain |
| geoBoundaries | Global admin0–3 | CC BY 4.0 (attribution required) |
| US Census TIGER | US counties, tracts, ZIP | Public domain |
| User upload | Custom | User responsibility |

---

## Workflow intent (not render-target modes)

Two common starting points describe *what the user is making*, not which renderer or output type they chose:

### Region map

Boundary-driven. "Color these regions by this variable."

- Boundary picker is the primary control
- Viewport frames the region set
- Works on both render targets when the boundary is in the SVG catalog
- MapLibre required for sub-state or global admin levels outside presets

### Place map

Location-driven. "Show these points or flows on a real basemap here."

- Viewport and basemap style are the primary controls
- MapLibre render target
- Boundaries optional (context layer or choropleth overlay)

Templates at project creation can set defaults for render target, boundary config, and viewport. Users override when compatible.

---

## Style presets

Presets are named configurations spanning both render targets where applicable:

```ts
interface StylePreset {
  id: string;
  name: string;              // e.g. "Dark editorial", "Light print"
  svg: {
    mapBackgroundColor: string;
    nationFillColor: string;
    // ... existing StylingSettings subset
  };
  maplibre: {
    basemapStyleId: string;
    dataLayerDefaults: {
      fillOpacity: number;
      strokeColor: string;
      labelFont: string;
    };
  };
}
```

A "dark editorial" preset sets a dark basemap on MapLibre and matching fill/label styling on SVG. Editorial quality comes from the preset, not from the render target.

---

## Export and publish

| Output | SVG renderer | MapLibre renderer |
|---|---|---|
| Copy SVG to clipboard | ✅ Primary | ❌ |
| Download SVG | ✅ | ❌ |
| Download PNG | ✅ Rasterized SVG | ✅ Viewport snapshot |
| Embed URL | ❌ | ✅ |
| iframe snippet | ❌ | ✅ |
| Interactivity toggle | N/A (static) | ✅ Configurable at publish |

Both render targets can produce static PNG. Only SVG produces Figma-ready vectors. Only MapLibre produces live embeds. Users choose based on output need, not on perceived quality.

Future: when shared config is compatible, a project may offer export from both render targets without switching the active preview.

---

## Programmatic project setup

Project state should be mutable through a formal tool/action layer—not only through UI panels. This enables:

- Project templates
- Batch or scripted map generation
- Natural-language intent ("US choropleth of unemployment, dark style") mapped to config mutations
- Validation and match reports returned as structured results

### Design requirements

- Each action mutates Zustand state through the same paths the UI uses
- Actions are reversible via the existing undo/redo history stack
- Actions declare render-target compatibility (e.g. `setViewport` applies to MapLibre; no-op or warning on SVG)
- Read-only queries expose project summary, column stats, and join match reports

### Example action set (illustrative)

| Action | Scope | Notes |
|---|---|---|
| `setBoundaryConfig` | Shared | Drives choropleth in both renderers |
| `setDimensionMapping` | Shared | colorBy, sizeBy, scales, labels |
| `applyStylePreset` | Shared | Preset knows both render targets |
| `setRenderTarget` | Project | `'svg'` \| `'maplibre'` |
| `setProjection` | SVG only | |
| `setViewport` | MapLibre only | center, zoom, bearing, pitch |
| `setBasemapStyle` | MapLibre only | |
| `setInteractivity` | MapLibre only | embed behavior |
| `validateDataJoin` | Shared (read) | Returns match report |
| `getProjectSummary` | Shared (read) | Schema + config snapshot |

Natural-language setup is a consumer of this layer, not a separate config system.

---

## Module structure (target)

```
modules/
├── data-ingest/          # existing — CSV, inference, formatting
├── boundaries/           # NEW — fetch, cache, join, match report
│   ├── types.ts
│   ├── fetch-boundaries.ts
│   ├── join-data.ts
│   └── compatibility.ts   # BoundaryConfig → GeographyKey mapping for SVG
├── map-render/
│   ├── adapters/
│   │   ├── to-geojson-symbols.ts
│   │   ├── to-geojson-choropleth.ts
│   │   └── to-geojson-flows.ts
│   ├── svg/              # existing modules/map-preview/* (migrate in place or alias)
│   └── maplibre/
│       ├── MapCanvas.tsx
│       ├── layers/
│       │   ├── ChoroplethLayer.tsx
│       │   ├── SymbolLayer.tsx
│       │   ├── FlowLayer.tsx
│       │   └── SpikeLayer.tsx
│       └── use-basemap-style.ts
└── project-actions/      # NEW — programmatic config mutations
    ├── actions.ts
    └── validation.ts

app/api/
├── boundaries/route.ts   # NEW
├── geocode/route.ts      # existing
└── topojson/route.ts     # existing (may delegate to boundaries over time)
```

---

## Phasing

### Phase 1 — Boundary infrastructure + MapLibre choropleth

**Goal:** MapLibre canvas with choropleth from day one. Shared boundary model.

- [ ] `BoundaryConfig` type and join pipeline module
- [ ] `/api/boundaries` route with KV caching
- [ ] Boundary picker UI (level + scope + filter)
- [ ] MapLibre canvas component (lazy-loaded)
- [ ] Choropleth layer on MapLibre via GeoJSON + data-driven fill
- [ ] Match report in UI
- [ ] Map `BoundaryConfig` → existing `GeographyKey` for SVG compatibility
- [ ] SVG renderer unchanged; benefits from shared join module where integrated

**Exit criteria:** Choropleth of US states and world countries renders on MapLibre with the same data used in SVG preview.

### Phase 2 — Render target toggle + style presets

**Goal:** Both pipelines coexist in one project with clear switching.

- [ ] `renderTarget` field on project state
- [ ] Render target switcher in map chrome
- [ ] Cross-renderer config carryover and compatibility warnings
- [ ] Unified style presets spanning SVG and MapLibre
- [ ] PNG export from MapLibre viewport

**Exit criteria:** User switches between SVG and MapLibre on a US states choropleth without losing data or dimension mapping.

### Phase 3 — MapLibre layer expansion

**Goal:** Place maps and richer visualization types.

- [ ] Symbol layers on basemap
- [ ] Flow / arrow layers (origin + destination columns)
- [ ] Heatmap layer
- [ ] Spike / fill-extrusion layer
- [ ] Viewport controls (fit to data, fit to boundaries)
- [ ] Basemap style picker

**Exit criteria:** Geocoded symbol map on a street-level basemap with zoom and dark style preset.

### Phase 4 — Programmatic setup

**Goal:** Configurable map creation without manual panel navigation.

- [ ] Project action layer wired to Zustand
- [ ] Template definitions using actions
- [ ] Natural-language intent UI (sidebar or command bar)
- [ ] Structured validation and match report in setup flow

**Exit criteria:** Paste CSV + intent string → fully configured choropleth with style, undoable as one operation.

### Phase 5 — Publish and embed

**Goal:** Live maps for publication.

- [ ] Publish flow (project → public URL)
- [ ] iframe embed snippet
- [ ] Interactivity configuration (zoom, tooltips, legend)
- [ ] Attribution handling for tile sources

**Exit criteria:** Published embed loads independently with configured interactivity.

### Phase 6 — Advanced (ongoing)

- [ ] Mini charts on markers (HTML markers + chart components)
- [ ] Locator inset map
- [ ] Custom GeoJSON upload (generalizes custom SVG)
- [ ] MapLibre style JSON import / editor
- [ ] Flow animation, temporal data slider
- [ ] Dual export from compatible projects

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Two render paths to maintain | Shared boundary join + config adapters; one match report module |
| MapLibre bundle size | Lazy-load; only fetch when `renderTarget === 'maplibre'` |
| Tile licensing / attribution | Document in embed UI; use providers with clear terms |
| Boundary data gaps or licensing | geoBoundaries + Census for US; attribute CC BY sources; cache aggressively |
| SVG ↔ MapLibre switch data loss | Preserve dormant renderer config; explicit compatibility matrix in UI |
| Choropleth at unfamiliar admin levels | Boundary picker + match report before render; don't guess joins |
| MapLibre ≠ Figma vectors | Keep SVG path for vector export; MapLibre for geographic context and embeds |

---

## Open questions

1. **Default render target for new projects** — SVG (preserve V1 habit) or MapLibre (V2 forward)?
2. **geoBoundaries vs Census** — single provider abstraction or mixed by region?
3. **Custom boundary unification** — merge SVG upload and GeoJSON upload into one "custom boundary" flow?
4. **Embed hosting** — static JSON config on Vercel Blob vs edge-rendered map pages?
5. **Style preset authorship** — user-saved only, or ship a curated DF Labs editorial set?
6. **Programmatic setup scope for Phase 4** — templates only first, or natural-language from the start?

---

## Relationship to other docs

| Document | Relationship |
|---|---|
| `PRD.md` | V1 product requirements; V2 extends scope—PRD should be updated when Phase 1 ships |
| `REVAMP_PLAN.md` | V1.x bug/UX/performance phases; orthogonal to V2 architecture |
| `IMPLEMENTATION_PLAN.md` | V1 interactive preview tools (inspect/select/move); remains valid for SVG renderer |
| `PROGRESS.md` | Modernization roadmap; add V2 phases when work begins |
| `TECH_STACK.md` | Add MapLibre, react-map-gl, boundary providers when integrated |

---

## Summary

V2 adds a MapLibre render target alongside the existing SVG pipeline. Both consume shared project config—data, dimension mapping, boundary intent, and style presets. Choropleth on MapLibre with a full boundary picker is foundational, not deferred. Editorial quality and interactivity are independent axes applied to either render target. Programmatic project setup (including natural-language intent) builds on a formal action layer over the same state the UI uses. The SVG pipeline remains a first-class, actively maintained path for Figma export, fixed layouts, and preset region maps.
