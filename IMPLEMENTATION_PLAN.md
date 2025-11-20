# Implementation Plan: Interactive Map Preview Features

## Overview
This plan outlines the implementation of interactive features for the map preview using a tool-based interaction model:
1. **Map Control Bar**: A vertical toolbar pinned to the right side of the map preview
2. **Inspect Tool**: Hover over data points/labels to see mapped dimension data
3. **Select Tool**: Click labels to edit individual label styling
4. **Move Tool**: Click and drag labels to reposition them

All changes will be persisted with the project file.

---

## Feature 1: Map Control Bar

### Requirements
- Vertical toolbar pinned to the right side of the map preview pane
- Positioned in the vertical middle
- Overlaps the right edge by 50% of its width
- Styled similarly but distinctly from the main floating toolbar
- Contains tool icons with tooltips
- Supports keyboard shortcuts (I, V, M)

### Implementation Steps

#### 1.1 Create Map Control Bar Component
**File**: `components/map-control-bar.tsx` (new file)
- Vertical layout (flex-col)
- Positioned absolutely relative to map preview container
- Right edge positioning: `right: -50%` (overlaps by 50% width)
- Vertical centering: `top: 50%` with `transform: translateY(-50%)`
- Styling:
  - Similar rounded corners but different shape (rounded-l-lg instead of rounded-full)
  - Similar shadow (`shadow-xl`) and border (`border border-border`)
  - Different background: `bg-background/95 backdrop-blur` (slightly different opacity)
  - Vertical spacing between buttons (`gap-1` or `gap-2`)
  - Padding: `p-1` or `p-1.5`
  - Width: approximately `w-10` or `w-12` (40-48px)
- Contains three tool buttons:
  - Inspect tool (Search icon from lucide-react)
  - Select tool (MousePointer or CursorClick icon)
  - Move tool (MoveHorizontal icon)
- Each button:
  - Size: `h-9 w-9` (same as main toolbar buttons)
  - Variant: `ghost`
  - Shows tooltip on hover (using TooltipProvider)
  - Active state: `bg-secondary` or `bg-primary/10` with `text-primary`
- Icons from `lucide-react`: `Search`, `MousePointer`, `MoveHorizontal`

#### 1.2 Add Tool State Management
**File**: `components/map-preview.tsx`
- Add state for active tool: `'inspect' | 'select' | 'move'`
- Default to `'inspect'`
- Pass tool state and setter to map rendering functions
- Handle keyboard shortcuts (I, V, M) when map preview is focused

#### 1.3 Integrate Map Control Bar
**File**: `components/map-preview.tsx`
- Render `MapControlBar` inside the map container
- Position relative to `mapContainerRef`
- Pass active tool and tool change handler
- Ensure z-index is above map SVG but below modals

---

## Feature 2: Inspect Tool (Default)

### Requirements
- When Inspect tool is active, hovering over symbols shows tooltip with mapped dimension columns
- When Inspect tool is active, hovering over choropleth regions shows tooltip with mapped dimension columns
- When Inspect tool is active, hovering over labels shows tooltip with mapped dimension columns
- Tooltip displays formatted values using existing column formats
- Only active when Inspect tool is selected

### Implementation Steps

#### 2.1 Create Tooltip Component for Map Elements
**File**: `modules/map-preview/tooltip.ts` (new file)
- Create a React portal-based tooltip system (HTML tooltip positioned absolutely)
- Position tooltip near cursor/mouse position
- Style tooltip to match application theme (dark/light mode)
- Show/hide tooltip on mouseenter/mouseleave events
- Accept tooltip content as React node for flexible formatting

#### 2.2 Extract Mapped Dimension Columns Helper
**File**: `modules/map-preview/tooltip.ts` (new file)
- Create function `getMappedDimensionColumns()`:
  - For symbols: Extract columns from `dimensionSettings.symbol` (latitude, longitude, sizeBy, colorBy, labelTemplate)
  - For choropleth: Extract columns from `dimensionSettings.choropleth` (stateColumn, colorBy, labelTemplate)
  - Return array of column names that are mapped to dimensions
