/**
 * Color blindness simulation and distinguishability checking
 * Based on algorithms from:
 * - https://web.archive.org/web/20081014161121/http://www.colorjack.com/labs/colormatrix/
 * - https://github.com/MaPepeR/js-colorblind
 */

import { hexToRgb, rgbToHex } from './color-contrast'

// Re-export for convenience
export { hexToRgb, rgbToHex }

/**
 * Color blindness types
 */
export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia'

/**
 * Simulate color blindness by converting RGB to color-blind vision
 */
function simulateColorBlindness(
  r: number,
  g: number,
  b: number,
  type: ColorBlindnessType
): { r: number; g: number; b: number } {
  // Color transformation matrices for different types of color blindness
  const matrices: Record<ColorBlindnessType, number[][]> = {
    protanopia: [
      [0.567, 0.433, 0],
      [0.558, 0.442, 0],
      [0, 0.242, 0.758],
    ],
    deuteranopia: [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7],
    ],
    tritanopia: [
      [0.95, 0.05, 0],
      [0, 0.433, 0.567],
      [0, 0.475, 0.525],
    ],
  }

  const matrix = matrices[type]
  return {
    r: Math.round(r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]),
    g: Math.round(r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]),
    b: Math.round(r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]),
  }
}

/**
 * Simulate how a color appears to someone with color blindness
 */
export function simulateColorBlindnessForHex(
  hex: string,
  type: ColorBlindnessType
): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const simulated = simulateColorBlindness(rgb.r, rgb.g, rgb.b, type)
  return rgbToHex(simulated.r, simulated.g, simulated.b)
}

/**
 * Calculate perceptual distance between two colors using Delta E (CIE76)
 * Lower values mean colors are more similar
 */
function getColorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  // Convert RGB to LAB color space for better perceptual distance
  const lab1 = rgbToLab(color1.r, color1.g, color1.b)
  const lab2 = rgbToLab(color2.r, color2.g, color2.b)

  // Calculate Delta E
  const deltaL = lab1.l - lab2.l
  const deltaA = lab1.a - lab2.a
  const deltaB = lab1.b - lab2.b

  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}

/**
 * Convert RGB to LAB color space
 */
function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // Normalize RGB values
  r = r / 255
  g = g / 255
  b = b / 255

  // Convert to linear RGB
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

  // Convert to XYZ
  r *= 100
  g *= 100
  b *= 100

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505

  // Normalize for D65 illuminant
  const xn = x / 95.047
  const yn = y / 100.0
  const zn = z / 108.883

  // Convert to LAB
  const fx = xn > 0.008856 ? Math.pow(xn, 1 / 3) : 7.787 * xn + 16 / 116
  const fy = yn > 0.008856 ? Math.pow(yn, 1 / 3) : 7.787 * yn + 16 / 116
  const fz = zn > 0.008856 ? Math.pow(zn, 1 / 3) : 7.787 * zn + 16 / 116

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  }
}

/**
 * Check if two colors are distinguishable for color-blind users
 * Returns true if colors are distinguishable (Delta E > threshold)
 */
export function areColorsDistinguishable(
  color1: string,
  color2: string,
  colorBlindnessType: ColorBlindnessType,
  threshold: number = 5.0 // Minimum Delta E for distinguishability
): boolean {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return false

  // Simulate color blindness for both colors
  const simulated1 = simulateColorBlindness(rgb1.r, rgb1.g, rgb1.b, colorBlindnessType)
  const simulated2 = simulateColorBlindness(rgb2.r, rgb2.g, rgb2.b, colorBlindnessType)

  // Calculate distance between simulated colors
  const distance = getColorDistance(simulated1, simulated2)

  return distance >= threshold
}

/**
 * Check a categorical color scheme for color-blind accessibility
 * Returns pairs of colors that are not distinguishable
 */
export function checkCategoricalColorScheme(
  colors: string[],
  threshold: number = 5.0
): {
  issues: Array<{
    color1: string
    color2: string
    color1Index: number
    color2Index: number
    colorBlindnessTypes: ColorBlindnessType[]
  }>
  allDistinguishable: boolean
} {
  const issues: Array<{
    color1: string
    color2: string
    color1Index: number
    color2Index: number
    colorBlindnessTypes: ColorBlindnessType[]
  }> = []

  const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia']

  // Check all pairs of colors
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const color1 = colors[i]
      const color2 = colors[j]

      const problematicTypes: ColorBlindnessType[] = []

      // Check each type of color blindness
      for (const type of colorBlindnessTypes) {
        if (!areColorsDistinguishable(color1, color2, type, threshold)) {
          problematicTypes.push(type)
        }
      }

      if (problematicTypes.length > 0) {
        issues.push({
          color1,
          color2,
          color1Index: i,
          color2Index: j,
          colorBlindnessTypes: problematicTypes,
        })
      }
    }
  }

  return {
    issues,
    allDistinguishable: issues.length === 0,
  }
}

/**
 * Get a human-readable name for color blindness type
 */
export function getColorBlindnessTypeName(type: ColorBlindnessType): string {
  const names: Record<ColorBlindnessType, string> = {
    protanopia: 'Protanopia (red-blind)',
    deuteranopia: 'Deuteranopia (green-blind)',
    tritanopia: 'Tritanopia (blue-blind)',
  }
  return names[type]
}

