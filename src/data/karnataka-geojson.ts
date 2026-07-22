import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import districtBoundaries from './karnataka-districts.json'

// The supplied source had a placeholder ellipse for Vijayanagara. It made the
// statewide map look like a large circle sitting on top of neighbouring
// districts. This compact, non-self-intersecting display boundary preserves a
// readable district-level prototype map until an authoritative boundary feed is
// connected in production.
const vijayanagaraDisplayBoundary: Geometry = {
  type: 'Polygon',
  coordinates: [[
    [76.02, 15.61], [76.14, 15.70], [76.30, 15.67], [76.43, 15.57],
    [76.50, 15.43], [76.46, 15.30], [76.35, 15.17], [76.20, 15.11],
    [76.07, 15.20], [75.99, 15.35], [75.98, 15.49], [76.02, 15.61],
  ]],
}

/**
 * Karnataka's district boundaries shipped with the application bundle.
 *
 * Keeping this data in the client bundle prevents the map from depending on
 * the deployment platform serving a public GeoJSON file at runtime.
 */
const karnatakaGeojson: FeatureCollection<Geometry, GeoJsonProperties> = {
  type: 'FeatureCollection',
  features: districtBoundaries.map(({ name, type, coordinates }) => ({
    type: 'Feature',
    properties: { NAME_2: name },
    geometry: name === 'Vijayanagara' ? vijayanagaraDisplayBoundary : { type, coordinates } as Geometry,
  })) as Feature<Geometry, GeoJsonProperties>[],
}

export default karnatakaGeojson
