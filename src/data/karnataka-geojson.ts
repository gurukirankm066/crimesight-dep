import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import districtBoundaries from './karnataka-districts.json'

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
    geometry: { type, coordinates } as Geometry,
  })) as Feature<Geometry, GeoJsonProperties>[],
}

export default karnatakaGeojson
