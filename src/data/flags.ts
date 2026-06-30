/**
 * FIFA 3-letter code -> { name, ISO 3166-1 alpha-2 } lookup.
 * Flag emoji are derived from the alpha-2 code (regional indicator letters),
 * with a few special-cased emoji (Scotland, England, Wales, the FWC section).
 *
 * The authoritative list of sections comes from the user's CSV import; this table
 * only supplies display name + flag for known codes. Unknown codes fall back to
 * the code itself + a neutral flag, and can still be tracked normally.
 */

type Entry = { name: string; iso2?: string; emoji?: string };

const TABLE: Record<string, Entry> = {
  // Special non-country section(s)
  FWC: { name: "FIFA World Cup", emoji: "🏆" },

  // Codes seen in the user's album + common FIFA participants.
  MEX: { name: "Mexico", iso2: "MX" },
  RSA: { name: "South Africa", iso2: "ZA" },
  KOR: { name: "South Korea", iso2: "KR" },
  PRK: { name: "North Korea", iso2: "KP" },
  CZE: { name: "Czechia", iso2: "CZ" },
  CAN: { name: "Canada", iso2: "CA" },
  BIH: { name: "Bosnia & Herzegovina", iso2: "BA" },
  QAT: { name: "Qatar", iso2: "QA" },
  SUI: { name: "Switzerland", iso2: "CH" },
  BRA: { name: "Brazil", iso2: "BR" },
  MAR: { name: "Morocco", iso2: "MA" },
  HAI: { name: "Haiti", iso2: "HT" },
  SCO: { name: "Scotland", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { name: "United States", iso2: "US" },
  PAR: { name: "Paraguay", iso2: "PY" },
  AUS: { name: "Australia", iso2: "AU" },
  TUR: { name: "Türkiye", iso2: "TR" },
  GER: { name: "Germany", iso2: "DE" },
  CUW: { name: "Curaçao", iso2: "CW" },
  CIV: { name: "Côte d'Ivoire", iso2: "CI" },
  ECU: { name: "Ecuador", iso2: "EC" },
  NED: { name: "Netherlands", iso2: "NL" },
  JPN: { name: "Japan", iso2: "JP" },
  SWE: { name: "Sweden", iso2: "SE" },
  TUN: { name: "Tunisia", iso2: "TN" },
  BEL: { name: "Belgium", iso2: "BE" },
  EGY: { name: "Egypt", iso2: "EG" },
  IRN: { name: "Iran", iso2: "IR" },
  NZL: { name: "New Zealand", iso2: "NZ" },
  ESP: { name: "Spain", iso2: "ES" },
  CPV: { name: "Cape Verde", iso2: "CV" },

  ARG: { name: "Argentina", iso2: "AR" },
  FRA: { name: "France", iso2: "FR" },
  ENG: { name: "England", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  WAL: { name: "Wales", emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  NIR: { name: "Northern Ireland", iso2: "GB" },
  IRL: { name: "Ireland", iso2: "IE" },
  POR: { name: "Portugal", iso2: "PT" },
  ITA: { name: "Italy", iso2: "IT" },
  CRO: { name: "Croatia", iso2: "HR" },
  SRB: { name: "Serbia", iso2: "RS" },
  POL: { name: "Poland", iso2: "PL" },
  DEN: { name: "Denmark", iso2: "DK" },
  NOR: { name: "Norway", iso2: "NO" },
  AUT: { name: "Austria", iso2: "AT" },
  UKR: { name: "Ukraine", iso2: "UA" },
  WALES: { name: "Wales", emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  SVN: { name: "Slovenia", iso2: "SI" },
  SVK: { name: "Slovakia", iso2: "SK" },
  HUN: { name: "Hungary", iso2: "HU" },
  GRE: { name: "Greece", iso2: "GR" },
  ROU: { name: "Romania", iso2: "RO" },
  RUS: { name: "Russia", iso2: "RU" },

  URU: { name: "Uruguay", iso2: "UY" },
  COL: { name: "Colombia", iso2: "CO" },
  CHI: { name: "Chile", iso2: "CL" },
  PER: { name: "Peru", iso2: "PE" },
  VEN: { name: "Venezuela", iso2: "VE" },
  BOL: { name: "Bolivia", iso2: "BO" },
  CRC: { name: "Costa Rica", iso2: "CR" },
  PAN: { name: "Panama", iso2: "PA" },
  HON: { name: "Honduras", iso2: "HN" },
  JAM: { name: "Jamaica", iso2: "JM" },
  SLV: { name: "El Salvador", iso2: "SV" },
  GUA: { name: "Guatemala", iso2: "GT" },
  HAÍ: { name: "Haiti", iso2: "HT" },

  SEN: { name: "Senegal", iso2: "SN" },
  GHA: { name: "Ghana", iso2: "GH" },
  NGA: { name: "Nigeria", iso2: "NG" },
  CMR: { name: "Cameroon", iso2: "CM" },
  ALG: { name: "Algeria", iso2: "DZ" },
  MLI: { name: "Mali", iso2: "ML" },
  COD: { name: "DR Congo", iso2: "CD" },
  ANG: { name: "Angola", iso2: "AO" },
  ZAM: { name: "Zambia", iso2: "ZM" },
  GAB: { name: "Gabon", iso2: "GA" },
  GUI: { name: "Guinea", iso2: "GN" },
  BFA: { name: "Burkina Faso", iso2: "BF" },

  KSA: { name: "Saudi Arabia", iso2: "SA" },
  UAE: { name: "United Arab Emirates", iso2: "AE" },
  IRQ: { name: "Iraq", iso2: "IQ" },
  JOR: { name: "Jordan", iso2: "JO" },
  UZB: { name: "Uzbekistan", iso2: "UZ" },
  CHN: { name: "China", iso2: "CN" },
  THA: { name: "Thailand", iso2: "TH" },
  VIE: { name: "Vietnam", iso2: "VN" },
  IDN: { name: "Indonesia", iso2: "ID" },
  IND: { name: "India", iso2: "IN" },
  OMA: { name: "Oman", iso2: "OM" },
  BHR: { name: "Bahrain", iso2: "BH" },
  PLE: { name: "Palestine", iso2: "PS" },
  LBN: { name: "Lebanon", iso2: "LB" },
  SYR: { name: "Syria", iso2: "SY" },
};

/** Convert an ISO 3166-1 alpha-2 code to its flag emoji. */
function iso2ToEmoji(iso2: string): string {
  const base = 0x1f1e6;
  const cc = iso2.toUpperCase();
  if (cc.length !== 2) return "🏳️";
  return String.fromCodePoint(
    base + (cc.charCodeAt(0) - 65),
    base + (cc.charCodeAt(1) - 65),
  );
}

export function flagFor(code: string): string {
  const e = TABLE[code.toUpperCase()];
  if (!e) return "🏳️";
  if (e.emoji) return e.emoji;
  if (e.iso2) return iso2ToEmoji(e.iso2);
  return "🏳️";
}

export function nameFor(code: string): string {
  return TABLE[code.toUpperCase()]?.name ?? code.toUpperCase();
}
