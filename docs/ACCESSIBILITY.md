# Accessibility Guide

This document outlines the accessibility features and testing setup for Map Studio.

## Overview

Map Studio follows WCAG 2.1 AA standards to ensure the application is accessible to all users, including those using assistive technologies.

## Features Implemented

### 1. **ARIA Labels and Descriptions**
- All interactive elements have appropriate `aria-label` attributes
- Form inputs are properly associated with labels using `htmlFor`
- Map SVGs include `aria-label` and `aria-describedby` for screen reader support
- Collapsible panels use `aria-expanded` and `aria-controls`

### 2. **Keyboard Navigation**
- All interactive elements are keyboard accessible
- Collapsible panels support Enter/Space key activation
- Focus management ensures logical tab order
- Skip links and focus indicators are provided

### 3. **Screen Reader Support**
- Map descriptions are automatically generated based on:
  - Map type (symbol, choropleth, custom)
  - Geography selection
  - Data dimensions (size, color mappings)
  - Data counts
- Loading states use `aria-live="polite"` for announcements

### 4. **Color Contrast**
- Color contrast validation utilities available in `lib/accessibility/color-contrast.ts`
- WCAG AA compliance checking (4.5:1 for normal text, 3:1 for large text)
- Color suggestion utility for accessible alternatives

## Development Tools

### Axe Runtime Checks

In development mode, Axe automatically runs accessibility checks and logs violations to the browser console. This helps catch issues during development.

**Location**: `app/(studio)/providers.tsx`

**How it works**:
- Automatically loads `@axe-core/react` in development only
- Runs checks after React renders (1000ms delay)
- Logs violations to console with remediation guidance

### ESLint Accessibility Rules

The project uses `eslint-plugin-jsx-a11y` to catch accessibility issues during development.

**Configuration**: `.eslintrc.json`

**Key rules**:
- `jsx-a11y/label-has-associated-control` - Ensures form labels are properly associated
- `jsx-a11y/click-events-have-key-events` - Requires keyboard support for click handlers
- `jsx-a11y/no-static-element-interactions` - Prevents static elements from being interactive

## Testing

### Running Accessibility Tests

```bash
# Run all E2E tests (including accessibility)
pnpm test:e2e

# Run only accessibility tests
pnpm test:a11y

# Run tests with UI (interactive mode)
pnpm test:e2e:ui
```

### Test Coverage

Accessibility tests (`tests/e2e/accessibility.spec.ts`) verify:

1. **WCAG Compliance**: Axe scans for violations on key pages
2. **Form Labels**: Ensures all form inputs have associated labels
3. **Keyboard Navigation**: Tests that collapsible panels work with keyboard
4. **Map Descriptions**: Verifies SVG maps have accessible descriptions

### CI Integration

Accessibility tests run automatically in CI on every push and pull request.

**Workflow**: `.github/workflows/ci.yml`

The accessibility job:
- Installs Playwright browsers
- Runs the accessibility test suite
- Fails the build if violations are detected

## Manual Testing

### Screen Reader Testing

Recommended screen readers for testing:
- **macOS**: VoiceOver (built-in)
- **Windows**: NVDA (free) or JAWS
- **Linux**: Orca

### Keyboard-Only Navigation

Test the application using only the keyboard:
1. Tab through all interactive elements
2. Use Enter/Space to activate buttons and panels
3. Ensure focus indicators are visible
4. Verify logical tab order

### Browser Extensions

For manual accessibility audits:
- **axe DevTools**: Browser extension for Chrome/Firefox/Edge
- **WAVE**: Web Accessibility Evaluation Tool
- **Lighthouse**: Built into Chrome DevTools (Accessibility audit)

## Map Accessibility

The map preview component is designed to be accessible:

- **SVG Role**: Maps use `role="img"` with descriptive `aria-label`
- **Descriptions**: Detailed descriptions are provided via `aria-describedby`
- **Exclusions**: Complex SVG maps are excluded from automated Axe scans (handled separately)

**Note**: Interactive map features (pan, zoom) are intentionally not implemented as the map is meant to be exploratory/visual only, not interactive.

## Color Contrast

The `lib/accessibility/color-contrast.ts` utility provides:

- `getContrastRatio()` - Calculate contrast ratio between two colors
- `meetsWCAGAA()` - Check if contrast meets WCAG AA standards
- `meetsWCAGAAA()` - Check if contrast meets WCAG AAA standards
- `getContrastStatus()` - Get detailed contrast status with messages
- `suggestAccessibleColor()` - Suggest accessible color alternatives

**Usage Example**:
```typescript
import { getContrastStatus } from '@/lib/accessibility/color-contrast'

const status = getContrastStatus('#000000', '#ffffff')
// Returns: { ratio: 21, meetsAA: true, meetsAAA: true, status: 'pass', message: '...' }
```

## Best Practices

1. **Always associate labels with inputs** using `htmlFor` and `id`
2. **Provide keyboard alternatives** for all mouse interactions
3. **Use semantic HTML** elements where possible
4. **Test with screen readers** during development
5. **Check color contrast** when choosing colors
6. **Provide text alternatives** for images and icons (`aria-label` or `sr-only` text)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Axe Core Documentation](https://github.com/dequelabs/axe-core)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

