/**
 * Adjacency list of all countries in the world (land borders).
 *
 * Basis: common geographic reference data (among others, the CIA World
 * Factbook's "Land boundaries" and Natural Earth's Admin-0 border
 * polygons). Only direct LAND BORDERS are included — pure sea borders
 * (e.g. Denmark/Sweden across the Øresund, Spain/Morocco across the
 * Strait of Gibraltar outside of Ceuta/Melilla) do NOT count as
 * neighbors.
 *
 * Scope: all 193 UN member states plus a small number of additional
 * territories common in geography/guessing games that have their own
 * contiguous landmass with its own borders: Kosovo, Taiwan, Western
 * Sahara, Palestine, and French Guiana. Smaller exclaves/overseas
 * territories with no land border of their own (e.g. Greenland, Puerto
 * Rico, Hong Kong) are deliberately NOT included as separate entries,
 * since they aren't relevant to the pathfinding foundation.
 *
 * Special cases / disputed borders (rationale for the chosen version):
 *
 * - Russia/Kaliningrad: Kaliningrad is a Russian exclave between Poland
 *   and Lithuania. Since it politically belongs to Russia, the
 *   Kaliningrad–Poland and Kaliningrad–Lithuania borders count as
 *   Russia's own borders (making Poland and Lithuania direct neighbors
 *   of Russia, in addition to the "main border" further east). This
 *   gives Russia its well-known 14 neighbors.
 * - Western Sahara/Morocco: Morocco de facto controls most of Western
 *   Sahara, but the territory isn't annexed under international law and
 *   is listed here as its own territory with borders to Morocco,
 *   Algeria, and Mauritania (reference data such as Natural Earth also
 *   lists it separately).
 * - Morocco/Spain: The Spanish exclaves Ceuta and Melilla sit on the
 *   African mainland and border Morocco. This land border is attributed
 *   here to Spain (making Spain ↔ Morocco direct neighbors), even though
 *   mainland Spain itself doesn't border Morocco.
 * - Cyprus: Listed as one island with no land neighbors. The division
 *   into the Republic of Cyprus and the internationally unrecognized
 *   (except by Turkey) "Turkish Republic of Northern Cyprus" doesn't
 *   change this, since it's an internal border on one and the same
 *   landmass, not a border to another state.
 * - Israel/Palestine: Palestine (Gaza Strip + West Bank) is listed as one
 *   combined entry with borders to Israel, Egypt (Gaza Strip/Rafah), and
 *   Jordan (West Bank/Jordan Valley), even though the Gaza Strip and West
 *   Bank aren't geographically contiguous. For a country-guessing game
 *   this is simplified as one entity, matching how many common country
 *   datasets represent it.
 * - Kosovo: Listed as its own territory with borders to Serbia,
 *   Montenegro, Albania, and North Macedonia, even though its
 *   independence from Serbia isn't universally recognized. This matches
 *   common practice in geography datasets/games (including
 *   travle.earth).
 * - Botswana/Zambia: The two countries touch at a very short
 *   quadripoint (Kazungula) just a few hundred meters long. Most current
 *   geographic datasets list this as a real land border, so it's
 *   included here too. Namibia/Zimbabwe, on the other hand, do NOT touch
 *   at this quadripoint (they only sit diagonally across from each
 *   other) and are therefore not listed as neighbors.
 * - India/Afghanistan: There is no border between India and Afghanistan
 *   actually controlled by India (the geographic proximity only exists
 *   via Pakistan-administered Kashmir). Both countries are therefore NOT
 *   treated as direct neighbors here, consistent with most standard
 *   datasets.
 * - Taiwan: Listed as its own territory with no land neighbors (an
 *   island), regardless of political status.
 */

