/**
 * Maps the (partly abbreviated) country names from the `world-atlas`
 * TopoJSON (Natural Earth data, `properties.name`) onto the canonical
 * names used in `countryAdjacency`. Only entries that actually differ
 * need to be listed here — otherwise the TopoJSON name is used unchanged
 * as the canonical name.
 *
 * Known gaps (deliberately unmapped, since they have no distinct geometry
 * in this 50m TopoJSON or aren't part of our country list):
 * - French Guiana is, in this TopoJSON, part of France's geometry (no
 *   separate landmass in this dataset).
 * - Tuvalu simply isn't included at this resolution (too small).
 * - Territories like "N. Cyprus" or "Somaliland" aren't independent
 *   countries in our adjacency list and are therefore left untouched
 *   (they just won't be colored on the map).
 */
export const mapCountryNames: Record<string, string> = {
  "Antigua and Barb.": "Antigua and Barbuda",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Cabo Verde": "Cape Verde",
  "Central African Rep.": "Central African Republic",
  Congo: "Republic of Congo",
  Czechia: "Czech Republic",
  "Côte d'Ivoire": "Ivory Coast",
  "Dem. Rep. Congo": "DR Congo",
  "Dominican Rep.": "Dominican Republic",
  "Eq. Guinea": "Equatorial Guinea",
  Macedonia: "North Macedonia",
  "Marshall Is.": "Marshall Islands",
  "S. Sudan": "South Sudan",
  "Solomon Is.": "Solomon Islands",
  "St. Kitts and Nevis": "Saint Kitts and Nevis",
  "St. Vin. and Gren.": "Saint Vincent and the Grenadines",
  "São Tomé and Principe": "Sao Tome and Principe",
  "United States of America": "United States",
  Vatican: "Vatican City",
  "W. Sahara": "Western Sahara",
  eSwatini: "Eswatini",
};

/** Resolves a TopoJSON country name to its canonical name. */
export function resolveMapCountryName(topoName: string): string {
  return mapCountryNames[topoName] ?? topoName;
}
