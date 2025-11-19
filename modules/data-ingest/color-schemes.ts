import * as d3 from 'd3'

import type { ColorScaleType, DimensionSettings } from '@/app/(studio)/types'

export const D3_COLOR_SCHEMES = {
  // Sequential (Single Hue)
  Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
  Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
  Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
  Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
  Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
  // Sequential (Multi-Hue)
  Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
  Plasma: ['#0d0887', '#5302a3', '#8b0aa5', '#b83289', '#db5c68', '#f48849', '#febd2a', '#f0f921'],
  Inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#fcffa4'],
  Magma: ['#000004', '#1c1044', '#4f127b', '#812581', '#b5367a', '#e55964', '#fb8761', '#fec287', '#fcfdbf'],
  Cividis: ['#00224e', '#123570', '#3b496c', '#575d6d', '#707173', '#8a8678', '#a59c74', '#c3b369', '#e1cc55'],
  // Diverging
  RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
  RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
  PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
  BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
  PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
  RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
  Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
  // Categorical
  Category10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
  Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
  Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
  Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2'],
  Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
  Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
  Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
  Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
  Tableau10: ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'],
} as const

export const COLOR_SCHEME_CATEGORIES = {
  sequential: {
    'Single Hue': ['Blues', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'],
    'Multi-Hue': ['Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis'],
  },
  diverging: ['RdYlBu', 'RdBu', 'PiYG', 'BrBG', 'PRGn', 'RdYlGn', 'Spectral'],
  categorical: ['Category10', 'Accent', 'Dark2', 'Paired', 'Pastel1', 'Pastel2', 'Set1', 'Set2', 'Set3', 'Tableau10'],
} as const

export interface CustomColorScheme {
  name: string
  type: ColorScaleType
  colors: string[]
  hasMidpoint?: boolean
}

export interface ApplyColorSchemePresetOptions {
  schemeName: string
  section: 'symbol' | 'choropleth'
  colorScale: ColorScaleType
  colorByColumn: string
  currentSettings: DimensionSettings
  getUniqueValues: (column: string) => string[]
  customSchemes: CustomColorScheme[]
  showMidpoint: boolean
}

export const applyColorSchemePreset = ({
  schemeName,
  section,
  colorScale,
  colorByColumn,
  currentSettings,
  getUniqueValues,
  customSchemes,
  showMidpoint,
}: ApplyColorSchemePresetOptions): DimensionSettings => {
  let colors: readonly string[] | undefined = D3_COLOR_SCHEMES[schemeName as keyof typeof D3_COLOR_SCHEMES]

  if (schemeName.startsWith('custom-')) {
    const customName = schemeName.replace(/^custom(?:-linear)?-/, '')
    const customScheme = customSchemes.find((scheme) => scheme.name === customName)
    colors = customScheme?.colors
    if (customScheme?.type === 'linear' && !schemeName.startsWith('custom-linear-')) {
      colorScale = 'linear'
    }
  }

  if (!colors || colors.length === 0) {
    console.warn(`Color scheme "${schemeName}" not found`)
    return currentSettings
  }

  const palette = [...colors]

  const nextSettings: DimensionSettings = {
    ...currentSettings,
    [section]: {
      ...currentSettings[section],
    },
  }

  const targetSection = nextSettings[section]

  if (colorScale === 'linear') {
    targetSection.colorMinColor = palette[0]
    targetSection.colorMaxColor = palette[palette.length - 1]

    if (showMidpoint) {
      if (palette.length >= 3) {
        targetSection.colorMidColor = palette[Math.floor(palette.length / 2)]
      } else {
        const scale = d3.scaleLinear<string>().domain([0, 1]).range([palette[0], palette[palette.length - 1]])
        targetSection.colorMidColor = d3.color(scale(0.5))?.hex() ?? '#808080'
      }
    } else {
      targetSection.colorMidColor = ''
    }

    targetSection.colorPalette = schemeName
  } else if (colorScale === 'categorical' && colorByColumn) {
    const uniqueValues = getUniqueValues(colorByColumn)
    targetSection.categoricalColors = uniqueValues.map((_, index) => ({
      value: `color-${index}`,
      color: palette[index % palette.length],
    }))
    targetSection.colorPalette = schemeName
  }

  return nextSettings
}