export const countryAdjacency: Record<string, string[]> = {
  // ---------------------------------------------------------------------
  // EUROPE
  // ---------------------------------------------------------------------
  Albania: ["Montenegro", "Kosovo", "North Macedonia", "Greece"],
  Andorra: ["France", "Spain"],
  Austria: [
    "Germany",
    "Czech Republic",
    "Slovakia",
    "Hungary",
    "Slovenia",
    "Italy",
    "Switzerland",
    "Liechtenstein",
  ],
  Belarus: ["Russia", "Ukraine", "Poland", "Lithuania", "Latvia"],
  Belgium: ["France", "Netherlands", "Germany", "Luxembourg"],
  "Bosnia and Herzegovina": ["Croatia", "Serbia", "Montenegro"],
  Bulgaria: ["Romania", "Serbia", "North Macedonia", "Greece", "Turkey"],
  Croatia: ["Slovenia", "Hungary", "Serbia", "Bosnia and Herzegovina", "Montenegro"],
  Cyprus: [],
  "Czech Republic": ["Germany", "Poland", "Slovakia", "Austria"],
  Denmark: ["Germany"],
  Estonia: ["Russia", "Latvia"],
  Finland: ["Sweden", "Norway", "Russia"],
  France: [
    "Belgium",
    "Luxembourg",
    "Germany",
    "Switzerland",
    "Italy",
    "Monaco",
    "Andorra",
    "Spain",
  ],
  Germany: [
    "Denmark",
    "Poland",
    "Czech Republic",
    "Austria",
    "Switzerland",
    "France",
    "Luxembourg",
    "Belgium",
    "Netherlands",
  ],
  Greece: ["Albania", "North Macedonia", "Bulgaria", "Turkey"],
  Hungary: ["Austria", "Slovakia", "Ukraine", "Romania", "Serbia", "Croatia", "Slovenia"],
  Iceland: [],
  Ireland: ["United Kingdom"],
  Italy: ["France", "Switzerland", "Austria", "Slovenia", "San Marino", "Vatican City"],
  Kosovo: ["Serbia", "Montenegro", "Albania", "North Macedonia"],
  Latvia: ["Estonia", "Russia", "Belarus", "Lithuania"],
  Liechtenstein: ["Switzerland", "Austria"],
  Lithuania: ["Latvia", "Belarus", "Poland", "Russia"],
  Luxembourg: ["Belgium", "Germany", "France"],
  Malta: [],
  Moldova: ["Romania", "Ukraine"],
  Monaco: ["France"],
  Montenegro: ["Croatia", "Bosnia and Herzegovina", "Serbia", "Kosovo", "Albania"],
  Netherlands: ["Germany", "Belgium"],
  "North Macedonia": ["Kosovo", "Serbia", "Bulgaria", "Greece", "Albania"],
  Norway: ["Sweden", "Finland", "Russia"],
  Poland: [
    "Germany",
    "Czech Republic",
    "Slovakia",
    "Ukraine",
    "Belarus",
    "Lithuania",
    "Russia",
  ],
  Portugal: ["Spain"],
  Romania: ["Hungary", "Serbia", "Bulgaria", "Ukraine", "Moldova"],
  Russia: [
    "Norway",
    "Finland",
    "Estonia",
    "Latvia",
    "Lithuania",
    "Poland",
    "Belarus",
    "Ukraine",
    "Georgia",
    "Azerbaijan",
    "Kazakhstan",
    "China",
    "Mongolia",
    "North Korea",
  ],
  "San Marino": ["Italy"],
  Serbia: [
    "Hungary",
    "Romania",
    "Bulgaria",
    "North Macedonia",
    "Kosovo",
    "Montenegro",
    "Bosnia and Herzegovina",
    "Croatia",
  ],
  Slovakia: ["Czech Republic", "Poland", "Ukraine", "Hungary", "Austria"],
  Slovenia: ["Italy", "Austria", "Hungary", "Croatia"],
  Spain: ["Portugal", "France", "Andorra", "Morocco"],
  Sweden: ["Norway", "Finland"],
  Switzerland: ["France", "Germany", "Austria", "Liechtenstein", "Italy"],
  Ukraine: ["Russia", "Belarus", "Poland", "Slovakia", "Hungary", "Romania", "Moldova"],
  "United Kingdom": ["Ireland"],
  "Vatican City": ["Italy"],

  // ---------------------------------------------------------------------
  // ASIA
  // ---------------------------------------------------------------------
  Afghanistan: ["Iran", "Turkmenistan", "Uzbekistan", "Tajikistan", "China", "Pakistan"],
  Armenia: ["Georgia", "Azerbaijan", "Iran", "Turkey"],
  Azerbaijan: ["Russia", "Georgia", "Armenia", "Iran", "Turkey"],
  Bahrain: [],
  Bangladesh: ["India", "Myanmar"],
  Bhutan: ["China", "India"],
  Brunei: ["Malaysia"],
  Cambodia: ["Thailand", "Laos", "Vietnam"],
  China: [
    "Mongolia",
    "Russia",
    "North Korea",
    "Vietnam",
    "Laos",
    "Myanmar",
    "India",
    "Bhutan",
    "Nepal",
    "Pakistan",
    "Afghanistan",
    "Tajikistan",
    "Kyrgyzstan",
    "Kazakhstan",
  ],
  Georgia: ["Russia", "Azerbaijan", "Armenia", "Turkey"],
  India: ["Pakistan", "China", "Nepal", "Bhutan", "Bangladesh", "Myanmar"],
  Indonesia: ["Malaysia", "Papua New Guinea", "Timor-Leste"],
  Iran: ["Iraq", "Turkey", "Armenia", "Azerbaijan", "Turkmenistan", "Afghanistan", "Pakistan"],
  Iraq: ["Iran", "Turkey", "Syria", "Jordan", "Saudi Arabia", "Kuwait"],
  Israel: ["Egypt", "Jordan", "Lebanon", "Syria", "Palestine"],
  Japan: [],
  Jordan: ["Israel", "Syria", "Iraq", "Saudi Arabia", "Palestine"],
  Kazakhstan: ["Russia", "China", "Kyrgyzstan", "Uzbekistan", "Turkmenistan"],
  Kuwait: ["Iraq", "Saudi Arabia"],
  Kyrgyzstan: ["Kazakhstan", "China", "Tajikistan", "Uzbekistan"],
  Laos: ["China", "Vietnam", "Cambodia", "Thailand", "Myanmar"],
  Lebanon: ["Syria", "Israel"],
  Malaysia: ["Thailand", "Indonesia", "Brunei"],
  Maldives: [],
  Mongolia: ["Russia", "China"],
  Myanmar: ["China", "Laos", "Thailand", "India", "Bangladesh"],
  Nepal: ["China", "India"],
  "North Korea": ["China", "South Korea", "Russia"],
  Oman: ["Saudi Arabia", "United Arab Emirates", "Yemen"],
  Pakistan: ["India", "China", "Afghanistan", "Iran"],
  Palestine: ["Israel", "Egypt", "Jordan"],
  Philippines: [],
  Qatar: ["Saudi Arabia"],
  "Saudi Arabia": [
    "Jordan",
    "Iraq",
    "Kuwait",
    "Qatar",
    "United Arab Emirates",
    "Oman",
    "Yemen",
  ],
  Singapore: [],
  "South Korea": ["North Korea"],
  "Sri Lanka": [],
  Syria: ["Turkey", "Iraq", "Jordan", "Israel", "Lebanon"],
  Taiwan: [],
  Tajikistan: ["Kyrgyzstan", "Uzbekistan", "Afghanistan", "China"],
  Thailand: ["Myanmar", "Laos", "Cambodia", "Malaysia"],
  "Timor-Leste": ["Indonesia"],
  Turkey: ["Greece", "Bulgaria", "Georgia", "Armenia", "Azerbaijan", "Iran", "Iraq", "Syria"],
  Turkmenistan: ["Kazakhstan", "Uzbekistan", "Afghanistan", "Iran"],
  "United Arab Emirates": ["Saudi Arabia", "Oman"],
  Uzbekistan: ["Kazakhstan", "Turkmenistan", "Tajikistan", "Kyrgyzstan", "Afghanistan"],
  Vietnam: ["China", "Laos", "Cambodia"],
  Yemen: ["Saudi Arabia", "Oman"],

  // ---------------------------------------------------------------------
  // AFRICA
  // ---------------------------------------------------------------------
  Algeria: ["Morocco", "Western Sahara", "Tunisia", "Libya", "Niger", "Mali", "Mauritania"],
  Angola: ["Namibia", "Zambia", "DR Congo", "Republic of Congo"],
  Benin: ["Togo", "Burkina Faso", "Niger", "Nigeria"],
  Botswana: ["Namibia", "Zambia", "Zimbabwe", "South Africa"],
  "Burkina Faso": ["Mali", "Niger", "Benin", "Togo", "Ghana", "Ivory Coast"],
  Burundi: ["Rwanda", "Tanzania", "DR Congo"],
  Cameroon: [
    "Nigeria",
    "Chad",
    "Central African Republic",
    "Republic of Congo",
    "Gabon",
    "Equatorial Guinea",
  ],
  "Cape Verde": [],
  "Central African Republic": [
    "Chad",
    "Sudan",
    "South Sudan",
    "DR Congo",
    "Republic of Congo",
    "Cameroon",
  ],
  Chad: ["Libya", "Sudan", "Central African Republic", "Cameroon", "Nigeria", "Niger"],
  Comoros: [],
  Djibouti: ["Eritrea", "Ethiopia", "Somalia"],
  "DR Congo": [
    "Republic of Congo",
    "Central African Republic",
    "South Sudan",
    "Uganda",
    "Rwanda",
    "Burundi",
    "Tanzania",
    "Zambia",
    "Angola",
  ],
  "Republic of Congo": [
    "Gabon",
    "Cameroon",
    "Central African Republic",
    "DR Congo",
    "Angola",
  ],
  Egypt: ["Libya", "Sudan", "Israel", "Palestine"],
  "Equatorial Guinea": ["Cameroon", "Gabon"],
  Eritrea: ["Sudan", "Ethiopia", "Djibouti"],
  Eswatini: ["South Africa", "Mozambique"],
  Ethiopia: ["Eritrea", "Djibouti", "Somalia", "Kenya", "South Sudan", "Sudan"],
  Gabon: ["Equatorial Guinea", "Cameroon", "Republic of Congo"],
  Gambia: ["Senegal"],
  Ghana: ["Ivory Coast", "Burkina Faso", "Togo"],
  Guinea: ["Guinea-Bissau", "Senegal", "Mali", "Ivory Coast", "Liberia", "Sierra Leone"],
  "Guinea-Bissau": ["Senegal", "Guinea"],
  "Ivory Coast": ["Liberia", "Guinea", "Mali", "Burkina Faso", "Ghana"],
  Kenya: ["Ethiopia", "Somalia", "Tanzania", "Uganda", "South Sudan"],
  Lesotho: ["South Africa"],
  Liberia: ["Sierra Leone", "Guinea", "Ivory Coast"],
  Libya: ["Tunisia", "Algeria", "Niger", "Chad", "Sudan", "Egypt"],
  Madagascar: [],
  Malawi: ["Tanzania", "Mozambique", "Zambia"],
  Mali: ["Algeria", "Niger", "Burkina Faso", "Ivory Coast", "Guinea", "Senegal", "Mauritania"],
  Mauritania: ["Western Sahara", "Algeria", "Mali", "Senegal"],
  Mauritius: [],
  Morocco: ["Algeria", "Western Sahara", "Spain"],
  Mozambique: ["Tanzania", "Malawi", "Zambia", "Zimbabwe", "South Africa", "Eswatini"],
  Namibia: ["Angola", "Zambia", "Botswana", "South Africa"],
  Niger: ["Algeria", "Libya", "Chad", "Nigeria", "Benin", "Burkina Faso", "Mali"],
  Nigeria: ["Benin", "Niger", "Chad", "Cameroon"],
  Rwanda: ["Uganda", "Tanzania", "Burundi", "DR Congo"],
  "Sao Tome and Principe": [],
  Senegal: ["Mauritania", "Mali", "Guinea", "Guinea-Bissau", "Gambia"],
  Seychelles: [],
  "Sierra Leone": ["Guinea", "Liberia"],
  Somalia: ["Djibouti", "Ethiopia", "Kenya"],
  "South Africa": ["Namibia", "Botswana", "Zimbabwe", "Mozambique", "Eswatini", "Lesotho"],
  "South Sudan": [
    "Sudan",
    "Ethiopia",
    "Kenya",
    "Uganda",
    "DR Congo",
    "Central African Republic",
  ],
  Sudan: ["Egypt", "Libya", "Chad", "Central African Republic", "South Sudan", "Ethiopia", "Eritrea"],
  Tanzania: [
    "Kenya",
    "Uganda",
    "Rwanda",
    "Burundi",
    "DR Congo",
    "Zambia",
    "Malawi",
    "Mozambique",
  ],
  Togo: ["Ghana", "Burkina Faso", "Benin"],
  Tunisia: ["Algeria", "Libya"],
  Uganda: ["Kenya", "South Sudan", "DR Congo", "Rwanda", "Tanzania"],
  "Western Sahara": ["Morocco", "Algeria", "Mauritania"],
  Zambia: [
    "DR Congo",
    "Tanzania",
    "Malawi",
    "Mozambique",
    "Zimbabwe",
    "Botswana",
    "Namibia",
    "Angola",
  ],
  Zimbabwe: ["Zambia", "Mozambique", "South Africa", "Botswana"],

  // ---------------------------------------------------------------------
  // NORTH AMERICA
  // ---------------------------------------------------------------------
  "Antigua and Barbuda": [],
  Bahamas: [],
  Barbados: [],
  Belize: ["Mexico", "Guatemala"],
  Canada: ["United States"],
  "Costa Rica": ["Nicaragua", "Panama"],
  Cuba: [],
  Dominica: [],
  "Dominican Republic": ["Haiti"],
  "El Salvador": ["Guatemala", "Honduras"],
  Grenada: [],
  Guatemala: ["Mexico", "Belize", "Honduras", "El Salvador"],
  Haiti: ["Dominican Republic"],
  Honduras: ["Guatemala", "El Salvador", "Nicaragua"],
  Jamaica: [],
  Mexico: ["United States", "Belize", "Guatemala"],
  Nicaragua: ["Honduras", "Costa Rica"],
  Panama: ["Costa Rica", "Colombia"],
  "Saint Kitts and Nevis": [],
  "Saint Lucia": [],
  "Saint Vincent and the Grenadines": [],
  "Trinidad and Tobago": [],
  "United States": ["Canada", "Mexico"],

  // ---------------------------------------------------------------------
  // SOUTH AMERICA
  // ---------------------------------------------------------------------
  Argentina: ["Chile", "Bolivia", "Paraguay", "Brazil", "Uruguay"],
  Bolivia: ["Peru", "Brazil", "Paraguay", "Argentina", "Chile"],
  Brazil: [
    "Uruguay",
    "Argentina",
    "Paraguay",
    "Bolivia",
    "Peru",
    "Colombia",
    "Venezuela",
    "Guyana",
    "Suriname",
    "French Guiana",
  ],
  Chile: ["Peru", "Bolivia", "Argentina"],
  Colombia: ["Panama", "Venezuela", "Brazil", "Peru", "Ecuador"],
  Ecuador: ["Colombia", "Peru"],
  "French Guiana": ["Brazil", "Suriname"],
  Guyana: ["Venezuela", "Brazil", "Suriname"],
  Paraguay: ["Bolivia", "Brazil", "Argentina"],
  Peru: ["Ecuador", "Colombia", "Brazil", "Bolivia", "Chile"],
  Suriname: ["Guyana", "Brazil", "French Guiana"],
  Uruguay: ["Brazil", "Argentina"],
  Venezuela: ["Colombia", "Brazil", "Guyana"],

  // ---------------------------------------------------------------------
  // OCEANIA
  // ---------------------------------------------------------------------
  Australia: [],
  Fiji: [],
  Kiribati: [],
  "Marshall Islands": [],
  Micronesia: [],
  Nauru: [],
  "New Zealand": [],
  Palau: [],
  "Papua New Guinea": ["Indonesia"],
  Samoa: [],
  "Solomon Islands": [],
  Tonga: [],
  Tuvalu: [],
  Vanuatu: [],
};
