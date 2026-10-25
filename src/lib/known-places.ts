/**
 * Curated Lagos places for SEARCH SUGGESTIONS only.
 * Never snap GPS / reverse-geocode / map pins to these names only when
 * the user explicitly picks a suggestion or types a matching query.
 */

export type KnownPlace = {
  id: string;
  /** Primary map / session label (stays on the pin) */
  name: string;
  /** Street / locality line for subtitles */
  address: string;
  city: string;
  lat: number;
  lng: number;
  /**
   * Strings that should surface this place (company + address variants).
   * Matching is case-insensitive substring / token based.
   */
  aliases: string[];
};

/**
 * 1st Price Furniture Company
 * 31 Ikorodu Road, Thomas bus-stop, Ajegunle, Lagos
 * Coords: Ajegunle · Ikorodu Rd corridor (OSM Ajegunle landmarks).
 */
export const FIRST_PRICE_FURNITURE: KnownPlace = {
  id: "1st-price-furniture-company",
  name: "1st Price Furniture Company",
  address: "31 Ikorodu Road, Thomas bus-stop, Ajegunle, Lagos",
  city: "Lagos",
  lat: 6.60685,
  lng: 3.43065,
  aliases: [
    "1st price furniture company",
    "1st price furniture",
    "1st price",
    "first price furniture company",
    "first price furniture",
    "first price",
    "1stprice",
    "firstprice",
    "31 ikorodu road thomas bus-stop ajegunle lagos",
    "31 ikorodu road thomas bus stop ajegunle lagos",
    "31 ikorodu road, thomas bus-stop, ajegunle lagos",
    "31 ikorodu road, thomas bus stop, ajegunle, lagos",
    "31 ikorodu road, lagos nigeria",
    "31 ikorodu road lagos nigeria",
    "31 ikorodu road lagos",
    "31 ikorodu rd, ajegunle",
    "31 ikorodu rd ajegunle lagos",
    "31 ikorodu road ajegunle",
    "31 ikorodu road, ajegunle lagos",
    "thomas bus-stop ajegunle",
    "thomas bus stop ajegunle",
    "thomas bus-stop",
    "thomas bus stop",
  ],
};

