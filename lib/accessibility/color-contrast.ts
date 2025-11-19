/**
 * Color contrast validation utilities for WCAG AA compliance
 * WCAG AA requires:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
 * - UI components: 3:1 contrast ratio
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((x) => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    })
    .join('')}`
}

/**
 * Calculate relative luminance according to WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    return 1 // Invalid colors, return minimum contrast
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Get contrast ratio status with human-readable message
 */
export function getContrastStatus(
  foreground: string,
  background: string,
  isLargeText = false
): {
  ratio: number
  meetsAA: boolean
  meetsAAA: boolean
  status: 'pass' | 'fail' | 'warning'
  message: string
} {
  const ratio = getContrastRatio(foreground, background)
  const meetsAA = meetsWCAGAA(foreground, background, isLargeText)
  const meetsAAA = meetsWCAGAAA(foreground, background, isLargeText)

  let status: 'pass' | 'fail' | 'warning' = 'pass'
  let message = ''

  if (meetsAAA) {
    status = 'pass'
    message = `Excellent contrast (${ratio.toFixed(2)}:1) - Meets WCAG AAA`
  } else if (meetsAA) {
    status = 'pass'
    message = `Good contrast (${ratio.toFixed(2)}:1) - Meets WCAG AA`
  } else {
    status = 'fail'
    const required = isLargeText ? '3:1' : '4.5:1'
    message = `Low contrast (${ratio.toFixed(2)}:1) - Requires ${required} for WCAG AA`
  }

  return {
    ratio,
    meetsAA,
    meetsAAA,
    status,
    message,
  }
}

/**
 * Check contrast and return detailed result
 * Compatible with the existing API used in components
 */
export function checkContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'small' | 'large' = 'small'
): { meets: boolean; ratio: number; required: number; message: string } {
  const ratio = getContrastRatio(foreground, background)
  
  let requiredRatio = 4.5 // WCAG AA for small text
  if (level === 'AAA') {
    requiredRatio = 7 // WCAG AAA for small text
  }
  if (size === 'large') {
    requiredRatio = level === 'AA' ? 3 : 4.5 // WCAG AA/AAA for large text
  }

  const meets = ratio >= requiredRatio
  const message = meets
    ? `Contrast ratio of ${ratio.toFixed(2)} meets WCAG ${level} for ${size} text (required: ${requiredRatio.toFixed(2)}).`
    : `Contrast ratio of ${ratio.toFixed(2)} does not meet WCAG ${level} for ${size} text (required: ${requiredRatio.toFixed(2)}).`

  return {
    meets,
    ratio,
    required: requiredRatio,
    message,
  }
}

/**
 * Generate multiple accessible color suggestions
 * Returns an array of colors that meet contrast requirements
 */
export function suggestAccessibleColors(
  foreground: string,
  background: string,
  count: number = 5
): string[] {
  const rgb = hexToRgb(foreground)
  if (!rgb) return []

  const bgRgb = hexToRgb(background)
  if (!bgRgb) return []

  // Determine if we need to lighten or darken
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
  const needsLightening = bgLum < 0.5

  const suggestions: string[] = []
  
  // Generate variations with different adjustment factors
  const factors = needsLightening 
    ? [1.2, 1.3, 1.4, 1.5, 1.6] // Lightening factors
    : [0.8, 0.7, 0.6, 0.5, 0.4] // Darkening factors

  for (let i = 0; i < Math.min(count, factors.length); i++) {
    const factor = factors[i]
    const adjusted = {
      r: Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
      g: Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
      b: Math.min(255, Math.max(0, Math.round(rgb.b * factor))),
    }
    
    const suggestedColor = rgbToHex(adjusted.r, adjusted.g, adjusted.b)
    
    // Verify it meets contrast requirements
    if (getContrastRatio(suggestedColor, background) >= 4.5) {
      suggestions.push(suggestedColor)
    }
  }

  // If we don't have enough suggestions, try alternative approaches
  if (suggestions.length < count) {
    // Try adjusting saturation/hue slightly
    for (let attempt = 0; attempt < 10 && suggestions.length < count; attempt++) {
      const hueShift = (attempt % 3) * 10 - 10
      const satAdjust = 1 + (attempt % 2) * 0.1
      
      // Convert RGB to HSL, adjust, convert back
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      const adjustedHsl = {
        h: (hsl.h + hueShift) % 360,
        s: Math.min(100, Math.max(0, hsl.s * satAdjust)),
        l: needsLightening ? Math.min(100, hsl.l + 20) : Math.max(0, hsl.l - 20),
      }
      
      const adjustedRgb = hslToRgb(adjustedHsl.h, adjustedHsl.s, adjustedHsl.l)
      const suggestedColor = rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b)
      
      if (getContrastRatio(suggestedColor, background) >= 4.5 && !suggestions.includes(suggestedColor)) {
        suggestions.push(suggestedColor)
      }
    }
  }

  return suggestions.slice(0, count)
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Suggest a color that meets contrast requirements
 * Returns a lighter or darker version of the foreground color
 * @deprecated Use suggestAccessibleColors for multiple suggestions
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string
): string {
  const suggestions = suggestAccessibleColors(foreground, background, 1)
  return suggestions[0] || foreground
}
