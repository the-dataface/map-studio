# Map Studio - Technology Stack

## Frontend Framework

- **Next.js 14.2.16** - React framework with App Router
- **React 18** - UI library
- **TypeScript 5** - Type safety

## Styling & UI

- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React** - Icon library
- **next-themes** - Theme management (light/dark mode)
- **CSS Variables** - Custom theming system with HSL color format

## Data Visualization & Mapping

- **D3.js (latest)** - Data visualization and geographic projections
- **TopoJSON Client (latest)** - Efficient geographic data format
- **Custom SVG Rendering** - For map output and custom map uploads

## Data Processing

- **CSV/TSV Parsing** - Client-side data parsing
- **OpenStreetMap Nominatim API** - Geocoding service (converts addresses to coordinates)
- **Browser localStorage** - Caching geocoded locations and user preferences

## Form Handling & Validation

- **React Hook Form 7.54.1** - Form state management
- **Zod 3.24.1** - Schema validation
- **@hookform/resolvers** - Form validation integration

## UI Component Libraries

- **shadcn/ui** - Component system built on Radix UI (accordions, buttons, cards, dialogs, etc.)
- **Class Variance Authority** - Component variant management
- **clsx & tailwind-merge** - Conditional className utilities

## Additional Libraries

- **Sonner** - Toast notifications
- **UUID** - Unique ID generation
- **Date-fns** - Date utilities
- **Recharts 2.15.0** - Chart components (potentially for future features)

## Build Tools

- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **ESLint** - Code linting (configured for Next.js)

## Deployment

- **Vercel** - Hosting platform (based on README)

## Architecture

- **Client-Side Only** - No backend API (all processing happens in browser)
- **Single Page Application** - Main workflow in `/app/page.tsx`
- **Component-Based** - Modular React components for each feature section
- **State Management** - React hooks (useState, useEffect, useCallback, useRef)

## Key Technical Features

1. **Real-time Map Rendering** - D3.js SVG rendering with live updates
2. **Geographic Projections** - Support for Albers USA, Mercator, Equal Earth, Albers
3. **Geocoding Caching** - Browser localStorage for performance optimization
4. **Custom SVG Map Support** - Parsing and validation of user-uploaded SVG maps
5. **Responsive Design** - Mobile-friendly with collapsible panels
6. **Dark Mode Support** - System-aware theme switching
