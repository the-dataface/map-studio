# Map Studio - Product Requirements Document (PRD)

## Problem Statement

**What user pain are we solving?**

Map Studio streamlines the end-to-end workflow for data journalists and data visualization designers who need to turn raw geographic datasets into publication-ready maps. Today, they bounce between coding notebooks (Observable, R, Python) or paid tools like Datawrapper and Flourish to clean data, geocode locations, experiment with visuals, export SVGs, and then refine layouts inside Figma. That fragmented process is slow, expensive, and often requires developer support. Map Studio consolidates those steps into a single environment with built-in geocoding, deep styling controls, and SVG-first exports so designers can produce polished, on-brand maps once or twice a week without leaving the browser.

Validated pain points:

- High-friction handoff between multiple tools just to reach a Figma-friendly SVG
- Limited styling/theming controls in existing mapping products
- Lack of integrated geolocation services for datasets without lat/long values
- Need to eliminate developer involvement for routine newsroom mapping tasks

---

## Goals & Success Criteria

**How do we know this works?**

This release succeeds when it meaningfully reduces the effort required for DF Labs' design team—and comparable practitioners—to create custom maps. There are no hard commercial KPIs yet; the primary business objective is to showcase innovative tooling under the DF Labs brand. We will consider the experiment successful if designers can rely on Map Studio for their weekly mapping needs without pulling developers into the process.

### Potential Success Metrics:

- **Usage Metrics:**

  - Number of maps created per user
  - Average time to create a map (from data upload to export)
  - Return user rate
  - Maps exported/downloaded

- **Quality Metrics:**

  - Geocoding success rate
  - User error rate (failed data imports)
  - Support requests/issues

- **Engagement Metrics:**
  - Feature adoption rates (symbol maps vs. choropleth vs. custom)
  - Style presets saved/used
  - Average number of styling adjustments per map

Working targets (qualitative for now):

- Map Studio becomes the team's default solution for newsroom-quality maps within three months
- Designers produce maps without developer involvement in at least 80% of weekly use cases
- Positive qualitative feedback that the tool feels faster and more flexible than previous workflows

---

## Core Features and Functionality

### Must-Haves (Currently Implemented)

1. **Data Input & Processing**

   - ✅ CSV/TSV data upload via paste
   - ✅ Automatic column type detection
   - ✅ Data preview with editing capabilities
   - ✅ Column type assignment (text, number, date, coordinate, state, country)
   - ✅ Data export (TSV/CSV download)

2. **Geocoding**

   - ✅ Address to coordinates conversion (OpenStreetMap Nominatim)
   - ✅ Support for city/state or full address
   - ✅ Browser-based caching for performance
   - ✅ Batch geocoding with progress tracking

3. **Map Types**

   - ✅ Symbol maps (point markers with coordinates)
   - ✅ Choropleth maps (filled regions by data value)
   - ✅ Custom SVG maps (user-uploaded geographic boundaries)

4. **Geography & Projections**

   - ✅ US states, US counties, US nation
   - ✅ Canada provinces, Canada nation
   - ✅ World map
   - ✅ Multiple projections (Albers USA, Mercator, Equal Earth, Albers)
   - ✅ Country clipping option

5. **Dimension Mapping**

   - ✅ Color mapping (numerical and categorical)
   - ✅ Size mapping (numerical)
   - ✅ Fill mapping for choropleth (numerical and categorical)
   - ✅ Label templates with dynamic data insertion
   - ✅ Multiple color scales (linear, diverging, categorical)
   - ✅ Custom color palette creation

6. **Visual Styling**

   - ✅ Base map styling (background, borders, fills)
   - ✅ Symbol styling (shape, size, color, stroke)
   - ✅ Label styling (font, size, color, outline, alignment)
   - ✅ Style presets (light/dark themes)
   - ✅ Custom style saving to localStorage
   - ✅ Multiple font family options