- Create function `formatTooltipData()`:
  - Takes data record and mapped columns
  - Formats values using `columnFormats` and `columnTypes`
  - Returns formatted key-value pairs

#### 2.3 Add Hover Events to Symbols (Inspect Tool Only)
**File**: `modules/map-preview/symbols.ts`
- Modify `renderSymbols` to accept `activeTool` parameter
- Only add hover events when `activeTool === 'inspect'`
- On `mouseenter`: 
  - Get data record for the symbol
  - Extract mapped dimension columns
  - Format and display tooltip via callback
- On `mouseleave`: Hide tooltip via callback
- Change cursor to `help` or `crosshair` when inspect tool is active

#### 2.4 Add Hover Events to Choropleth Regions (Inspect Tool Only)
**File**: `modules/map-preview/base-map.ts` and `modules/map-preview/choropleth.ts`
- Modify choropleth rendering to accept `activeTool` parameter
- Only add hover events when `activeTool === 'inspect'`
- On `mouseenter`:
  - Identify the feature from the path element
  - Match feature to data record using existing `geoDataMap` logic
  - Extract mapped dimension columns
  - Format and display tooltip
- On `mouseleave`: Hide tooltip
- Change cursor appropriately

#### 2.5 Add Hover Events to Labels (Inspect Tool Only)
**File**: `modules/map-preview/labels.ts`
- Modify label rendering to accept `activeTool` parameter
- Only add hover events when `activeTool === 'inspect'`
- On `mouseenter`:
  - Get data record associated with the label
  - Extract mapped dimension columns
  - Format and display tooltip
- On `mouseleave`: Hide tooltip
- Change cursor appropriately

#### 2.6 Handle Custom Maps
**File**: `modules/map-preview/base-map.ts`
- Ensure custom SVG maps also get hover events when inspect tool is active
- Use existing `extractCandidateFromSVGId` and `normalizeGeoIdentifier` functions

---

## Feature 3: Select Tool

### Requirements
- When Select tool is active, clicking a label opens the label editor toolbar
- Only works when Select tool is selected
- Clicking outside the label or switching tools closes the editor

### Implementation Steps

#### 3.1 Extend Type Definitions
**File**: `app/(studio)/types.ts`
- Add `IndividualLabelOverrides` interface:
  ```typescript
  interface IndividualLabelOverride {
    id: string // Unique identifier for the label (e.g., "symbol-0", "choropleth-CA")
    fontFamily?: string
    fontStyle?: 'normal' | 'italic'
    fontWeight?: 'normal' | 'bold'
    fontSize?: number
    textAnchor?: 'start' | 'middle' | 'end'
    dominantBaseline?: 'baseline' | 'middle' | 'hanging'
    fill?: string
    stroke?: string
    strokeWidth?: number
    x?: number // For drag position
    y?: number // For drag position
  }
  ```
- Add `individualLabelOverrides: Record<string, IndividualLabelOverride>` to `StylingSettings`

#### 3.2 Create Label Editor Toolbar Component
**File**: `components/label-editor-toolbar.tsx` (new file)
- Floating toolbar that appears when a label is clicked
- Position near the clicked label
- Include controls for all styling properties
- Include "Reset to Defaults" button
- Include close button
- Use existing UI components (Select, Input, ColorPicker, etc.)

#### 3.3 Make Labels Clickable (Select Tool Only)
**File**: `modules/map-preview/labels.ts`
- Modify label rendering to accept `activeTool` parameter
- Only enable click events when `activeTool === 'select'`
- Change `pointer-events: 'none'` to `pointer-events: 'all'` when select tool is active
- Add unique `data-label-id` attribute to each label:
  - Symbol labels: `symbol-{index}` where index is the data record index
  - Choropleth labels: `choropleth-{featureIdentifier}` 
- Add click event handler that:
  - Prevents default behavior
  - Stops propagation
  - Only works when `activeTool === 'select'`
  - Calls callback with label ID, data record, and current position
  - Opens label editor toolbar
