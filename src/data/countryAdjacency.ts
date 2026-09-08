/**
 * Adjazenzliste aller Länder der Welt (Landgrenzen).
 *
 * Grundlage: gängige geografische Referenzdaten (u.a. CIA World Factbook
 * "Land boundaries", Natural Earth Admin-0 Grenzpolygone). Nur direkte
 * LANDGRENZEN sind enthalten — reine Seegrenzen (z.B. Dänemark/Schweden
 * über den Öresund, Spanien/Marokko über die Straße von Gibraltar
 * abseits von Ceuta/Melilla) zählen NICHT als Nachbarschaft.
 *
 * Umfang: alle 193 UN-Mitgliedsstaaten plus eine kleine Zahl weiterer,
 * in Geografie-/Ratespielen üblicher Gebiete, die eine eigene,
 * zusammenhängende Landmasse mit eigenen Grenzen haben: Kosovo, Taiwan,
 * Westsahara, Palästina und Französisch-Guayana. Kleinere Exklaven/
 * Überseegebiete ohne eigene Landgrenzen (z.B. Grönland, Puerto Rico,
 * Hongkong) sind bewusst NICHT als eigene Einträge aufgenommen, da sie
 * für das Pathfinding-Fundament nicht relevant sind.
 *
 * Sonderfälle / strittige Grenzen (Begründung der gewählten Version):
 *
 * - Russland/Kaliningrad: Kaliningrad ist eine russische Exklave zwischen
 *   Polen und Litauen. Da es politisch zu Russland gehört, zählen die
 *   Grenzen Kaliningrad–Polen und Kaliningrad–Litauen als Grenzen
 *   Russlands (macht Polen und Litauen zu direkten Nachbarn Russlands,
 *   zusätzlich zur "Hauptgrenze" weiter östlich). Damit hat Russland die
 *   bekannten 14 Nachbarn.
 * - Westsahara/Marokko: Marokko kontrolliert den Großteil der Westsahara
 *   de facto, das Gebiet ist völkerrechtlich aber nicht annektiert und
 *   wird hier als eigenständiges Gebiet mit Grenzen zu Marokko, Algerien
 *   und Mauretanien geführt (Referenzdaten wie Natural Earth führen es
 *   ebenfalls separat).
 * - Marokko/Spanien: Die spanischen Exklaven Ceuta und Melilla liegen auf
 *   dem afrikanischen Festland und grenzen an Marokko. Diese Landgrenze
 *   wird hier Spanien zugerechnet (Spanien ↔ Marokko sind damit direkte
 *   Nachbarn), obwohl das spanische Kernland selbst nicht an Marokko
 *   grenzt.
 * - Zypern: Wird als eine Insel ohne Landnachbarn geführt. Die Teilung in
 *   die Republik Zypern und die international (außer von der Türkei)
 *   nicht anerkannte "Türkische Republik Nordzypern" ändert daran nichts,
 *   da es sich um eine innerinsulare Grenze auf ein und derselben
 *   Landmasse handelt, nicht um eine Grenze zu einem anderen Staat.
 * - Israel/Palästina: Palästina (Gazastreifen + Westjordanland) wird als
 *   ein zusammenhängender Eintrag geführt mit Grenzen zu Israel, Ägypten
 *   (Gazastreifen/Rafah) und Jordanien (Westjordanland/Jordantal), obwohl
 *   Gazastreifen und Westjordanland geografisch nicht zusammenhängen.
 *   Für ein Länder-Ratespiel wird dies vereinfacht als eine Entität
 *   behandelt, analog zur Darstellung in vielen gängigen Länder-Datasets.
 * - Kosovo: Wird als eigenständiges Gebiet mit Grenzen zu Serbien,
 *   Montenegro, Albanien und Nordmazedonien geführt, obwohl die
 *   Unabhängigkeit von Serbien nicht anerkannt wird. Das entspricht der
 *   gängigen Praxis in Geografie-Datasets/-Spielen (inkl. travle.earth).
 * - Botswana/Sambia: Die beiden Länder berühren sich an einem sehr kurzen
 *   Vierländereck (Kazungula) von wenigen hundert Metern Länge. Dies wird
 *   in den meisten aktuellen geografischen Datasets als reale Landgrenze
 *   geführt und daher hier übernommen. Namibia/Simbabwe hingegen berühren
 *   sich an diesem Vierländereck NICHT (sie liegen sich nur diagonal
 *   gegenüber) und werden daher nicht als Nachbarn geführt.
 * - Indien/Afghanistan: Es gibt keine von Indien tatsächlich kontrollierte
 *   Grenze zu Afghanistan (die geografische Nähe besteht nur über das von
 *   Pakistan verwaltete Kaschmir). Beide Länder gelten hier daher NICHT
 *   als direkte Nachbarn, konsistent mit den meisten Standard-Datasets.
 * - Taiwan: Wird als eigenständiges Gebiet ohne Landnachbarn geführt
 *   (Insel), unabhängig vom politischen Status.
 */

export const countryAdjacency: Record<string, string[]> = {
  // ---------------------------------------------------------------------
  // EUROPA
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
  // ASIEN
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
  // AFRIKA
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
  // NORDAMERIKA
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
  // SÜDAMERIKA
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
  // OZEANIEN
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