/** All curated places (extend here for more Lagos POIs). */
export const KNOWN_PLACES: KnownPlace[] = [
  FIRST_PRICE_FURNITURE,
  // Lagos West / Alimosho / Badagry Axis
  {
    id: "akesan-lagos",
    name: "Akesan",
    address: "Akesan Bus Stop, LASU-Igando Road, Alimosho, Lagos",
    city: "Lagos",
    lat: 6.5512,
    lng: 3.2355,
    aliases: [
      "akesan",
      "akesan bus stop",
      "akesan lagos",
      "akesan alimosho",
      "lasu igando road akesan",
      "akesan market",
    ],
  },
  {
    id: "igando-alimosho-lagos",
    name: "Igando",
    address: "Igando Bus Stop / General Hospital, LASU-Iba Road, Alimosho, Lagos",
    city: "Lagos",
    lat: 6.5595,
    lng: 3.2427,
    aliases: [
      "igando",
      "igando bus stop",
      "igando lagos",
      "igando general hospital",
      "lasu iba road igando",
      "igando alimosho",
    ],
  },
  {
    id: "egbeda-akowonjo-lagos",
    name: "Egbeda",
    address: "Egbeda Bus Stop, Akowonjo Road, Alimosho, Lagos",
    city: "Lagos",
    lat: 6.6018,
    lng: 3.2922,
    aliases: [
      "egbeda",
      "egbeda bus stop",
      "egbeda alimosho",
      "akowonjo",
      "akowonjo roundabout",
      "shasha egbeda",
    ],
  },
  {
    id: "iyana-ipaja-lagos",
    name: "Iyana Ipaja",
    address: "Iyana Ipaja Bus Terminal, Abeokuta Expressway, Alimosho, Lagos",
    city: "Lagos",
    lat: 6.6138,
    lng: 3.2798,
    aliases: [
      "iyana ipaja",
      "iyana ipaja bus stop",
      "ipaja",
      "iyana ipaja roundabout",
      "alimosho ipaja",
    ],
  },
  {
    id: "ikotun-lagos",
    name: "Ikotun",
    address: "Ikotun Roundabout / Market, Alimosho, Lagos",
    city: "Lagos",
    lat: 6.5539,
    lng: 3.2676,
    aliases: [
      "ikotun",
      "ikotun roundabout",
      "ikotun bus stop",
      "ikotun market",
      "ikotun egbe",
      "synagogue ikotun",
    ],
  },
  {
    id: "idimu-lagos",
    name: "Idimu",
    address: "Council Bus Stop, Idimu Road, Alimosho, Lagos",
    city: "Lagos",
    lat: 6.5772,
    lng: 3.2741,
    aliases: ["idimu", "council bus stop idimu", "idimu roundabout", "idimu alimosho"],
  },
  {
    id: "lasu-ojo-lagos",
    name: "Lagos State University (LASU)",
    address: "Badagry Expressway, Ojo, Lagos",
    city: "Lagos",
    lat: 6.4674,
    lng: 3.1979,
    aliases: ["lasu", "lagos state university", "lasu ojo", "ojo lagos", "iba junction", "ojo badagry"],
  },
  {
    id: "festac-town-lagos",
    name: "Festac Town",
    address: "21 Road / 1st Avenue, Festac Town, Amuwo Odofin, Lagos",
    city: "Lagos",
    lat: 6.4682,
    lng: 3.2885,
    aliases: [
      "festac",
      "festac town",
      "festac 1st avenue",
      "festac 21 road",
      "amuwo odofin",
      "festac lagos",
      "mile 2 festac",
    ],
  },
  {
    id: "mile-2-lagos",
    name: "Mile 2",
    address: "Mile 2 Interchange, Badagry Expressway, Lagos",
    city: "Lagos",
    lat: 6.4698,
    lng: 3.3217,
    aliases: ["mile 2", "mile 2 bus stop", "mile 2 interchange", "mile 2 lagos", "amuwo"],
  },
  {
    id: "trade-fair-lagos",
    name: "Lagos International Trade Fair Complex",
    address: "Badagry Expressway, Ojo, Lagos",
    city: "Lagos",
    lat: 6.4632,
    lng: 3.2435,
    aliases: ["trade fair", "trade fair complex", "tradefair", "trade fair lagos", "badagry expressway"],
  },
  // Ikeja / Mainland Core / Commercial
  {
    id: "ikeja-allen-avenue",
    name: "Allen Avenue, Ikeja",
    address: "Allen Avenue, Ikeja, Lagos",
    city: "Lagos",
    lat: 6.6018,
    lng: 3.3515,
    aliases: ["allen avenue", "allen ave", "allen ikeja", "allen avenue ikeja", "ikeja allen"],
  },
  {
    id: "ikeja-computer-village",
    name: "Computer Village, Ikeja",
    address: "Otigba Street, Ikeja, Lagos",
    city: "Lagos",
    lat: 6.5937,
    lng: 3.3421,
    aliases: ["computer village", "computer village ikeja", "otigba street", "otigba ikeja", "ikeja computer village"],
  },
  {
    id: "ikeja-city-mall",
    name: "Ikeja City Mall (ICM)",
    address: "Obafemi Awolowo Way, Alausa, Ikeja, Lagos",
    city: "Lagos",
    lat: 6.6219,
    lng: 3.3562,
    aliases: ["ikeja city mall", "icm", "icm mall", "alausa secretariat", "alausa ikeja", "governor office alausa", "ikeja mall"],
  },
  {
    id: "murtala-muhammed-airport",
    name: "Murtala Muhammed Airport (MMIA/MMA2)",
    address: "Airport Road, Ikeja, Lagos",
    city: "Lagos",
    lat: 6.5774,
    lng: 3.3211,
    aliases: ["murtala muhammed airport", "mma2", "mmia", "lagos airport", "ikeja airport", "local airport lagos", "international airport lagos"],
  },
  {
    id: "maryland-mall-lagos",
    name: "Maryland Mall",
    address: "350-360 Ikorodu Road, Maryland, Lagos",
    city: "Lagos",
    lat: 6.5724,
    lng: 3.3672,
    aliases: ["maryland", "maryland mall", "maryland lagos", "maryland bus stop", "anthony village", "maryland tunnel"],
  },
  {
    id: "ojota-lagos",
    name: "Ojota Interchange",
    address: "Ojota Bus Stop, Ikorodu Road, Ojota, Lagos",
    city: "Lagos",
    lat: 6.5866,
    lng: 3.3854,
    aliases: ["ojota", "ojota bus stop", "ojota interchange", "ojota lagos", "ogudu", "ojota roundabout"],
  },
  {
    id: "oshodi-transport-interchange",
    name: "Oshodi Transport Interchange",
    address: "Agege Motor Road, Oshodi, Lagos",
    city: "Lagos",
    lat: 6.5542,
    lng: 3.3486,
    aliases: ["oshodi", "oshodi bus stop", "oshodi terminal", "oshodi interchange", "oshodi under bridge", "oshodi isolo"],
  },
  {
    id: "ojodu-berger-lagos",
    name: "Ojodu Berger",
    address: "Berger Bus Stop, Lagos-Ibadan Expressway, Lagos",
    city: "Lagos",
    lat: 6.6438,
    lng: 3.3742,
    aliases: ["berger", "ojodu berger", "berger bus stop", "ojodu", "berger toll gate", "berger lagos"],
  },
  {
    id: "magodo-phase-2-lagos",
    name: "Magodo Phase 2",
    address: "Shangisha / CMD Road, Kosofe, Lagos",
    city: "Lagos",
    lat: 6.6248,
    lng: 3.3828,
    aliases: ["magodo", "magodo phase 2", "magodo phase 1", "magodo shangisha", "cmd road", "magodo lagos"],
  },
  {
    id: "gbagada-lagos",
    name: "Gbagada Phase 2",
    address: "Gbagada Expressway, Kosofe, Lagos",
    city: "Lagos",
    lat: 6.5562,
    lng: 3.3879,
    aliases: ["gbagada", "gbagada phase 2", "gbagada phase 1", "charly boy bus stop", "anthony gbagada", "gbagada expressway"],
  },
  {
    id: "ikorodu-town-lagos",
    name: "Ikorodu Town Centre",
    address: "Ikorodu Garage Roundabout, Lagos Road, Ikorodu, Lagos",
    city: "Lagos",
    lat: 6.6194,
    lng: 3.5105,
    aliases: ["ikorodu", "ikorodu garage", "benson ikorodu", "ikorodu roundabout", "agric ikorodu", "ikorodu town"],
  },
  // Yaba & Surulere
  {
    id: "yaba-sabo-lagos",
    name: "Yaba (Sabo / Commercial Ave)",
    address: "Commercial Avenue, Sabo, Yaba, Lagos",
    city: "Lagos",
    lat: 6.5095,
    lng: 3.3711,
    aliases: ["yaba", "sabo yaba", "yaba tech", "commercial avenue yaba", "herbert macaulay yaba", "yaba bus stop", "tejuosho market"],
  },
  {
    id: "unilag-akoka-lagos",
    name: "University of Lagos (UNILAG)",
    address: "University Road, Akoka, Yaba, Lagos",
    city: "Lagos",
    lat: 6.5173,
    lng: 3.3986,
    aliases: ["unilag", "university of lagos", "akoka", "unilag gate", "akoka yaba", "unilag main campus"],
  },
  {
    id: "surulere-national-stadium",
    name: "National Stadium, Surulere",
    address: "Funsho Williams Avenue, Surulere, Lagos",
    city: "Lagos",
    lat: 6.4975,
    lng: 3.3638,
    aliases: ["surulere", "national stadium", "stadium surulere", "funsho williams avenue", "western avenue surulere", "surulere lagos"],
  },
  {
    id: "adeniran-ogunsanya-surulere",
    name: "Adeniran Ogunsanya, Surulere",
    address: "Adeniran Ogunsanya Street / Mall, Surulere, Lagos",
    city: "Lagos",
    lat: 6.4950,
    lng: 3.3533,
    aliases: ["adeniran ogunsanya", "adeniran ogunsanya shopping mall", "bode thomas surulere", "shitta surulere", "ojuelegba surulere"],
  },
  {
    id: "ojuelegba-surulere",
    name: "Ojuelegba Under Bridge",
    address: "Western Avenue / Tejuosho, Surulere, Lagos",
    city: "Lagos",
    lat: 6.5146,
    lng: 3.3619,
    aliases: ["ojuelegba", "ojuelegba under bridge", "ojuelegba bus stop", "ojuelegba lagos"],
  },
  // Island Axis
  {
    id: "lagos-island-cms-marina",
    name: "CMS / Marina, Lagos Island",
    address: "Marina, CMS Bus Stop, Lagos Island, Lagos",
    city: "Lagos",
    lat: 6.4531,
    lng: 3.3892,
    aliases: ["cms", "marina lagos", "lagos island", "broad street lagos", "cms bus stop", "balogun market", "marina cms"],
  },
  {
    id: "victoria-island-adeola-odeku",
    name: "Victoria Island (Adeola Odeku)",
    address: "Adeola Odeku Street, Victoria Island, Lagos",
    city: "Lagos",
    lat: 6.4308,
    lng: 3.4194,
    aliases: ["victoria island", "vi", "adeola odeku", "adetokunbo ademola", "vi lagos", "victoria island lagos", "ozumba mbadiwe"],
  },
  {
    id: "victoria-island-eko-hotel",
    name: "Eko Hotel & Suites, Victoria Island",
    address: "Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos",
    city: "Lagos",
    lat: 6.4267,
    lng: 3.4302,
    aliases: ["eko hotel", "eko hotel and suites", "eko hotels", "adetokunbo ademola vi", "kuramo vi"],
  },
  {
    id: "ikoyi-awolowo-road",
    name: "Ikoyi (Awolowo Road)",
    address: "Awolowo Road, Ikoyi, Lagos",
    city: "Lagos",
    lat: 6.4474,
    lng: 3.4358,
    aliases: ["ikoyi", "awolowo road ikoyi", "bourdillon ikoyi", "banana island", "falomo ikoyi", "falomo bridge", "ikoyi lagos"],
  },
  {
    id: "lekki-phase-1-admiralty",
    name: "Lekki Phase 1 (Admiralty Way)",
    address: "Admiralty Way, Lekki Phase 1, Eti-Osa, Lagos",
    city: "Lagos",
    lat: 6.4478,
    lng: 3.4723,
    aliases: ["lekki", "lekki phase 1", "admiralty way", "lekki toll gate", "lekki ikoyi bridge", "lekki lagos", "maruwa lekki"],
  },
  {
    id: "lekki-chevron-drive",
    name: "Chevron Drive, Lekki",
    address: "Chevron Drive, Lekki-Epe Expressway, Eti-Osa, Lagos",
    city: "Lagos",
    lat: 6.4352,
    lng: 3.5348,
    aliases: ["chevron", "chevron drive", "lekki conservation centre", "chevron toll gate", "jakande lekki", "chevron lekki"],
  },
  {
    id: "ajah-jubilee-bridge",
    name: "Ajah (Jubilee Bridge)",
    address: "Ajah Roundabout / Market, Lekki-Epe Expressway, Lagos",
    city: "Lagos",
    lat: 6.4673,
    lng: 3.5678,
    aliases: ["ajah", "ajah bridge", "ajah jubilee bridge", "ajah market", "ajah roundabout", "badore ajah", "addo road", "ajah lagos"],
  },
  {
    id: "sangotedo-novare-mall",
    name: "Sangotedo (Novare Mall)",
    address: "Novare Mall / Shoprite, Lekki-Epe Expressway, Sangotedo, Lagos",
    city: "Lagos",
    lat: 6.4746,
    lng: 3.6264,
    aliases: ["sangotedo", "novare mall", "shoprite sangotedo", "abijo", "sangotedo lagos", "novare mall sangotedo"],
  },
  {
    id: "epe-town-marina",
    name: "Epe Town Centre",
    address: "Marina Road, Epe, Lagos",
    city: "Lagos",
    lat: 6.5841,
    lng: 3.9834,
    aliases: ["epe", "epe marina", "epe roundabout", "epe lagos", "alaro city epe"],
  },
  // Key Nigerian Cities & State Capitals
  {
    id: "abuja-cbd",
    name: "Abuja Central Business District (CBD)",
    address: "Central Business District, Eagle Square, Abuja, FCT",
    city: "Abuja",
    lat: 9.0579,
    lng: 7.4951,
    aliases: ["abuja", "abuja cbd", "eagle square", "central area abuja", "fct abuja", "abuja central"],
  },
  {
    id: "abuja-wuse-2",
    name: "Wuse 2, Abuja",
    address: "Aminu Kano Crescent, Wuse 2, Abuja, FCT",
    city: "Abuja",
    lat: 9.0765,
    lng: 7.4723,
    aliases: ["wuse", "wuse 2", "aminu kano crescent", "wuse abuja", "wuse zone 2"],
  },
  {
    id: "abuja-maitama",
    name: "Maitama, Abuja",
    address: "Gana Street / Aguiyi Ironsi, Maitama, Abuja, FCT",
    city: "Abuja",
    lat: 9.0882,
    lng: 7.4988,
    aliases: ["maitama", "maitama abuja", "gana street", "transcorp hilton abuja"],
  },
  {
    id: "ibadan-bodija-oyo",
    name: "Ibadan (Bodija / Secretariat)",
    address: "Oyo State Secretariat, Bodija, Ibadan, Oyo State",
    city: "Ibadan",
    lat: 7.4243,
    lng: 3.9059,
    aliases: ["ibadan", "bodija ibadan", "dugbe ibadan", "ui ibadan", "secretariat ibadan", "oyo state", "iwo road ibadan"],
  },
  {
    id: "port-harcourt-gra-rivers",
    name: "Port Harcourt (Aba Road / GRA)",
    address: "Aba Road / Port Harcourt GRA, Port Harcourt, Rivers State",
    city: "Port Harcourt",
    lat: 4.8156,
    lng: 7.0498,
    aliases: ["port harcourt", "ph", "phc", "gra port harcourt", "aba road ph", "rivers state", "port harcourt rivers"],
  },
  {
    id: "benin-city-edo",
    name: "Benin City (Ring Road)",
    address: "King's Square / Ring Road, Benin City, Edo State",
    city: "Benin City",
    lat: 6.3350,
    lng: 5.6037,
    aliases: ["benin", "benin city", "ring road benin", "kings square benin", "edo state", "benin city edo"],
  },
  {
    id: "abeokuta-ogun",
    name: "Abeokuta (Oke-Mosan)",
    address: "Governor's Office, Oke-Mosan, Abeokuta, Ogun State",
    city: "Abeokuta",
    lat: 7.1557,
    lng: 3.3451,
    aliases: ["abeokuta", "oke mosan", "kuto abeokuta", "ogun state", "abeokuta ogun"],
  },
  {
    id: "kano-city",
    name: "Kano City (Sabon Gari)",
    address: "Bompai / Sabon Gari, Kano, Kano State",
    city: "Kano",
    lat: 12.0022,
    lng: 8.5920,
    aliases: ["kano", "kano city", "sabon gari kano", "bompai kano", "kano state"],
  },
  {
    id: "asaba-onitsha-delta",
    name: "Asaba (Niger Bridge Approach)",
    address: "Asaba-Onitsha Expressway, Asaba, Delta State",
    city: "Asaba",
    lat: 6.1985,
    lng: 6.7280,
    aliases: ["asaba", "onitsha", "niger bridge", "asaba delta", "delta state"],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Token set for loose matching (order-independent). */
function tokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 1);
}