- Change cursor to `pointer` when select tool is active

#### 3.4 Apply Individual Overrides When Rendering Labels
**File**: `modules/map-preview/labels.ts`
- Modify `renderSymbolLabels` and `renderChoroplethLabels`:
  - Check for override in `stylingSettings.individualLabelOverrides[labelId]`
  - Apply override properties, falling back to default styling settings
  - Apply position overrides (x, y) if present

#### 3.5 Update Styling Settings When Label is Edited
**File**: `components/label-editor-toolbar.tsx`
- On any property change:
  - Update `stylingSettings.individualLabelOverrides[labelId]`
  - Call `onUpdateStylingSettings` callback
  - Trigger map re-render
- On "Reset to Defaults":
  - Remove entry from `individualLabelOverrides`
  - Call `onUpdateStylingSettings`
- On close:
  - Hide toolbar

#### 3.6 Integrate Label Editor with Map Preview
**File**: `components/map-preview.tsx`
- Add state for selected label ID
- Pass `onLabelClick` handler to label rendering functions
- Render `LabelEditorToolbar` when a label is selected
- Pass `stylingSettings` and `onUpdateStylingSettings` to toolbar

---

## Feature 4: Move Tool

### Requirements
- When Move tool is active, clicking and dragging a label moves it
- Only works when Move tool is selected
- Position is saved with the label override
- Visual feedback during drag (cursor change, maybe slight opacity change)

### Implementation Steps

#### 4.1 Add Drag Functionality to Labels (Move Tool Only)
**File**: `modules/map-preview/labels.ts`
- Modify label rendering to accept `activeTool` parameter
- Only enable drag when `activeTool === 'move'`
- Use D3 drag behavior (`d3.drag()`) on label text elements
- On drag start:
  - Set cursor to 'grabbing'
  - Optionally reduce opacity slightly
  - Only if move tool is active
- On drag:
  - Update label's x and y attributes based on drag position
  - Store position in `stylingSettings.individualLabelOverrides[labelId].x` and `.y`
- On drag end:
  - Reset cursor
  - Reset opacity
  - Save position to styling settings via callback
  - Trigger history push for undo/redo
- Change cursor to `move` or `grab` when move tool is active

#### 4.2 Apply Position Overrides
**File**: `modules/map-preview/labels.ts`
- When rendering labels, check for `x` and `y` in override
- If present, use override position instead of calculated position
- For symbol labels: override `projected[0] + position.dx` and `projected[1] + position.dy`
- For choropleth labels: override `centroid[0]` and `centroid[1]`

#### 4.3 Update Label Editor to Show Position
**File**: `components/label-editor-toolbar.tsx`
- Display current x, y coordinates (read-only or editable)
- Optionally add "Reset Position" button to clear x/y overrides

---

## Data Persistence

### Update Save/Load Functions
**File**: `lib/projects.ts`
- `SavedProject` type already includes `stylingSettings`
- `individualLabelOverrides` will be automatically saved/loaded as part of `stylingSettings`
- No changes needed to save/load logic

### Update History System
**File**: `state/studio-store.ts`
- Ensure `stylingSettings` changes trigger history push
- Label drag operations should push history on drag end
- Label editor changes should use debounced history push (already implemented)

---

## File Structure Summary

### New Files
1. `components/map-control-bar.tsx` - Vertical toolbar with tool selection
2. `modules/map-preview/tooltip.ts` - Tooltip rendering logic and helpers
3. `components/label-editor-toolbar.tsx` - Label styling editor component

### Modified Files
1. `app/(studio)/types.ts` - Add `IndividualLabelOverride` interface and `MapTool` type
2. `components/map-preview.tsx` - Add tool state, integrate control bar, handle keyboard shortcuts
3. `modules/map-preview/symbols.ts` - Add conditional hover events based on active tool
4. `modules/map-preview/choropleth.ts` - Add conditional hover events based on active tool
5. `modules/map-preview/base-map.ts` - Add conditional hover events to choropleth paths
6. `modules/map-preview/labels.ts` - Add conditional click/drag based on active tool, apply overrides

