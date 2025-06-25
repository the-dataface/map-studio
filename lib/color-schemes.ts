"use client"

/**
 * Central registry of the colour-scheme data used in DimensionMapping.
 * Only the schemes referenced in the UI are included.
 *
 * 1.  d3ColorSchemes – map of name → array of hex colours
 * 2.  colorSchemeCategories – friendly groupings for the dropdown UI
 * 3.  renderColorSchemePreview – small swatch generator used in Select items
 */

import type React from "react"

/* -------------------------------------------------------------------------- */
/*                               D3-style scales                              */
/* -------------------------------------------------------------------------- */
/* Sequential (single-hue) – 9-colour ramps */
export const colorSchemes = {
  // Sequential (single-hue)
  Blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  Greens: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
  Greys: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
  Oranges: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
  Purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
  Reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],

  // Diverging
  RdBu: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
  PiYG: ["#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419"],
  PRGn: ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"],

  // Qualitative (for categorical data)
  Category10: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"],
  Accent: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"],
  Dark2: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
};

/* -------------------------------------------------------------------------- */
/*                               UI categories                                */
/* -------------------------------------------------------------------------- */
export const colorSchemeCategories = {
  sequential: {
    "Single Hue": ["Blues", "Greens", "Oranges", "Purples", "Reds", "Greys"],
    /* Multi-hue ramps can be added later if needed. */
    "Multi-Hue": [],
  },
  diverging: ["RdBu", "PiYG", "PRGn"],
  categorical: ["Category10", "Accent", "Dark2"],
}

/* -------------------------------------------------------------------------- */
/*                        Colour-scheme swatch component                      */
/* -------------------------------------------------------------------------- */
export function renderColorSchemePreview(
  colors: string[],
  /* eslint-disable @typescript-eslint/no-unused-vars */
  _scaleType: "linear" | "categorical",
  key: string,
): React.ReactElement {
  /* A simple bar of equal-width colour blocks */
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-sm" key={key}>
      {colors.map((c, i) => (
        <div key={`${key}-${i}`} style={{ backgroundColor: c }} className="flex-1" />
      ))}
    </div>
  )
}