/**
 * Score how well `query` matches a known place.
 * Higher = better. 0 = no match.
 */
export function scoreKnownPlace(query: string, place: KnownPlace): number {
  const q = normalize(query);
  if (!q || q.length < 2) return 0;

  const nameN = normalize(place.name);
  const addrN = normalize(place.address);

  // Exact / strong substring on name or full address
  if (nameN === q || addrN === q) return 100;
  if (nameN.startsWith(q) || q.startsWith(nameN)) return 95;
  if (nameN.includes(q)) return 90;
  if (addrN.includes(q) || q.includes(addrN)) return 88;

  // Alias exact / substring
  for (const a of place.aliases) {
    const an = normalize(a);
    if (an === q) return 92;
    if (an.startsWith(q) || q.startsWith(an)) return 86;
    if (an.includes(q) || q.includes(an)) return 80;
  }

  // Token overlap (e.g. "akesan bus stop", "allen ave ikeja", "furniture company ajegunle")
  const qTok = tokens(query);
  if (qTok.length === 0) return 0;
  const corpus = new Set([
    ...tokens(place.name),
    ...tokens(place.address),
    ...place.aliases.flatMap((a) => tokens(a)),
  ]);
  let hits = 0;
  for (const t of qTok) {
    if (corpus.has(t)) hits += 1;
    else {
      // partial token (e.g. "furnitur", "akesa")
      for (const c of corpus) {
        if (c.startsWith(t) || t.startsWith(c)) {
          hits += 0.6;
          break;
        }
      }
    }
  }
  const ratio = hits / qTok.length;
  if (ratio >= 0.75 && hits >= 2) return Math.round(50 + ratio * 30);
  if (ratio >= 0.55 && hits >= 2) return Math.round(35 + ratio * 25);

  // Single distinctive token matches
  if (qTok.length === 1) {
    const token = qTok[0];
    if (corpus.has(token)) return 65;
    for (const c of corpus) {
      if (c.startsWith(token) && token.length >= 3) return 55;
    }
  }

  return 0;
}

