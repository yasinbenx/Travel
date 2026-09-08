/**
 * Bildet die (teils abgekürzten) Ländernamen aus dem `world-atlas`
 * TopoJSON (Natural-Earth-Daten, `properties.name`) auf die kanonischen
 * Namen aus `countryAdjacency` ab. Nur Einträge, die sich unterscheiden,
 * müssen hier aufgeführt werden — ansonsten wird der TopoJSON-Name
 * unverändert als kanonischer Name angenommen.
 *
 * Bekannte Lücken (bewusst nicht abgebildet, da im 50m-TopoJSON nicht
 * als eigene Geometrie vorhanden bzw. nicht Teil unserer Länderliste):
 * - Französisch-Guayana ist im TopoJSON Teil der Geometrie von
 *   Frankreich (keine eigene Landmasse in diesem Datensatz).
 * - Tuvalu ist bei dieser Auflösung schlicht nicht enthalten (zu klein).
 * - Gebiete wie "N. Cyprus" oder "Somaliland" sind keine eigenständigen
 *   Länder in unserer Adjazenzliste und bleiben daher unangetastet
 *   (werden auf der Karte einfach nicht eingefärbt).
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

/** Löst einen TopoJSON-Ländernamen auf den kanonischen Namen auf. */
export function resolveMapCountryName(topoName: string): string {
  return mapCountryNames[topoName] ?? topoName;
}
