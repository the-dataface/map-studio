# Map Studio Revamp Plan

Full overhaul addressing bugs, performance, UX, and visual design. Organized in phases so each phase is shippable.

---

## Phase 1 — Core Correctness (P0)

Fix bugs that block daily use.

### Geography & Matching
- [x] Value-aware geography inference (not just column names)
- [x] DC / District of Columbia / Washington D.C. alias matching
- [x] Add DC to `STATE_CODE_MAP`
- [x] Unified column typing (column names > cell values)
- [x] Widen region column dropdown to include province, county, text
- [ ] Choropleth match report ("47/50 matched, 3 unmatched")
- [ ] Re-infer geography when column types change in Data Preview

### Inputs
- [x] Numeric inputs commit on blur/Enter, not keystroke
- [x] Distinguish `null` (empty/unset) from `0` (explicit value)
- [x] Auto-populate respects user-entered zero

### Labels
- [x] `<b>` / `<strong>` tags in templates render bold (don't overwrite with global style)
- [x] Label drag uses stable coordinates; avoid full map teardown on position save
- [ ] Label drag: split render so overrides don't trigger base map rebuild

### Custom Maps
- [x] Relax SVG validation (country path optional, flat path lists OK)
- [x] Skip TopoJSON fetch when custom SVG is active
- [x] Preserve dimension mappings when updating choropleth data on custom map projects
- [ ] Combined CSV + SVG upload in one step

### Tests
- [x] Geography inference unit tests
- [x] DC normalization tests
- [ ] Choropleth matching integration tests

---

## Phase 2 — Render Pipeline & Performance

### Map Preview Architecture
- [x] Split path drawing preview into isolated effect (mouse moves no longer rebuild map)
- [ ] Split remaining layers (base map, data, labels, legends)
- [ ] Wire up Web Worker for projection + scale calculations
- [x] Remove production debug `console.log` calls (dimension-mapping, map-styling)

### Color Contrast
- [x] Check contrast against contextual backgrounds (state fill, scale colors — not just canvas bg)
- [x] Worst-case evaluation across multiple background candidates
- [ ] Batch check entire categorical palette

---

## Phase 3 — Visual Design Revamp

Map Studio should feel like a professional editorial tool (The DataFace), not a default shadcn scaffold.

### Design Direction
- **Tone**: Calm, precise, editorial. Confident typography, generous whitespace, muted chrome.
- **Reference**: Datawrapper's clarity + Figma's panel density + custom DF Labs identity.
- **Anti-goals**: Generic blue-primary SaaS, heavy gradients, over-rounded cards, debug-panel aesthetic.

### Design System
- [x] Custom color tokens (warm natural palette, terracotta accent)
- [x] Geist Sans + Geist Mono (already in root layout)
- [x] Studio grid layout with edge-to-edge dividers
- [x] Flat panels — no shadow, no rounded corners on sections
- [ ] Panel header typography pass (smaller uppercase titles across all panels)
- [ ] Map preview as hero — panels are secondary chrome

### Component Targets
- [ ] Header / project bar
- [ ] Data Input panel
- [ ] Data Preview table
- [ ] Dimension Mapping (biggest win — currently 2600 lines of nested panels)
- [ ] Map Styling
- [ ] Home page / project hub
- [ ] Floating toolbars

### Legends
- [ ] Replace boxed Arial legends with styled, minimal editorial legends
- [ ] Use map styling fonts/colors
- [ ] Horizontal gradient bar for linear scales
- [ ] Compact categorical swatches
- [ ] Optional legend placement (bottom, side)

---

## Phase 4 — Features & Polish

- [ ] Export/import settings JSON
- [ ] File upload (drag-and-drop CSV)
- [ ] Duplicate project (explicit UI — currently save-as-new-name only)
- [ ] Data validation warnings in UI toast + panel
- [ ] Improved label auto-positioning
- [ ] Delete dead code (`studio-app.tsx`, `dimensionSettings.custom`)
- [ ] Rename package from `my-v0-project`

---

## Architecture Notes

### State Model (target)
```
ProjectState
├── data: { symbol, choropleth, customSvg }
├── schema: { columnTypes, columnFormats }
├── geography: { key, projection, clipToCountry, inferredConfidence }
├── dimensions: { symbol, choropleth }  // drop unused .custom
├── styling: StylingSettings
└── ui: { expandedPanels, activeTool, ... }  // separate from project data
```

### Render Pipeline (target)
```
MapPreview
├── BaseMapLayer      (topo or custom SVG) — rarely changes
├── ChoroplethLayer   (fills)              — changes on data/dimension
├── SymbolLayer       (markers)            — changes on data/dimension
├── LabelLayer        (text)               — changes on template/style/overrides
├── LegendLayer       (legends)            — changes on dimension/style
├── PathLayer         (user annotations)   — changes on drawing
└── OverlayLayer      (tooltips, preview)  — changes frequently, isolated
```

---

## Verification Checklist

After each phase, verify:

1. Load `choropleth-us.csv` → infers US states (not world)
2. Set scale min to `0` → stays at 0
3. Type in scale max → map doesn't update until blur
4. Template `<b>{population}</b>` → bold on map
5. Drag label in move tool → smooth, position persists
6. DC row in data → fills on Albers USA map
7. Custom SVG project → update choropleth CSV → colors update
8. Color contrast checks against state fill, not just white bg