/** Ranked known-place matches for a typed query (best first). */
export function matchKnownPlaces(
  query: string,
  limit = 5,
): { place: KnownPlace; score: number }[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return KNOWN_PLACES.map((place) => ({
    place,
    score: scoreKnownPlace(q, place),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Best single known place, or null. */
export function resolveKnownPlace(query: string): KnownPlace | null {
  const hits = matchKnownPlaces(query, 1);
  if (!hits.length || hits[0].score < 35) return null;
  return hits[0].place;
}

/** Distance in metres (haversine). */
export function metresBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const la1 = toR(a.lat);
  const la2 = toR(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * @deprecated Do not use for GPS or reverse-geocode labels.
 * Curated places are search-suggestion only. Always returns null so callers
 * cannot accidentally overwrite a real street address with a POI name.
 */
export function knownPlaceNear(
  _lat: number,
  _lng: number,
  _radiusM = 120,
): KnownPlace | null {
  return null;
}

/** Map / session label for a known place (name stays on the pin). */
export function knownPlaceLabel(place: KnownPlace): string {
  return place.name;
}

export type KnownPlacePick = {
  lat: number;
  lng: number;
  label: string;
  city: string;
  area: string;
};

export function knownPlaceToPick(place: KnownPlace): KnownPlacePick {
  return {
    lat: place.lat,
    lng: place.lng,
    label: knownPlaceLabel(place),
    city: place.city,
    area: place.address,
  };
}
