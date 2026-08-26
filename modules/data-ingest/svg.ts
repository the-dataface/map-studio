export interface FormattedSvgResult {
  formattedSvg: string
  closedPathCount: number
}

export const ensurePathsClosedAndFormatSVG = (svgString: string): FormattedSvgResult => {
  let closedCount = 0
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const paths = doc.querySelectorAll('path')

    paths.forEach((path) => {
      const d = path.getAttribute('d')
      if (d && !d.trim().toLowerCase().endsWith('z')) {
        path.setAttribute('d', `${d.trim()}Z`)
        closedCount += 1
      }
    })

    const serializer = new XMLSerializer()
    const modifiedSvgString = serializer.serializeToString(doc)

    let formatted = modifiedSvgString.trim().replace(/\s+/g, ' ')
    formatted = formatted
      .replace(/(<[^/][^>]*>)(?!<)/g, '$1\n')
      .replace(/(<\/[^>]+>)/g, '\n$1\n')
      .replace(/(<[^>]*\/>)/g, '$1\n')
      .replace(/\n\s*\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')

    return { formattedSvg: formatted, closedPathCount: closedCount }
  } catch (error) {
    console.error('Error in ensurePathsClosedAndFormatSVG:', error)
    const fallback = svgString
      .replace(/></g, '>\n<')
      .replace(/^\s+|\s+$/gm, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')

    return { formattedSvg: fallback, closedPathCount: 0 }
  }
}

export const validateCustomSVG = (svgString: string): { isValid: boolean; message: string } => {
  if (!svgString.trim()) {
    return { isValid: false, message: 'SVG code cannot be empty.' }
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')

    const errorNode = doc.querySelector('parsererror')
    if (errorNode) {
      return { isValid: false, message: `Invalid SVG format: ${errorNode.textContent}` }
    }

    const svgElement = doc.documentElement
    if (svgElement.tagName.toLowerCase() !== 'svg') {
      return { isValid: false, message: 'Root element must be <svg>.' }
    }

    const mapGroup = svgElement.querySelector('g#Map')
    if (!mapGroup) {
      return { isValid: false, message: "Missing required <g id='Map'> group." }
    }

    const nationsGroup = mapGroup.querySelector('g#Nations, g#Countries')
    // Nations/Countries group is optional — flat SVGs with only region paths are valid

    const statesGroup = mapGroup.querySelector('g#States, g#Provinces, g#Regions')
    const flatPaths = mapGroup.querySelectorAll(
      "path[id^='State-'], path[id^='Nation-'], path[id^='Country-'], path[id^='Province-'], path[id^='Region-'], path[id]",
    )

    if (!statesGroup && flatPaths.length === 0) {
      return {
        isValid: false,
        message:
          "No mappable paths found. Add a <g id='States'> group with <path id='State-XX'> elements, or paths with id attributes directly inside #Map.",
      }
    }

    const regionPaths = statesGroup
      ? statesGroup.querySelectorAll(
          "path[id^='State-'], path[id^='Nation-'], path[id^='Country-'], path[id^='Province-'], path[id^='Region-'], path[id]",
        )
      : flatPaths

    if (regionPaths.length === 0) {
      return {
        isValid: false,
        message:
          "No region paths found. Use ids like State-CA, Province-ON, or Region-XX, or any path with an id attribute.",
      }
    }

    // Country path is optional (only required when Nations group is present)
    if (nationsGroup) {
      const countryUSPath = nationsGroup.querySelector('path#Country-US, path#Nation-US')
      if (!countryUSPath) {
        return {
          isValid: false,
          message:
            "When a Nations/Countries group is present, include <path id='Country-US'> or <path id='Nation-US'>.",
        }
      }
    }

    if (statesGroup) {
      const statePaths = statesGroup.querySelectorAll(
        "path[id^='State-'], path[id^='Nation-'], path[id^='Country-'], path[id^='Province-'], path[id^='Region-'], path[id]",
      )
      if (statePaths.length === 0) {
        return {
          isValid: false,
          message:
            "No <path id='State-XX'> (or similar) elements found inside States/Provinces/Regions group.",
        }
      }
    }

    return { isValid: true, message: 'SVG is valid.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { isValid: false, message: `Error parsing SVG: ${message}` }
  }
}


