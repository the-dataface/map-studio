/**
 * Web Worker wrapper for map calculations
 * Uses a simpler approach compatible with Next.js
 */

const worker: Worker | null = null
const workerReady = false

function getWorker(): Worker | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (worker && workerReady) {
    return worker
  }

  try {
    // Create worker from inline blob for better compatibility
    // Note: Currently using main thread fallback, but structure is ready for workers
    // Uncomment when implementing actual worker:
    /*
    const workerCode = `
      import * as d3 from 'd3';

      function createProjection(config) {
        const { type, width, height } = config;
        let projection;
        
        switch (type) {
          case 'albersUsa':
            projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2]);
            break;
          case 'albers':
            projection = d3.geoAlbers().scale(1300).translate([width / 2, height / 2]);
            break;
          case 'mercator':
            projection = d3.geoMercator().scale(150).translate([width / 2, height / 2]);
            break;
          case 'equalEarth':
            projection = d3.geoEqualEarth().scale(150).translate([width / 2, height / 2]);
            break;
          default:
            projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, height / 2]);
        }
        return projection;
      }

      self.addEventListener('message', (event) => {
        try {
          const { type, payload } = event.data;
          
          if (type === 'projectCoordinates') {
            const { projectionConfig, coordinates } = payload;
            const projection = createProjection(projectionConfig);
            const projected = coordinates.map(([lng, lat]) => {
              const point = projection([lng, lat]);
              return point ? { x: point[0], y: point[1] } : { x: 0, y: 0 };
            });
            self.postMessage({ type: 'projected', payload: projected });
          } else if (type === 'createScale') {
            const { domain, range } = payload;
            const scale = d3.scaleLinear().domain(domain).range(range);
            // Return scale configuration (can't serialize the scale function itself)
            self.postMessage({ 
              type: 'scaleCreated', 
              payload: { domain, range, type: 'linear' } 
            });
          }
        } catch (error) {
          self.postMessage({ 
            type: 'error', 
            payload: { message: error.message } 
          });
        }
      });
    `
    */

    // For now, we'll use a simpler approach - calculate on main thread
    // but structure code to allow easy migration to workers
    // Web Workers with D3 in Next.js require more complex setup
    return null
  } catch (error) {
    console.warn('Worker initialization failed:', error)
    return null
  }
}

export interface ProjectionConfig {
  type: 'albersUsa' | 'albers' | 'mercator' | 'equalEarth'
  width: number
  height: number
}

export interface ProjectCoordinatesPayload {
  projectionConfig: ProjectionConfig
  coordinates: Array<[number, number]>
}

/**
 * Project coordinates using Web Worker (with fallback to main thread)
 */
export async function projectCoordinates(
  payload: ProjectCoordinatesPayload
): Promise<Array<{ x: number; y: number }>> {
  const w = getWorker()
  
  if (!w) {
    // Fallback to main thread calculation
    return projectCoordinatesMainThread(payload)
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Worker timeout'))
    }, 5000)

    const handler = (event: MessageEvent) => {
      if (event.data.type === 'projected') {
        clearTimeout(timeout)
        w.removeEventListener('message', handler)
        resolve(event.data.payload)
      } else if (event.data.type === 'error') {
        clearTimeout(timeout)
        w.removeEventListener('message', handler)
        reject(new Error(event.data.payload.message))
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ type: 'projectCoordinates', payload })
  })
}

/**
 * Fallback: Project coordinates on main thread
 */
function projectCoordinatesMainThread(
  payload: ProjectCoordinatesPayload
): Array<{ x: number; y: number }> {
  // Import d3 dynamically to avoid blocking
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const d3 = require('d3')
  const { projectionConfig, coordinates } = payload

  let projection: d3.GeoProjection
  switch (projectionConfig.type) {
    case 'albersUsa':
      projection = d3.geoAlbersUsa().scale(1300).translate([projectionConfig.width / 2, projectionConfig.height / 2])
      break
    case 'albers':
      projection = d3.geoAlbers().scale(1300).translate([projectionConfig.width / 2, projectionConfig.height / 2])
      break
    case 'mercator':
      projection = d3.geoMercator().scale(150).translate([projectionConfig.width / 2, projectionConfig.height / 2])
      break
    case 'equalEarth':
      projection = d3.geoEqualEarth().scale(150).translate([projectionConfig.width / 2, projectionConfig.height / 2])
      break
    default:
      projection = d3.geoAlbersUsa().scale(1300).translate([projectionConfig.width / 2, projectionConfig.height / 2])
  }

  return coordinates.map(([lng, lat]) => {
    const point = projection([lng, lat])
    return point ? { x: point[0], y: point[1] } : { x: 0, y: 0 }
  })
}