7. **Map Preview & Export**

   - ✅ Real-time map preview
   - ✅ SVG export
   - ✅ Copy to clipboard (Figma-ready)
   - ✅ Responsive map sizing

8. **User Experience**
   - ✅ Collapsible panels for workflow management
   - ✅ Dark mode support
   - ✅ Floating action buttons (scroll to map, collapse all)
   - ✅ Toast notifications for user feedback
   - ✅ Sample data sets for testing

### Nice-to-Haves (Planned/Roadmap)

1. **Settings Import/Export**

   - ⏳ Export complete project (data + settings) as JSON
   - ⏳ Import saved projects

2. **Data Upload**

   - ⏳ File upload interface (beyond paste)
   - ⏳ Drag-and-drop support

3. **Enhanced Labeling**

   - ⏳ Improved auto-positioning for symbol labels
   - ⏳ Connected labels for choropleth layers

4. **Data Validation**

   - ⏳ Choropleth data verification checks
   - ⏳ Better error handling and warnings

5. **Additional Features**
   - ⏳ More geography options (other countries)
   - ⏳ Additional projection options
   - ⏳ Animation/transition support

**Questions to clarify:**

1. Are there any features that users frequently request that aren't on the roadmap?
2. What features are most critical for user retention?
3. Are there any features that should be removed or deprecated?
4. What's the priority order for roadmap items?

---

## User Experience

**What steps does a user take? What pages/screens are needed?**

### Current User Flow

1. **Landing/Data Input**

   - User arrives at single-page application
   - Expands "Data Input" panel
   - Pastes CSV/TSV data or selects sample data
   - App automatically detects map type and geography

2. **Geocoding (Symbol Maps Only)**

   - If data lacks coordinates, "Geocoding" panel appears
   - User selects address/city/state columns
   - Runs geocoding process
   - Progress tracked with cached results highlighted

3. **Geography & Projection Selection**

   - "Map Projection Selection" panel appears
   - User can adjust geography (if auto-detected incorrectly)
   - User selects projection type
   - Option to clip to country boundaries

4. **Data Preview**

   - User reviews parsed data in table format
   - Can adjust column types and formats
   - Can copy or download data
   - Can switch between symbol/choropleth/custom map types

5. **Dimension Mapping**

   - User maps data columns to visual properties:
     - Symbol maps: latitude, longitude, size, color, labels
     - Choropleth maps: region column, fill color, labels
   - Configures color scales and palettes
   - Sets up label templates

6. **Map Styling**

   - User customizes base map appearance
   - Adjusts symbol/marker styling
   - Configures label fonts and styling
   - Can save custom styles for reuse

7. **Map Preview**

   - User views real-time map updates
   - Can scroll to map using floating button
   - Can collapse other panels for full-screen view

8. **Export**
   - User copies SVG to clipboard or downloads
   - SVG is ready for use in Figma or other design tools

### Current Screen Structure

**Single Page Application** with collapsible sections:

- Header (navigation, theme toggle)
- Data Input (collapsible)
- Map Projection Selection (collapsible, conditional)
- Geocoding Section (collapsible, conditional)
- Data Preview (collapsible, conditional)
- Dimension Mapping (collapsible, conditional)
- Map Styling (collapsible, conditional)
- Map Preview (collapsible, conditional)
- Floating Action Buttons (conditional)

**Questions to clarify:**

1. Is the single-page workflow optimal, or would users benefit from a multi-step wizard?
2. Are there pain points in the current workflow that cause drop-offs?
3. Should there be a "getting started" tutorial or onboarding flow?
4. Is there a need for a "saved projects" or "history" view?
5. Should there be user accounts or authentication?

---

## Visual Design Style

**What should the look and feel be? (Adjectives, examples, inspiration)**

Professional and delightful. The interface should feel minimalist, trustworthy, and visually refined so that the maps themselves remain the hero. Interactions should be polished and satisfying, but never ornamental to the point of distraction. Think modern editorial tooling that skilled designers trust for production work.

### Current Design Characteristics:

