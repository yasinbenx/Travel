/**
 * Common aliases/alternative names for countries, mapped onto the
 * canonical keys from `countryAdjacency`. Used by `resolveCountryName`
 * together with case- and accent-tolerant normalization, so players
 * don't have to hit the exact English name used in the data.
 *
 * Keys here do NOT need to be pre-normalized (no lowercasing, no
 * stripped accents) — `resolveCountryName` normalizes both the input and
 * these aliases the same way.
 *
 * The German names below are kept deliberately: even in an English UI, a
 * player may instinctively type a country's name in their own language,
 * and there's no reason not to accept that too.
 */
export const countryAliases: Record<string, string> = {
  // English short/alternative names
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

  // Common German country names
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
