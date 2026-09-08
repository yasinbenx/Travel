/**
 * Gängige Aliase/Alternativnamen für Länder, die auf die kanonischen
 * Schlüssel aus `countryAdjacency` abgebildet werden. Wird von
 * `resolveCountryName` zusammen mit einer Groß-/Kleinschreibungs- und
 * Umlaut-toleranten Normalisierung genutzt, damit Spieler nicht exakt
 * den in den Daten verwendeten englischen Namen treffen müssen.
 *
 * Die Keys hier müssen NICHT vor-normalisiert werden (kein Lowercase,
 * keine entfernten Umlaute) — `resolveCountryName` normalisiert sowohl
 * die Eingabe als auch diese Aliase auf die gleiche Weise.
 */
export const countryAliases: Record<string, string> = {
  // Englische Kurz-/Alternativnamen
  USA: "United States",
  US: "United States",
  "United States of America": "United States",
  America: "United States",
  UK: "United Kingdom",
  "Great Britain": "United Kingdom",
  Britain: "United Kingdom",
  UAE: "United Arab Emirates",
  DRC: "DR Congo",
  "Democratic Republic of the Congo": "DR Congo",
  "Congo-Kinshasa": "DR Congo",
  "Republic of the Congo": "Republic of Congo",
  "Congo-Brazzaville": "Republic of Congo",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  Czechia: "Czech Republic",
  Macedonia: "North Macedonia",
  Swaziland: "Eswatini",
  Burma: "Myanmar",
  "East Timor": "Timor-Leste",
  Vatican: "Vatican City",
  "Holy See": "Vatican City",

  // Gängige deutsche Ländernamen
  "Vereinigte Staaten": "United States",
  "Vereinigte Staaten von Amerika": "United States",
  Großbritannien: "United Kingdom",
  "Vereinigtes Königreich": "United Kingdom",
  Deutschland: "Germany",
  Frankreich: "France",
  Italien: "Italy",
  Spanien: "Spain",
  Russland: "Russia",
  Marokko: "Morocco",
  Ägypten: "Egypt",
  Polen: "Poland",
  Österreich: "Austria",
  Schweiz: "Switzerland",
  Niederlande: "Netherlands",
  Holland: "Netherlands",
  Schweden: "Sweden",
  Norwegen: "Norway",
  Finnland: "Finland",
  Dänemark: "Denmark",
  Griechenland: "Greece",
  Türkei: "Turkey",
  Ungarn: "Hungary",
  Kroatien: "Croatia",
  Belgien: "Belgium",
  Irland: "Ireland",
  Elfenbeinküste: "Ivory Coast",
  Weißrussland: "Belarus",
  Tschechien: "Czech Republic",
  Südkorea: "South Korea",
  Nordkorea: "North Korea",
  Neuseeland: "New Zealand",
  Südafrika: "South Africa",
  Elfenbeinkueste: "Ivory Coast",
};