- **Clean & Minimal** - White/dark backgrounds with subtle borders
- **Professional** - Suitable for publication-quality outputs
- **Modern** - Uses contemporary UI patterns (Radix UI, Tailwind)
- **Accessible** - High contrast, keyboard navigation support
- **Data-Focused** - Map visualization is the hero element

### Design System:

- **Color Scheme**: HSL-based with dark mode support
- **Typography**: Multiple Google Fonts available (Inter, Roboto, Open Sans, etc.)
- **Components**: shadcn/ui component library
- **Spacing**: Tailwind's spacing scale
- **Icons**: Lucide React (consistent line-style icons)

Additional guidance:

- Showcase the DF Labs experimental spirit through microinteractions and delightful feedback
- Maintain a neutral color base that lets user-selected map palettes pop
- Ensure typography and spacing feel editorial-grade to match a design-savvy audience

---

## Open Questions

**Unknowns to resolve later**

### Technical Questions:

1. **Performance at Scale**

   - How does the app perform with very large datasets (10,000+ rows)?
   - Should we implement data pagination or virtualization?
   - Are there browser memory limits we need to consider?

2. **Geocoding Limitations**

   - What are the rate limits for Nominatim API?
   - Should we implement a backend proxy to avoid CORS issues?
   - Do we need paid geocoding services for production?

3. **Browser Compatibility**

   - What browsers/devices must we support?
   - Are there localStorage size limitations?
   - SVG rendering performance on mobile devices?

4. **Data Privacy**
   - Should user data be stored server-side?
   - GDPR/privacy compliance requirements?
   - Terms of service for data handling?

### Product Questions:

1. **Monetization**

   - Current state: free under DF Labs
   - Future direction: explore a freemium tier with advanced features behind a paywall
   - Open: identify which capabilities become premium and what usage limits, if any, apply to the free tier

2. **Collaboration**

   - Current state: users can share projects by exporting/importing settings files
   - Open: scope real-time or asynchronous collaborative editing features
   - Open: evaluate embeddable/shared map experiences beyond file exchange

3. **Integration**

   - Required today: OpenStreetMap Nominatim for geocoding
   - Open: determine if additional data sources or APIs (Google Sheets, Airtable, etc.) would unlock key workflows
   - Open: assess demand for additional export formats (PNG, PDF)

4. **Content & Discovery**

   - Gallery of user-created maps?
   - Template library?
   - Community features?

5. **Support & Documentation**

   - Plan: maintain in-depth docs within GitHub and host a how-to/help page on the live site
   - Open: decide on supplemental formats (video tutorials, guided tours) and support channels

6. **Analytics & Tracking**
   - What user behavior should we track?
   - Error logging and monitoring?
   - Performance metrics?

---

## Next Steps

1. **Team Validation** - Run working sessions with DF Labs designers to confirm the weekly workflow is covered end-to-end
2. **Freemium Strategy** - Define which advanced capabilities qualify for a future premium tier and any free-tier limits
3. **Collaboration Discovery** - Explore requirements for real-time/shared workflows beyond settings export/import
4. **Documentation Plan** - Outline the GitHub documentation structure and the on-site how-to guide
5. **Competitive Analysis** - Review Observable, Datawrapper, Flourish, etc. for differentiation opportunities
6. **Technical Planning** - Address scale, geocoding limits, and other open technical questions
7. **Measurement Plan** - Decide which qualitative/usage signals to track for the DF Labs success narrative

---

## Document Status

- ✅ Tech Stack: Documented
- ✅ Core Features: Listed (current state)
- ✅ Problem Statement: Drafted with DF Labs inputs (validate with wider user base)
- ✅ Goals & Success Criteria: Qualitative targets defined
- ⏳ User Experience: Needs user testing feedback
- ✅ Visual Design Style: Direction set (professional, delightful, minimalist)
- ⏳ Open Questions: Needs stakeholder input

**Last Updated**: [Current Date]
**Owner**: [Product Owner]
**Stakeholders**: [List stakeholders]
