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
const Blues = ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"]
const Greens = ["#f7fcf5", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"]
const Oranges = ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"]
const Purples = ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"]
const Reds = ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"]

/* Diverging – 11 colours (kept to 11 so both ends stay saturated) */
const RdYlBu = [
  "#a50026",
  "#d73027",
  "#f46d43",
  "#fdae61",
  "#fee090",
  "#ffffbf",
  "#e0f3f8",
  "#abd9e9",
  "#74add1",
  "#4575b4",
  "#313695",
]
const RdBu = [
  "#67001f",
  "#b2182b",
  "#d6604d",
  "#f4a582",
  "#fddbc7",
  "#f7f7f7",
  "#d1e5f0",
  "#92c5de",
  "#4393c3",
  "#2166ac",
  "#053061",
]
const PiYG = [
  "#8e0152",
  "#c51b7d",
  "#de77ae",
  "#f1b6da",
  "#fde0ef",
  "#f7f7f7",
  "#e6f5d0",
  "#b8e186",
  "#7fbc41",
  "#4d9221",
  "#276419",
]
const BrBG = [
  "#543005",
  "#8c510a",
  "#bf812d",
  "#dfc27d",
  "#f6e8c3",
  "#f5f5f5",
  "#c7eae5",
  "#80cdc1",
  "#35978f",
  "#01665e",
  "#003c30",
]

/* Categorical */
const Category10 = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
]
const Set3 = [
  "#8dd3c7",
  "#ffffb3",
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#d9d9d9",
  "#bc80bd",
  "#ccebc5",
  "#ffed6f",
]
const Pastel1 = ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"]

export const d3ColorSchemes: Record<string, string[]> = {
  Blues,
  Greens,
  Oranges,
  Purples,
  Reds,

  RdYlBu,
  RdBu,
  PiYG,
  BrBG,

  Category10,
  Set3,
  Pastel1,
}

/* -------------------------------------------------------------------------- */
/*                               UI categories                                */
/* -------------------------------------------------------------------------- */
export const colorSchemeCategories = {
  sequential: {
    "Single Hue": ["Blues", "Greens", "Oranges", "Purples", "Reds"],
    /* Multi-hue ramps can be added later if needed. */
    "Multi-Hue": [],
  },
  diverging: ["RdYlBu", "RdBu", "PiYG", "BrBG"],
  categorical: ["Category10", "Set3", "Pastel1"],
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