---

## Implementation Order

1. **Phase 1: Map Control Bar** (Feature 1)
   - Create MapControlBar component
   - Add tool state management
   - Integrate with map preview
   - Add keyboard shortcuts (I, V, M)
   - Style and position correctly

2. **Phase 2: Inspect Tool** (Feature 2)
   - Create tooltip system
   - Create helper functions for extracting mapped columns
   - Add conditional hover to symbols (inspect tool only)
   - Add conditional hover to choropleth regions (inspect tool only)
   - Add conditional hover to labels (inspect tool only)
   - Test with various data configurations

3. **Phase 3: Select Tool** (Feature 3)
   - Extend types for label overrides
   - Create label editor toolbar
   - Make labels conditionally clickable (select tool only)
   - Apply overrides when rendering
   - Test persistence

4. **Phase 4: Move Tool** (Feature 4)
   - Add conditional drag behavior (move tool only)
   - Apply position overrides
   - Integrate with label editor
   - Test drag and persistence

---

## Technical Considerations

### SVG Tooltips
- SVG elements can't use HTML tooltips directly
- Options:
  1. Use foreignObject to embed HTML tooltip
  2. Use SVG elements (rect, text) styled as tooltip
  3. Use portal to render HTML tooltip outside SVG, positioned absolutely
- **Recommendation**: Use portal approach for better styling and accessibility

### Label Identification
- Symbol labels: Use data index (`symbol-{index}`)
- Choropleth labels: Use normalized geographic identifier (`choropleth-{featureId}`)
- Store mapping in data attributes for easy lookup

### Tool State Management
- Tool state lives in `MapPreview` component
- Passed down to rendering functions
- Keyboard shortcuts only active when map preview is focused/expanded
- Tool state doesn't need to persist (always starts with 'inspect')

### Performance
- Tooltip rendering should be lightweight
- Label editor should only render when label is selected
- Debounce styling updates (already implemented)
- Consider virtualizing if many labels exist

### Accessibility
- Add keyboard navigation for label selection
- Add ARIA labels for interactive elements
- Ensure tooltips are accessible to screen readers

---

## Testing Checklist

### Map Control Bar
- [ ] Control bar appears on right side of map preview
- [ ] Control bar overlaps right edge by 50% width
- [ ] Control bar is vertically centered
- [ ] Control bar styling is distinct from main floating toolbar
- [ ] Tool buttons show tooltips
- [ ] Active tool is visually highlighted
- [ ] Keyboard shortcuts work (I, V, M)
- [ ] Keyboard shortcuts only work when map is focused

### Inspect Tool
- [ ] Inspect tool is default/active on load
- [ ] Tooltips appear on symbol hover (inspect tool only)
- [ ] Tooltips appear on choropleth region hover (inspect tool only)
- [ ] Tooltips appear on label hover (inspect tool only)
- [ ] Tooltip content shows mapped dimension columns only
- [ ] Tooltip content is formatted correctly
- [ ] Tooltips work with custom maps
- [ ] Cursor changes appropriately in inspect mode

### Select Tool
- [ ] Select tool activates on click/keyboard shortcut
- [ ] Labels are clickable only when select tool is active
- [ ] Label editor toolbar appears on label click
- [ ] Label editor controls work correctly
- [ ] Individual overrides apply correctly
- [ ] Reset to defaults works
- [ ] Cursor changes appropriately in select mode

### Move Tool
- [ ] Move tool activates on click/keyboard shortcut
- [ ] Labels can be dragged only when move tool is active
- [ ] Visual feedback during drag (cursor, opacity)
- [ ] Dragged positions persist
- [ ] Cursor changes appropriately in move mode

### Persistence & Integration
- [ ] All label changes save with project
- [ ] All label changes load correctly from project
- [ ] Undo/redo works with label changes
- [ ] Works in both light and dark themes
- [ ] Works with all map types (symbol, choropleth, custom)
- [ ] Tool state resets to 'inspect' on map reload (expected behavior)

