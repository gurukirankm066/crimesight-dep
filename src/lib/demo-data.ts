/**
 * CrimeSight AI v2 — Demo Data Module
 * Provides realistic Karnataka crime data when the Supabase database is unreachable.
 * All data is generated using a seeded PRNG (seed=42) for reproducibility.
 *
 * Exported constants:
 *   DEMO_DISTRICTS      — 31 Karnataka districts
 *   DEMO_CRIME_TYPES    — 21 IPC / special crime types
 *   DEMO_CASES          — 147 FIR cases (17 narrative + 130 PRNG-generated)
 *   DEMO_OFFICERS       — 25 KSP officers
 *   DEMO_ARRESTS        — 37 arrest records (3 narrative + 34 PRNG-generated)
 *   DEMO_CHARGESHEETS   — 28 chargesheet filings
 *   DEMO_SUSPECTS       — 71 named suspects (15 narrative + 56 PRNG-generated)
 *   DEMO_NARRATIVE_ARCS — 3 investigation story arcs
 *
 * Exported helpers:
 *   getDemoDistrictName(rowid)   — resolve district ROWID → name
 *   getDemoCrimeTypeName(rowid)  — resolve crime-type ROWID → name
 */

// ═══════════════════════════════════════════════════════════════════════
// SEEDED PRNG (Lehmer / Park-Miller, seed = 42)
// ═══════════════════════════════════════════════════════════════════════

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function weightedPick<T extends { w: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.w, 0)
  let r = rand() * total
  for (const item of items) {
    r -= item.w
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

// ═══════════════════════════════════════════════════════════════════════
// 1. DISTRICTS — All 31 Karnataka districts
// ═══════════════════════════════════════════════════════════════════════

export interface DemoDistrict {
  ROWID: string
  district_name: string
  district_code: string
  latitude: string
  longitude: string
}

export const DEMO_DISTRICTS: DemoDistrict[] = [
  { ROWID: 'd-bengaluru-urban', district_name: 'Bengaluru Urban', district_code: 'BLR-U', latitude: '12.9716', longitude: '77.5946' },
  { ROWID: 'd-bengaluru-rural', district_name: 'Bengaluru Rural', district_code: 'BLR-R', latitude: '13.0242', longitude: '77.5713' },
  { ROWID: 'd-mysuru', district_name: 'Mysuru', district_code: 'MYS', latitude: '12.2958', longitude: '76.6394' },
  { ROWID: 'd-belagavi', district_name: 'Belagavi', district_code: 'BLG', latitude: '15.8515', longitude: '74.4977' },
  { ROWID: 'd-dharwad', district_name: 'Dharwad', district_code: 'DHW', latitude: '15.3916', longitude: '75.0230' },
  { ROWID: 'd-dakshina-kannada', district_name: 'Dakshina Kannada', district_code: 'DK', latitude: '12.9141', longitude: '74.8560' },
  { ROWID: 'd-ballari', district_name: 'Ballari', district_code: 'BLL', latitude: '15.1394', longitude: '76.9210' },
  { ROWID: 'd-kalaburagi', district_name: 'Kalaburagi', district_code: 'KLB', latitude: '17.3297', longitude: '76.8343' },
  { ROWID: 'd-davanagere', district_name: 'Davanagere', district_code: 'DVG', latitude: '14.4634', longitude: '75.9242' },
  { ROWID: 'd-raichur', district_name: 'Raichur', district_code: 'RCR', latitude: '16.2076', longitude: '77.3463' },
  { ROWID: 'd-shivamogga', district_name: 'Shivamogga', district_code: 'SHM', latitude: '13.9282', longitude: '75.6424' },
  { ROWID: 'd-tumakuru', district_name: 'Tumakuru', district_code: 'TKR', latitude: '13.3400', longitude: '77.1050' },
  { ROWID: 'd-chitradurga', district_name: 'Chitradurga', district_code: 'CTD', latitude: '14.2284', longitude: '76.3986' },
  { ROWID: 'd-mandya', district_name: 'Mandya', district_code: 'MDY', latitude: '12.5223', longitude: '76.8953' },
  { ROWID: 'd-hassan', district_name: 'Hassan', district_code: 'HSN', latitude: '13.0072', longitude: '76.1003' },
  { ROWID: 'd-udupi', district_name: 'Udupi', district_code: 'UDP', latitude: '13.3409', longitude: '74.7420' },
  { ROWID: 'd-chikkamagaluru', district_name: 'Chikkamagaluru', district_code: 'CMG', latitude: '13.3187', longitude: '75.7737' },
  { ROWID: 'd-kodagu', district_name: 'Kodagu', district_code: 'KDG', latitude: '12.3375', longitude: '75.8069' },
  { ROWID: 'd-bidar', district_name: 'Bidar', district_code: 'BDR', latitude: '17.9104', longitude: '77.5199' },
  { ROWID: 'd-vijayapura', district_name: 'Vijayapura', district_code: 'VJP', latitude: '16.8302', longitude: '75.7100' },
  { ROWID: 'd-gadag', district_name: 'Gadag', district_code: 'GDG', latitude: '15.4359', longitude: '75.6100' },
  { ROWID: 'd-haveri', district_name: 'Haveri', district_code: 'HVR', latitude: '14.7950', longitude: '75.4000' },
  { ROWID: 'd-koppal', district_name: 'Koppal', district_code: 'KPL', latitude: '15.3511', longitude: '76.1566' },
  { ROWID: 'd-bagalkot', district_name: 'Bagalkot', district_code: 'BGR', latitude: '16.1856', longitude: '75.6911' },
  { ROWID: 'd-chamarajanagar', district_name: 'Chamarajanagar', district_code: 'CNR', latitude: '11.9222', longitude: '76.9396' },
  { ROWID: 'd-kolar', district_name: 'Kolar', district_code: 'KLR', latitude: '13.1367', longitude: '78.1291' },
  { ROWID: 'd-ramanagara', district_name: 'Ramanagara', district_code: 'RNG', latitude: '12.7188', longitude: '77.2562' },
  { ROWID: 'd-uttara-kannada', district_name: 'Uttara Kannada', district_code: 'UK', latitude: '14.5451', longitude: '74.4925' },
  { ROWID: 'd-yadgir', district_name: 'Yadgir', district_code: 'YDR', latitude: '16.7700', longitude: '77.1300' },
  { ROWID: 'd-chikballapur', district_name: 'Chikballapur', district_code: 'CBP', latitude: '13.4342', longitude: '77.7269' },
  { ROWID: 'd-vijayanagara', district_name: 'Vijayanagara', district_code: 'VJN', latitude: '15.1833', longitude: '76.3975' },
]

// ═══════════════════════════════════════════════════════════════════════
// 2. CRIME TYPES — 21 types
// ═══════════════════════════════════════════════════════════════════════

export interface DemoCrimeType {
  ROWID: string
  crime_type_name: string
  crime_type_code: string
}

export const DEMO_CRIME_TYPES: DemoCrimeType[] = [
  { ROWID: 'ct-theft', crime_type_name: 'Theft', crime_type_code: 'THF' },
  { ROWID: 'ct-burglary', crime_type_name: 'Burglary', crime_type_code: 'BRG' },
  { ROWID: 'ct-robbery', crime_type_name: 'Robbery', crime_type_code: 'RBB' },
  { ROWID: 'ct-murder', crime_type_name: 'Murder', crime_type_code: 'MUR' },
  { ROWID: 'ct-attempt-murder', crime_type_name: 'Attempt to Murder', crime_type_code: 'ATM' },
  { ROWID: 'ct-rape', crime_type_name: 'Rape', crime_type_code: 'RAP' },
  { ROWID: 'ct-kidnapping', crime_type_name: 'Kidnapping', crime_type_code: 'KDN' },
  { ROWID: 'ct-cheating', crime_type_name: 'Cheating', crime_type_code: 'CHT' },
  { ROWID: 'ct-fraud', crime_type_name: 'Fraud', crime_type_code: 'FRD' },
  { ROWID: 'ct-cyber-crime', crime_type_name: 'Cyber Crime', crime_type_code: 'CYB' },
  { ROWID: 'ct-vehicle-theft', crime_type_name: 'Vehicle Theft', crime_type_code: 'VTH' },
  { ROWID: 'ct-chain-snatching', crime_type_name: 'Chain Snatching', crime_type_code: 'CSN' },
  { ROWID: 'ct-assault', crime_type_name: 'Assault', crime_type_code: 'ASL' },
  { ROWID: 'ct-narcotics', crime_type_name: 'Narcotics', crime_type_code: 'NRC' },
  { ROWID: 'ct-arms-act', crime_type_name: 'Arms Act', crime_type_code: 'ARM' },
  { ROWID: 'ct-rioting', crime_type_name: 'Rioting', crime_type_code: 'RIO' },
  { ROWID: 'ct-dowry-death', crime_type_name: 'Dowry Death', crime_type_code: 'DWD' },
  { ROWID: 'ct-human-trafficking', crime_type_name: 'Human Trafficking', crime_type_code: 'HTF' },
  { ROWID: 'ct-excise', crime_type_name: 'Excise', crime_type_code: 'EXC' },
  { ROWID: 'ct-road-accident', crime_type_name: 'Road Accident', crime_type_code: 'RAC' },
  { ROWID: 'ct-others', crime_type_name: 'Others', crime_type_code: 'OTH' },
]

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function buildDistrictMap(): Map<string, DemoDistrict> {
  const m = new Map<string, DemoDistrict>()
  for (const d of DEMO_DISTRICTS) m.set(d.ROWID, d)
  return m
}

function buildCrimeTypeMap(): Map<string, DemoCrimeType> {
  const m = new Map<string, DemoCrimeType>()
  for (const c of DEMO_CRIME_TYPES) m.set(c.ROWID, c)
  return m
}

// Lazy-cached maps (built once on first access)
let _districtMap: Map<string, DemoDistrict> | null = null
let _crimeTypeMap: Map<string, DemoCrimeType> | null = null

function getDistrictMap(): Map<string, DemoDistrict> {
  if (!_districtMap) _districtMap = buildDistrictMap()
  return _districtMap
}

function getCrimeTypeMap(): Map<string, DemoCrimeType> {
  if (!_crimeTypeMap) _crimeTypeMap = buildCrimeTypeMap()
  return _crimeTypeMap
}

export function getDemoDistrictName(rowid: string): string {
  return getDistrictMap().get(rowid)?.district_name ?? 'Unknown'
}

export function getDemoCrimeTypeName(rowid: string): string {
  return getCrimeTypeMap().get(rowid)?.crime_type_name ?? 'Unknown'
}

// ═══════════════════════════════════════════════════════════════════════
// 3. CASES — 147 FIRs (17 narrative + 130 PRNG-generated)
// ═══════════════════════════════════════════════════════════════════════

// ── Weight tables ──

const CRIME_WEIGHTS = [
  { type: 'ct-theft', w: 20 },
  { type: 'ct-burglary', w: 15 },
  { type: 'ct-robbery', w: 8 },
  { type: 'ct-vehicle-theft', w: 14 },
  { type: 'ct-chain-snatching', w: 7 },
  { type: 'ct-assault', w: 8 },
  { type: 'ct-cheating', w: 10 },
  { type: 'ct-fraud', w: 6 },
  { type: 'ct-cyber-crime', w: 9 },
  { type: 'ct-narcotics', w: 4 },
  { type: 'ct-rioting', w: 3 },
  { type: 'ct-excise', w: 5 },
  { type: 'ct-road-accident', w: 6 },
  { type: 'ct-murder', w: 2 },
  { type: 'ct-attempt-murder', w: 2 },
  { type: 'ct-rape', w: 2 },
  { type: 'ct-kidnapping', w: 2 },
  { type: 'ct-arms-act', w: 2 },
  { type: 'ct-dowry-death', w: 1 },
  { type: 'ct-human-trafficking', w: 1 },
  { type: 'ct-others', w: 5 },
]

const STATUS_WEIGHTS = [
  { status: 'Under Investigation', w: 40 },
  { status: 'Closed', w: 25 },
  { status: 'Charge Sheet Filed', w: 15 },
  { status: 'Open', w: 15 },
  { status: 'Transfer Pending', w: 5 },
]

const PRIORITY_WEIGHTS = [
  { priority: 'Low' as const, w: 35 },
  { priority: 'Medium' as const, w: 35 },
  { priority: 'High' as const, w: 20 },
  { priority: 'Critical' as const, w: 10 },
]

// Bengaluru Urban ≈25 %, Mysuru ≈8 %, rest distributed
const DISTRICT_WEIGHTS = [
  { dist: 'd-bengaluru-urban', w: 25 },
  { dist: 'd-mysuru', w: 8 },
  { dist: 'd-belagavi', w: 5 },
  { dist: 'd-dharwad', w: 5 },
  { dist: 'd-dakshina-kannada', w: 5 },
  { dist: 'd-tumakuru', w: 4 },
  { dist: 'd-ballari', w: 4 },
  { dist: 'd-kalaburagi', w: 4 },
  { dist: 'd-davanagere', w: 3 },
  { dist: 'd-shivamogga', w: 3 },
  { dist: 'd-kolar', w: 3 },
  { dist: 'd-bengaluru-rural', w: 3 },
  { dist: 'd-mandya', w: 2 },
  { dist: 'd-hassan', w: 2 },
  { dist: 'd-udupi', w: 2 },
  { dist: 'd-chikkamagaluru', w: 2 },
  { dist: 'd-chitradurga', w: 2 },
  { dist: 'd-raichur', w: 2 },
  { dist: 'd-bidar', w: 2 },
  { dist: 'd-vijayapura', w: 2 },
  { dist: 'd-vijayanagara', w: 2 },
  { dist: 'd-gadag', w: 1 },
  { dist: 'd-haveri', w: 1 },
  { dist: 'd-koppal', w: 1 },
  { dist: 'd-bagalkot', w: 1 },
  { dist: 'd-chamarajanagar', w: 1 },
  { dist: 'd-ramanagara', w: 1 },
  { dist: 'd-uttara-kannada', w: 1 },
  { dist: 'd-yadgir', w: 1 },
  { dist: 'd-chikballapur', w: 1 },
  { dist: 'd-kodagu', w: 1 },
]

// ── Realistic place names ──

const PLACES_BENGALURU = [
  'Koramangala 4th Block', 'Indiranagar 100 Feet Road', 'Whitefield ITPL Road',
  'Electronic City Phase 1', 'MG Road Metro Station', 'Jayanagar 4th Block',
  'Basavanagudi Bull Temple Road', 'Rajajinagar 1st Block', 'Yelahanka New Town',
  'HSR Layout Sector 2', 'BTM Layout 2nd Stage', 'Marathahalli Bridge',
  'Hebbal Ring Road Junction', 'JP Nagar 7th Phase', 'Bannerghatta Road',
  'Hosakerehalli Cross', 'Malleshwaram 18th Cross', 'Peenya Industrial Area',
  'KR Puram Railway Crossing', 'Banashankari 3rd Stage',
]

const PLACES_MYSURU = [
  'Mysore Palace North Gate', 'Gokulam 3rd Stage', 'Saraswathipuram',
  'Vidyaranyapuram', 'JLB Road', 'Hunsur Road Junction',
  'Nazarbad Mohalla', 'Kuvempunagar', 'Lalitha Mahal Road', 'Siddhartha Layout',
]

const PLACES_GENERIC = [
  'Main Road', 'Bus Stand Area', 'Railway Station Road', 'Market Area',
  'District Hospital Road', 'College Circle', 'Taluk Office Road',
  'Civil Station', 'NH-4 Highway', 'Town Center', 'Industrial Area',
  'Lake Road', 'Temple Street', 'Post Office Road', 'Station Road',
]

const COMPLAINT_MODES = ['Online', 'Written', 'Phone', 'In-Person']

// ── AI analysis summaries (realistic, varied) ──

const AI_SUMMARIES: string[] = [
  'Pattern matches recent thefts in neighboring districts. Recommend cross-referencing with vehicle theft database for possible linkages.',
  'Suspect identified through CCTV footage analysis. Facial recognition returned 87% confidence match with known offender database.',
  'Multiple similar complaints in 5 km radius over the past 30 days. Possible organized crime ring operating in the area.',
  'Victim is a repeat complainant. Check for pattern of targeted harassment or intimidation. Previous complaints: 2.',
  'Case shares modus operandi with 3 other unsolved cases in adjacent police station limits. Recommend joint investigation task force.',
  'High-risk area identified. Previous 3 incidents occurred during evening hours (18:00–22:00). Increased patrol recommended.',
  'Cyber forensics team can assist with digital evidence recovery. Device seized contains potential encrypted data.',
  'Location near school zone. Recommend increased patrol during school hours. Coordinate with school administration for CCTV access.',
  'Suspect vehicle identified through ANPR — white Maruti Swift, KA-01-MX-1234. Coordinate with RTO for ownership details.',
  'Financial trail suggests organized fraud operation spanning multiple districts. Bank records show ₹12.4 lakh in suspicious transfers.',
  'Repeat offender pattern detected. Suspect has 2 prior arrests in the same district within 18 months. High recidivism risk.',
  'Area has seen 40% increase in similar crimes quarter-over-quarter. Deploy additional night patrol and install temporary surveillance.',
  'Evidence matches cold case #2024/0342 from Mysuru district. Potential breakthrough in unsolved case from 14 months ago.',
  'Victim and suspect known to each other. Preliminary investigation suggests dispute over property/land as primary motive.',
  'Night-time incident in poorly lit area. Check streetlight outage reports from BBMP and identify CCTV coverage gaps for remediation.',
  'Geospatial analysis indicates crimes cluster around 3 transit hubs. Recommend targeted deployment at Majestic, Shivajinagar, and KR Market.',
  'Intercepted communications suggest planning of additional incidents. Recommend immediate surveillance on identified locations.',
  'AI predictive model flags this area as "Very High Risk" for the next 72 hours. Historical accuracy of model: 78%.',
  'Suspect uses multiple SIM cards registered under different names. Coordinate with telecom providers for call detail records.',
  'Cross-district intelligence sharing reveals 5 connected cases. Possible interstate gang involvement — coordinate with Goa and Maharashtra police.',
  'Forensic evidence (fingerprints) returned positive match from AFIS database. Match confidence: 94.2%.',
  'Victim\'s phone last pinged near Hebbal flyover at 21:30 hrs. Request tower dump from nearby cell sites for movement reconstruction.',
  'Cash transaction records from local jewelers show suspicious purchases. Money laundering angle cannot be ruled out.',
  'Witness statements contradict CCTV timeline. Recommend re-interviewing key witnesses under Section 161 CrPC.',
  'Social media analysis shows suspect was in contact with 3 other known offenders. Digital trail preserved for prosecution.',
  'Hotspot analysis: 3 thefts in the same apartment complex within 45 days. Security audit of the premises recommended.',
  'Suspect fled towards Tamil Nadu border. Alert issued to Krishnagiri and Dharmapuri district police. Check post alerted.',
  'Drug seizure analysis indicates supply chain from coastal Karnataka. Narcotics cell to coordinate with Mangaluru CP office.',
  'Arms recovered are factory-marked. Tracing origin through Ordinance Factory records. Preliminary match: 7.62 mm batch AF-2024-0891.',
  'Community tension rising following incident. Situation monitoring through local intelligence network. Quick response team on standby.',
]

// ── Date generation helpers ──

function genDatetime(monthsAgo: number): string {
  const base = new Date()
  base.setMonth(base.getMonth() - monthsAgo)
  base.setDate(Math.floor(rand() * 28) + 1)
  base.setHours(Math.floor(rand() * 24), Math.floor(rand() * 60), Math.floor(rand() * 60))
  return base.toISOString().replace('T', ' ').substring(0, 19)
}

/** Pure date computation (no rand() calls) for narrative cases */
function narrativeDate(monthsAgo: number, day: number, hour: number, minute: number = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  d.setDate(Math.min(day, 28))
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

/** Pure date computation using days ago instead of months */
function daysBeforeNow(days: number, hour: number, minute: number = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

function genPlace(districtRowid: string): string {
  if (districtRowid === 'd-bengaluru-urban') return pick(PLACES_BENGALURU) + ', Bengaluru'
  if (districtRowid === 'd-mysuru') return pick(PLACES_MYSURU) + ', Mysuru'
  const dName = getDistrictMap().get(districtRowid)?.district_name ?? 'Unknown'
  return pick(PLACES_GENERIC) + ', ' + dName
}

// ── Sensitive / high-severity crime type ROWIDs ──

const SENSITIVE_CRIMES = new Set([
  'ct-murder', 'ct-rape', 'ct-attempt-murder', 'ct-kidnapping',
  'ct-dowry-death', 'ct-human-trafficking',
])

// ── DemoCase interface ──

export interface DemoCase {
  ROWID: string
  fir_number: string
  crime_type_rowid: string
  district_rowid: string
  occurrence_datetime: string
  complaint_datetime: string
  latitude: string
  longitude: string
  place_of_occurrence: string
  complaint_mode: string
  case_priority: string
  case_status: string
  ai_risk_score: number
  ai_summary: string
  is_sensitive: boolean
}

// ═══════════════════════════════════════════════════════════════════════
// 3a. NARRATIVE ARC CASES — 17 hardcoded cases
// ═══════════════════════════════════════════════════════════════════════

const NARRATIVE_CASES: DemoCase[] = [
  // ── ARC 1: Operation Black Lotus (6 cases) ──
  {
    ROWID: 'case-0001',
    fir_number: 'FIR/2025/KSP/0147',
    crime_type_rowid: 'ct-narcotics',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(2, 12, 16, 30),
    complaint_datetime: narrativeDate(2, 13, 10, 0),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Basavanagudi Bull Temple Road, Bengaluru',
    complaint_mode: 'In-Person',
    case_priority: 'Critical',
    case_status: 'Under Investigation',
    ai_risk_score: 88,
    ai_summary: 'Intercepted communications indicate narcotics supply chain originating from coastal Karnataka. Three suspects identified through surveillance — Ravi Shetty (absconding), Imtiaz Ahmed (absconding), and Pradeep Gowda (arrested). ₹47.2 lakh in cash and 2.3 kg ganja seized from Pradeep\'s residence in Jayanagar. Case linked to FIR/2025/KSP/0148 and FIR/2025/KSP/0149 — same modus operandi, common phone numbers.',
    is_sensitive: true,
  },
  {
    ROWID: 'case-0002',
    fir_number: 'FIR/2025/KSP/0148',
    crime_type_rowid: 'ct-narcotics',
    district_rowid: 'd-mysuru',
    occurrence_datetime: narrativeDate(3, 5, 22, 15),
    complaint_datetime: narrativeDate(3, 6, 9, 0),
    latitude: '12.2958',
    longitude: '76.6394',
    place_of_occurrence: 'Nazarbad Mohalla, Mysuru',
    complaint_mode: 'Phone',
    case_priority: 'High',
    case_status: 'Under Investigation',
    ai_risk_score: 76,
    ai_summary: 'Surveillance operation by Mysuru City Police confirmed receipt of narcotics consignment from Bengaluru. Vehicle KA-05-MJ-7821 (white Tata Ace) intercepted. Driver Imtiaz Ahmed fled on foot. Forensic analysis of recovered substance pending at FSL Mysuru.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0003',
    fir_number: 'FIR/2025/KSP/0149',
    crime_type_rowid: 'ct-arms-act',
    district_rowid: 'd-dakshina-kannada',
    occurrence_datetime: narrativeDate(1, 20, 3, 45),
    complaint_datetime: narrativeDate(1, 20, 8, 0),
    latitude: '12.9141',
    longitude: '74.8560',
    place_of_occurrence: 'NH-66 Highway, Surathkal, Mangaluru',
    complaint_mode: 'Written',
    case_priority: 'Critical',
    case_status: 'Open',
    ai_risk_score: 91,
    ai_summary: 'Arms seizure during routine vehicle check at Surathkal check post. Two country-made pistols and 12 live rounds recovered from a vehicle matching description from Bengaluru surveillance. Driver fled towards Udupi district. Arms are factory-marked — Ordinance Factory batch AF-2024-0891. Possible nexus with narcotics network.',
    is_sensitive: true,
  },
  {
    ROWID: 'case-0004',
    fir_number: 'FIR/2025/KSP/0150',
    crime_type_rowid: 'ct-fraud',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(4, 8, 11, 0),
    complaint_datetime: narrativeDate(4, 10, 14, 30),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Electronic City Phase 1, Bengaluru',
    complaint_mode: 'Online',
    case_priority: 'High',
    case_status: 'Charge Sheet Filed',
    ai_risk_score: 64,
    ai_summary: 'Financial trail reveals ₹3.8 crore in suspicious transactions through shell companies. Bank records show payments routed through 14 accounts before conversion to cryptocurrency. Principal accused Ravi Shetty operated through front entities. Case chargesheeted under IPC 420 r/w 34 and IT Act Section 66D.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0005',
    fir_number: 'FIR/2025/KSP/0151',
    crime_type_rowid: 'ct-cyber-crime',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(2, 18, 9, 0),
    complaint_datetime: narrativeDate(2, 19, 16, 0),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Indiranagar 100 Feet Road, Bengaluru',
    complaint_mode: 'Online',
    case_priority: 'Medium',
    case_status: 'Under Investigation',
    ai_risk_score: 58,
    ai_summary: 'Phishing operation targeting senior citizens. Fake \'KSP Payment Portal\' website hosted on offshore servers. Digital forensics team recovered server logs showing 340+ victims. Two IP addresses traced to Mysuru — coordinate with Mysuru City Cyber Cell.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0006',
    fir_number: 'FIR/2025/KSP/0152',
    crime_type_rowid: 'ct-narcotics',
    district_rowid: 'd-mysuru',
    occurrence_datetime: narrativeDate(5, 22, 19, 30),
    complaint_datetime: narrativeDate(5, 23, 8, 0),
    latitude: '12.2958',
    longitude: '76.6394',
    place_of_occurrence: 'Hunsur Road Junction, Mysuru',
    complaint_mode: 'In-Person',
    case_priority: 'High',
    case_status: 'Closed',
    ai_risk_score: 72,
    ai_summary: 'Pradeep Gowda arrested with 1.8 kg processed ganja near Hunsur Road junction. During interrogation, revealed supply chain from coastal Karnataka through Bengaluru-Mysuru corridor. Confessed to 3 previous deliveries. Investigation led to identification of Ravi Shetty as kingpin.',
    is_sensitive: false,
  },

  // ── ARC 2: The Majestic Pickpocket Ring (8 cases) ──
  {
    ROWID: 'case-0007',
    fir_number: 'FIR/2025/KSP/0156',
    crime_type_rowid: 'ct-chain-snatching',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(1, 10, 11, 20),
    complaint_datetime: narrativeDate(1, 10, 12, 0),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Majestic Bus Stand, Bengaluru',
    complaint_mode: 'In-Person',
    case_priority: 'High',
    case_status: 'Under Investigation',
    ai_risk_score: 62,
    ai_summary: 'Same MO — approach victim from behind on two-wheeler, snatch chain, flee towards Shivajinagar. Victim: elderly woman, gold chain worth ₹1.2 lakh. Incident occurred near BMTC bus stand entrance. CCTV footage being analyzed.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0008',
    fir_number: 'FIR/2025/KSP/0157',
    crime_type_rowid: 'ct-chain-snatching',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(1, 14, 12, 45),
    complaint_datetime: narrativeDate(1, 14, 13, 30),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Shivajinagar Bus Stand, Bengaluru',
    complaint_mode: 'In-Person',
    case_priority: 'High',
    case_status: 'Under Investigation',
    ai_risk_score: 65,
    ai_summary: 'CCTV footage from Shivajinagar bus stand shows same Honda Activa KA-01-EJ-4521 spotted in 4 of 5 recent chain snatching incidents. Victim description: male, 25-30 yrs, dark complexion, red t-shirt seen fleeing on pillion. ANPR alert issued.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0009',
    fir_number: 'FIR/2025/KSP/0158',
    crime_type_rowid: 'ct-chain-snatching',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(1, 18, 10, 30),
    complaint_datetime: narrativeDate(1, 18, 11, 0),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'KR Market, Bengaluru',
    complaint_mode: 'In-Person',
    case_priority: 'Medium',
    case_status: 'Open',
    ai_risk_score: 52,
    ai_summary: 'Chain snatching in crowded KR Market area. Victim description matches: male, 25-30 yrs, dark complexion, red t-shirt. No CCTV coverage at exact spot. Similar to FIR/2025/KSP/0156 and FIR/2025/KSP/0157 — same organized ring suspected.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0010',
    fir_number: 'FIR/2025/KSP/0159',
    crime_type_rowid: 'ct-chain-snatching',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(1, 22, 13, 15),
    complaint_datetime: narrativeDate(1, 22, 14, 0),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'City Railway Station, Bengaluru',
    complaint_mode: 'In-Person',
    case_priority: 'High',
    case_status: 'Under Investigation',
    ai_risk_score: 68,
    ai_summary: 'Same MO — two-wheeler approach from behind, snatch chain, flee towards Shivajinagar. CCTV footage from City Railway Station shows Honda Activa KA-01-EJ-4521 arriving at 10:45 and departing at 11:02. Coordination with RPF requested.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0011',
    fir_number: 'FIR/2025/KSP/0160',
    crime_type_rowid: 'ct-chain-snatching',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(1, 26, 11, 50),
    complaint_datetime: narrativeDate(1, 26, 12, 30),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Kempegowda Metro Station, Bengaluru',
    complaint_mode: 'Phone',
    case_priority: 'Medium',
    case_status: 'Under Investigation',
    ai_risk_score: 55,
    ai_summary: 'Chain snatching near Kempegowda Metro Station exit. Victim was distracted by accomplice while main suspect snatched chain from behind. MO consistent with Shivajinagar-Majestic ring. BMRCL CCTV footage obtained.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0012',
    fir_number: 'FIR/2025/KSP/0161',
    crime_type_rowid: 'ct-theft',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(2, 5, 10, 0),
    complaint_datetime: narrativeDate(2, 5, 10, 45),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Malleshwaram 18th Cross, Bengaluru',
    complaint_mode: 'In-Person',
    case_priority: 'Low',
    case_status: 'Closed',
    ai_risk_score: 42,
    ai_summary: 'Theft of mobile phone and wallet from auto rickshaw at Malleshwaram 18th Cross. Suspect Kiran Reddy B arrested — confesses to 3 incidents in the Majestic-Shivajinagar corridor. Stolen property recovered. Case closed after charge sheet filing.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0013',
    fir_number: 'FIR/2025/KSP/0162',
    crime_type_rowid: 'ct-theft',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(1, 28, 13, 40),
    complaint_datetime: narrativeDate(1, 28, 15, 0),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Rajajinagar 1st Block, Bengaluru',
    complaint_mode: 'Phone',
    case_priority: 'Medium',
    case_status: 'Open',
    ai_risk_score: 48,
    ai_summary: 'Theft of two-wheeler from residential area in Rajajinagar. Vehicle: Honda Activa KA-01-EJ-4521 — same vehicle identified in chain snatching ring. Possible connection to Majestic-Shivajinagar theft syndicate. Owner confirms vehicle was stolen between 11:00-14:00.',
    is_sensitive: false,
  },
  {
    ROWID: 'case-0014',
    fir_number: 'FIR/2025/KSP/0163',
    crime_type_rowid: 'ct-burglary',
    district_rowid: 'd-bengaluru-urban',
    occurrence_datetime: narrativeDate(1, 2, 12, 15),
    complaint_datetime: narrativeDate(1, 2, 18, 0),
    latitude: '12.9716',
    longitude: '77.5946',
    place_of_occurrence: 'Yeshwanthpur Circle, Bengaluru',
    complaint_mode: 'In-Person',
    case_priority: 'Low',
    case_status: 'Under Investigation',
    ai_risk_score: 44,
    ai_summary: 'Daytime burglary at locked residence near Yeshwanthpur Circle. Entry through rear window. Stolen: gold ornaments worth ₹80,000 and ₹15,000 cash. No CCTV in vicinity. Neighbors report suspicious two-wheeler with two males seen around noon.',
    is_sensitive: false,
  },

  // ── ARC 3: Kalaburagi Murder Series (3 cases) ──
  {
    ROWID: 'case-0015',
    fir_number: 'FIR/2025/KSP/0153',
    crime_type_rowid: 'ct-murder',
    district_rowid: 'd-kalaburagi',
    occurrence_datetime: narrativeDate(1, 15, 23, 30),
    complaint_datetime: narrativeDate(1, 16, 6, 0),
    latitude: '17.3297',
    longitude: '76.8343',
    place_of_occurrence: 'Gandhi Chowk Road, Kalaburagi',
    complaint_mode: 'In-Person',
    case_priority: 'Critical',
    case_status: 'Under Investigation',
    ai_risk_score: 94,
    ai_summary: 'Victim: Hanumanthappa M. Hadli (52), local businessman, found with blunt force injuries near Gandhi Chowk. Forensic evidence: blood spatter indicates single attacker, right-handed. No CCTV in vicinity. Witness saw white Maruti Alto (KA-31-CD-2234) fleeing scene. Vehicle registered to Siddu M alias Siddheshwar of Jalihal village.',
    is_sensitive: true,
  },
  {
    ROWID: 'case-0016',
    fir_number: 'FIR/2025/KSP/0154',
    crime_type_rowid: 'ct-attempt-murder',
    district_rowid: 'd-vijayapura',
    occurrence_datetime: narrativeDate(0, 25, 22, 15),
    complaint_datetime: narrativeDate(0, 25, 23, 0),
    latitude: '16.8302',
    longitude: '75.7100',
    place_of_occurrence: 'Twin Cities Bus Stand, Vijayapura',
    complaint_mode: 'Phone',
    case_priority: 'Critical',
    case_status: 'Open',
    ai_risk_score: 89,
    ai_summary: 'Victim: Basavaraj Pattedar (45), agriculture trader, attacked with iron rod near bus stand. Survived with critical head injuries. Statement under Section 161 CrPC: attacker wore black jacket, spoke in Kannada with Urdu mix (Dakhni dialect). Vehicle description matches white Maruti Alto. Forensics: partial fingerprint recovered from weapon.',
    is_sensitive: true,
  },
  {
    ROWID: 'case-0017',
    fir_number: 'FIR/2025/KSP/0155',
    crime_type_rowid: 'ct-murder',
    district_rowid: 'd-kalaburagi',
    occurrence_datetime: daysBeforeNow(5, 0, 45),
    complaint_datetime: daysBeforeNow(5, 7, 0),
    latitude: '17.3297',
    longitude: '76.8343',
    place_of_occurrence: 'Station Road, Sedam, Kalaburagi',
    complaint_mode: 'In-Person',
    case_priority: 'Critical',
    case_status: 'Under Investigation',
    ai_risk_score: 97,
    ai_summary: 'CRITICAL — Third homicide in Kalaburagi district in 47 days. Victim: Siddaramayya Kuri (38), petty shop owner. MO identical to FIR/2025/KSP/0153: blunt weapon, right-handed attacker, late night, poorly lit area. AFIS match: fingerprint from FIR/2025/KSP/0154 weapon matches partial print recovered here (94.2% confidence). Same suspect — Siddu M alias Siddheshwar — confirmed. District SP Kalaburagi alerted. Inter-state alert issued to Maharashtra and Telangana police.',
    is_sensitive: true,
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 3b. PRNG-GENERATED CASES — 130 cases
// ═══════════════════════════════════════════════════════════════════════

// FIR numbers reserved by narrative cases
const RESERVED_FIR_NUMS = new Set([147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163])

let _firCounter = 18 // PRNG cases start from FIR 0018

function nextPrngFirNum(): number {
  while (RESERVED_FIR_NUMS.has(_firCounter)) _firCounter++
  return _firCounter++
}

const PRNG_CASES: DemoCase[] = Array.from({ length: 130 }, (_, i) => {
  const crimeType = weightedPick(CRIME_WEIGHTS).type
  const district = weightedPick(DISTRICT_WEIGHTS).dist
  const status = weightedPick(STATUS_WEIGHTS).status
  const priority = weightedPick(PRIORITY_WEIGHTS).priority
  const monthsAgo = Math.floor(rand() * 12)

  const occurrenceDate = genDatetime(monthsAgo)
  const complaintDelay = Math.floor(rand() * 3)
  const complaintDate = genDatetime(Math.max(0, monthsAgo - complaintDelay))

  const distRecord = getDistrictMap().get(district)!

  const isSensitive = SENSITIVE_CRIMES.has(crimeType)

  let riskScore: number
  if (isSensitive) {
    riskScore = 70 + Math.floor(rand() * 30)
  } else if (priority === 'Critical') {
    riskScore = 60 + Math.floor(rand() * 40)
  } else if (priority === 'High') {
    riskScore = 40 + Math.floor(rand() * 30)
  } else if (priority === 'Medium') {
    riskScore = 20 + Math.floor(rand() * 25)
  } else {
    riskScore = Math.floor(rand() * 25)
  }

  const firNum = nextPrngFirNum()

  return {
    ROWID: `case-${String(i + 18).padStart(4, '0')}`,
    fir_number: `FIR/2025/KSP/${String(firNum).padStart(4, '0')}`,
    crime_type_rowid: crimeType,
    district_rowid: district,
    occurrence_datetime: occurrenceDate,
    complaint_datetime: complaintDate,
    latitude: distRecord.latitude,
    longitude: distRecord.longitude,
    place_of_occurrence: genPlace(district),
    complaint_mode: pick(COMPLAINT_MODES),
    case_priority: priority,
    case_status: status,
    ai_risk_score: riskScore,
    ai_summary: AI_SUMMARIES[i % AI_SUMMARIES.length],
    is_sensitive: isSensitive || priority === 'Critical',
  }
})

// ── Combine: narrative first, then PRNG ──
export const DEMO_CASES: DemoCase[] = [...NARRATIVE_CASES, ...PRNG_CASES]

// ═══════════════════════════════════════════════════════════════════════
// 4. OFFICERS — 25 KSP officers
// ═══════════════════════════════════════════════════════════════════════

const OFFICER_DATA: Array<{
  name: string
  rank: string
  designation: string
  unitType: string
}> = [
  { name: 'Ravi Kumar S', rank: 'DSP', designation: 'Deputy Superintendent of Police', unitType: 'Sub-Division Office' },
  { name: 'Priya Sharma M', rank: 'Inspector', designation: 'Circle Inspector', unitType: 'Circle Office' },
  { name: 'Arun Gowda H', rank: 'Inspector', designation: 'Station House Officer', unitType: 'Police Station' },
  { name: 'Lakshmi Devi N', rank: 'SI', designation: 'Sub-Inspector', unitType: 'Police Station' },
  { name: 'Mohammed Irfan K', rank: 'SI', designation: 'Sub-Inspector', unitType: 'Police Station' },
  { name: 'Venkatesh R', rank: 'PSI', designation: 'Investigation Officer', unitType: 'Police Station' },
  { name: 'Nandini Bhat P', rank: 'PSI', designation: 'Investigation Officer', unitType: 'Police Station' },
  { name: 'Suresh Babu M', rank: 'Inspector', designation: 'Station House Officer', unitType: 'Police Station' },
  { name: 'Kavitha Reddy T', rank: 'DSP', designation: 'Deputy Superintendent of Police', unitType: 'Sub-Division Office' },
  { name: 'Jagadish Patil S', rank: 'SP', designation: 'Superintendent of Police', unitType: 'District SP Office' },
  { name: 'Meena Kumari J', rank: 'SI', designation: 'Sub-Inspector', unitType: 'Police Station' },
  { name: 'Harish Chandra B', rank: 'PSI', designation: 'Investigation Officer', unitType: 'Police Station' },
  { name: 'Deepa Rao V', rank: 'Inspector', designation: 'Circle Inspector', unitType: 'Circle Office' },
  { name: 'Prakash Naik D', rank: 'SI', designation: 'Sub-Inspector', unitType: 'Police Station' },
  { name: 'Shailaja Iyer K', rank: 'PSI', designation: 'Investigation Officer', unitType: 'Police Station' },
  { name: 'Manoj Kumar V', rank: 'Inspector', designation: 'Station House Officer', unitType: 'Police Station' },
  { name: 'Bhavya Srinivas G', rank: 'PSI', designation: 'Investigation Officer', unitType: 'Police Station' },
  { name: 'Rajeshwari Devi A', rank: 'SI', designation: 'Sub-Inspector', unitType: 'Police Station' },
  { name: 'Sunil Kumar M', rank: 'DSP', designation: 'Deputy Superintendent of Police', unitType: 'Sub-Division Office' },
  { name: 'Anjali Desai P', rank: 'PSI', designation: 'Investigation Officer', unitType: 'Police Station' },
  { name: 'Gururaj Bhat S', rank: 'Inspector', designation: 'Station House Officer', unitType: 'Police Station' },
  { name: 'Pavitra Kulkarni R', rank: 'SI', designation: 'Sub-Inspector', unitType: 'Police Station' },
  { name: 'Naveen Kumar J', rank: 'PSI', designation: 'Investigation Officer', unitType: 'Police Station' },
  { name: 'Sujatha Gowda M', rank: 'Inspector', designation: 'Circle Inspector', unitType: 'Circle Office' },
  { name: 'Kiran Patil R', rank: 'SP', designation: 'Superintendent of Police', unitType: 'District SP Office' },
]

export interface DemoOfficer {
  ROWID: string
  full_name: string
  badge_number: string
  rank: string
  designation: string
  unit_name: string
  district_name: string
  email: string
  phone: string
}

export const DEMO_OFFICERS: DemoOfficer[] = OFFICER_DATA.map((officer, i) => {
  const dIdx = i % DEMO_DISTRICTS.length
  const district = DEMO_DISTRICTS[dIdx]
  const firstName = officer.name.split(' ')[0].toLowerCase()
  return {
    ROWID: `off-${i + 1}`,
    full_name: officer.name,
    badge_number: `KSP${String(1000 + i).padStart(6, '0')}`,
    rank: officer.rank,
    designation: officer.designation,
    unit_name: `${district.district_name} ${officer.unitType}`,
    district_name: district.district_name,
    email: `${firstName}@ksp.gov.in`,
    phone: `+91${9876543210 + i}`,
  }
})

// ═══════════════════════════════════════════════════════════════════════
// 5. SUSPECTS — 71 named suspects (15 narrative + 56 PRNG-generated)
// ═══════════════════════════════════════════════════════════════════════

const OCCUPATIONS = [
  'Unemployed', 'Daily Wage Labourer', 'Driver', 'Auto Rickshaw Driver',
  'Construction Worker', 'Farmer', 'Shopkeeper', 'Tailor', 'Painter',
  'Electrician', 'Plumber', 'Carpenter', 'Street Vendor', 'Security Guard',
]

export interface DemoSuspect {
  ROWID: string
  case_rowid: string
  suspect_name: string
  gender: 'Male' | 'Female'
  age: string
  address: string
  occupation: string
  arrest_status: string
  is_repeat_offender: boolean
}

// ── 5a. NARRATIVE SUSPECTS — 15 hardcoded suspects ──

const NARRATIVE_SUSPECTS: DemoSuspect[] = [
  // Arc 1: Operation Black Lotus (7 suspects)
  { ROWID: 'susp-001', case_rowid: 'case-0001', suspect_name: 'Ravi Shetty', gender: 'Male', age: '34', address: 'No. 47, 2nd Cross, Padmanabhanagar, Bengaluru', occupation: 'Real Estate Agent', arrest_status: 'Absconding', is_repeat_offender: true },
  { ROWID: 'susp-002', case_rowid: 'case-0002', suspect_name: 'Imtiaz Ahmed', gender: 'Male', age: '29', address: 'No. 112, Kazi Street, Nazarbad, Mysuru', occupation: 'Transport Contractor', arrest_status: 'Absconding', is_repeat_offender: false },
  { ROWID: 'susp-003', case_rowid: 'case-0001', suspect_name: 'Pradeep Gowda', gender: 'Male', age: '38', address: 'No. 23, 7th Main, Jayanagar 4th Block, Bengaluru', occupation: 'Unemployed', arrest_status: 'Arrested', is_repeat_offender: true },
  { ROWID: 'susp-004', case_rowid: 'case-0003', suspect_name: 'Farooq Patel', gender: 'Male', age: '42', address: 'No. 8, Kasaragod Road, Surathkal, Mangaluru', occupation: 'Fisheries Worker', arrest_status: 'Absconding', is_repeat_offender: false },
  // Arc 1 additional suspects
  { ROWID: 'susp-008', case_rowid: 'case-0004', suspect_name: 'Venkateshwara Rao K. Indiranagar', gender: 'Male', age: '45', address: 'No. 156, 12th Main, Indiranagar, Bengaluru', occupation: 'Chartered Accountant', arrest_status: 'Arrested', is_repeat_offender: false },
  { ROWID: 'susp-009', case_rowid: 'case-0002', suspect_name: 'Ganesh Bhat S. Mangaluru', gender: 'Male', age: '31', address: 'No. 67, Car Street, Kodialbail, Mangaluru', occupation: 'Driver', arrest_status: 'Absconding', is_repeat_offender: false },
  { ROWID: 'susp-010', case_rowid: 'case-0005', suspect_name: 'Naveen Sharma R. Jayanagar', gender: 'Male', age: '26', address: 'No. 34, 9th Cross, Jayanagar 3rd Block, Bengaluru', occupation: 'IT Professional', arrest_status: 'In Custody', is_repeat_offender: false },

  // Arc 2: Majestic Pickpocket Ring (6 suspects)
  { ROWID: 'susp-005', case_rowid: 'case-0007', suspect_name: 'Mohd. Irfan', gender: 'Male', age: '27', address: 'No. 156, Pottery Road, Shivajinagar, Bengaluru', occupation: 'Auto Rickshaw Driver', arrest_status: 'Absconding', is_repeat_offender: true },
  { ROWID: 'susp-006', case_rowid: 'case-0008', suspect_name: 'Kiran Reddy B', gender: 'Male', age: '24', address: 'No. 89, 2nd Cross, Malleshwaram, Bengaluru', occupation: 'Unemployed', arrest_status: 'Released on Bail', is_repeat_offender: true },
  // Arc 2 additional suspects
  { ROWID: 'susp-011', case_rowid: 'case-0010', suspect_name: 'Raju Naik T. Yeshwanthpur', gender: 'Male', age: '23', address: 'No. 45, Peenya Industrial Area, Bengaluru', occupation: 'Daily Wage Labourer', arrest_status: 'Arrested', is_repeat_offender: false },
  { ROWID: 'susp-012', case_rowid: 'case-0009', suspect_name: 'Lakshmi Devi K. Kengeri', gender: 'Female', age: '32', address: 'No. 78, Kengeri Satellite Town, Bengaluru', occupation: 'Household Help', arrest_status: 'Arrested', is_repeat_offender: false },
  { ROWID: 'susp-013', case_rowid: 'case-0013', suspect_name: 'Suresh Gowda M. Rajajinagar', gender: 'Male', age: '28', address: 'No. 112, 4th Block, Rajajinagar, Bengaluru', occupation: 'Street Vendor', arrest_status: 'Released on Bail', is_repeat_offender: false },
  { ROWID: 'susp-014', case_rowid: 'case-0011', suspect_name: 'Akbar Ali S. Austin Town', gender: 'Male', age: '25', address: 'No. 23, Mosque Road, Austin Town, Bengaluru', occupation: 'Auto Rickshaw Driver', arrest_status: 'Absconding', is_repeat_offender: true },

  // Arc 3: Kalaburagi Murder Series (2 suspects)
  { ROWID: 'susp-007', case_rowid: 'case-0015', suspect_name: 'Siddu M alias Siddheshwar', gender: 'Male', age: '31', address: 'Jalihal Village, Sedam Taluk, Kalaburagi District', occupation: 'Agricultural Labourer', arrest_status: 'Absconding', is_repeat_offender: true },
  // Arc 3 additional suspect
  { ROWID: 'susp-015', case_rowid: 'case-0016', suspect_name: 'Mahesh T. Jalihal', gender: 'Male', age: '28', address: 'Jalihal Village, Sedam Taluk, Kalaburagi District', occupation: 'Agricultural Labourer', arrest_status: 'Arrested', is_repeat_offender: false },
]

// ── 5b. PRNG-GENERATED SUSPECTS — 56 suspects with Karnataka-specific names ──

const KARNATAKA_MALE_FIRST = [
  'Basavarajappa', 'Chennabasava', 'Puttaraju', 'Thimme Gowda', 'Munirathna',
  'Gangadhara', 'Shivarathna', 'Basavaraj', 'Mahadeva', 'Channabasava',
  'Lakshmana', 'Nanjaiah', 'Virupaksha', 'Doddanna', 'Ningappa',
  'Karigowda', 'Mallikarjuna', 'Ranganna', 'Shivakumar', 'Siddegowda',
  'Kempaiah', 'Muniswamy', 'Gowrish', 'Basava', 'Kariyappa',
  'Hanumanthappa', 'Rudresh', 'Prasanna', 'Vinay', 'Santhosh',
  'Gururaj', 'Chidanand', 'Ramesh', 'Dinesh', 'Suresh',
  'Prakash', 'Manjunath', 'Venkatesh', 'Raghavendra', 'Harish',
]

const KARNATAKA_FEMALE_FIRST = [
  'Gangamma', 'Bhavani', 'Mahadevi', 'Chennamma', 'Lakshmi',
  'Sarojamma', 'Muthulakshmi', 'Yashoda', 'Puttamma', 'Nagamma',
  'Thayamma', 'Muddamma', 'Kempamma', 'Lakshmamma', 'Siddamma',
  'Munamma', 'Basamma', 'Kamalamma', 'Neelamma', 'Akamma',
  'Padmavathi', 'Savithramma', 'Nandini', 'Kavitha', 'Meenakshi',
  'Annapurna', 'Sowbhagya', 'Vasanthi', 'Bharathi', 'Geethanjali',
]

const KARNATAKA_INITIALS = ['T', 'R', 'M', 'S', 'N', 'H', 'K', 'B', 'P', 'G', 'D', 'V', 'A', 'J', 'C']

const KARNATAKA_PLACE_SURNAMES = [
  'Mallesh', 'Koppal', 'Hadli', 'Bellary', 'Ramanagara',
  'Chitradurga', 'Shivamogga', 'Hassan', 'Mandya', 'Mysuru',
  'Tumakuru', 'Kolar', 'Davanagere', 'Haveri', 'Dharwad',
  'Belagavi', 'Raichur', 'Ballari', 'Udupi', 'Chikkamagaluru',
  'Gadag', 'Bagalkot', 'Bidar', 'Kalaburagi', 'Vijayapura',
  'Yadgir', 'Kodagu', 'Chamarajanagar', 'Chikballapur',
]

function genKarnatakaName(gender: 'Male' | 'Female'): string {
  const first = gender === 'Male' ? pick(KARNATAKA_MALE_FIRST) : pick(KARNATAKA_FEMALE_FIRST)
  const initial = pick(KARNATAKA_INITIALS)
  const place = pick(KARNATAKA_PLACE_SURNAMES)
  return `${first} ${initial}. ${place}`
}

const ARREST_STATUS_WEIGHTS = [
  { status: 'Absconding', w: 30 },
  { status: 'Arrested', w: 25 },
  { status: 'Released on Bail', w: 20 },
  { status: 'In Custody', w: 15 },
  { status: 'Surrendered', w: 10 },
]

const PRNG_SUSPECTS: DemoSuspect[] = Array.from({ length: 56 }, (_, i) => {
  const caseIdx = Math.floor(rand() * DEMO_CASES.length)
  const c = DEMO_CASES[caseIdx]
  const isRepeat = rand() < 0.15
  const districtName = getDistrictMap().get(c.district_rowid)?.district_name ?? 'Unknown'
  const gender: 'Male' | 'Female' = rand() < 0.75 ? 'Male' : 'Female'
  const age = 18 + Math.floor(rand() * 45)
  return {
    ROWID: `susp-${i + 16}`,
    case_rowid: c.ROWID,
    suspect_name: genKarnatakaName(gender),
    gender,
    age: String(age),
    address: `${Math.floor(rand() * 200) + 1}, ${pick(PLACES_GENERIC)}, ${districtName}`,
    occupation: pick(OCCUPATIONS),
    arrest_status: weightedPick(ARREST_STATUS_WEIGHTS).status,
    is_repeat_offender: isRepeat,
  }
})

// ── Combine: narrative first, then PRNG ──
export const DEMO_SUSPECTS: DemoSuspect[] = [...NARRATIVE_SUSPECTS, ...PRNG_SUSPECTS]

// ═══════════════════════════════════════════════════════════════════════
// 6. ARRESTS — 37 arrest records (3 narrative + 34 PRNG-generated)
// ═══════════════════════════════════════════════════════════════════════

export interface DemoArrest {
  ROWID: string
  case_rowid: string
  accused_rowid: string
  arrest_type: string
  arrest_datetime: string
  arrest_location: string
  arresting_officer_rowid: string
}

// ── 6a. NARRATIVE ARRESTS — 3 hardcoded arrests ──

const NARRATIVE_ARRESTS: DemoArrest[] = [
  {
    ROWID: 'arr-1',
    case_rowid: 'case-0001',
    accused_rowid: 'susp-003',
    arrest_type: 'Arrest',
    arrest_datetime: narrativeDate(2, 14, 6, 0),
    arrest_location: 'No. 23, 7th Main, Jayanagar 4th Block, Bengaluru',
    arresting_officer_rowid: 'off-3',
  },
  {
    ROWID: 'arr-2',
    case_rowid: 'case-0010',
    accused_rowid: 'susp-011',
    arrest_type: 'Arrest',
    arrest_datetime: narrativeDate(0, 28, 16, 30),
    arrest_location: 'City Railway Station, Bengaluru',
    arresting_officer_rowid: 'off-2',
  },
  {
    ROWID: 'arr-3',
    case_rowid: 'case-0016',
    accused_rowid: 'susp-015',
    arrest_type: 'Arrest',
    arrest_datetime: daysBeforeNow(3, 14, 0),
    arrest_location: 'Twin Cities Bus Stand, Vijayapura',
    arresting_officer_rowid: 'off-10',
  },
]

// ── 6b. PRNG-GENERATED ARRESTS — 34 arrests ──

const PRNG_ARRESTS: DemoArrest[] = Array.from({ length: 34 }, (_, i) => {
  const caseIdx = Math.floor(rand() * DEMO_CASES.length)
  const c = DEMO_CASES[caseIdx]
  return {
    ROWID: `arr-${i + 4}`,
    case_rowid: c.ROWID,
    accused_rowid: `susp-${Math.floor(rand() * DEMO_SUSPECTS.length) + 1}`,
    arrest_type: rand() > 0.3 ? 'Arrest' : 'Surrender',
    arrest_datetime: genDatetime(Math.floor(rand() * 6)),
    arrest_location: c.place_of_occurrence,
    arresting_officer_rowid: `off-${Math.floor(rand() * 25) + 1}`,
  }
})

// ── Combine ──
export const DEMO_ARRESTS: DemoArrest[] = [...NARRATIVE_ARRESTS, ...PRNG_ARRESTS]

// ═══════════════════════════════════════════════════════════════════════
// 7. CHARGESHEETS — 28 chargesheet filings (PRNG-generated)
// ═══════════════════════════════════════════════════════════════════════

const COURTS = [
  'District and Sessions Court, Bengaluru',
  'Chief Judicial Magistrate Court, Mysuru',
  'Sessions Court, Belagavi',
  'Fast Track Court, Bengaluru',
  'Special Court for Cyber Crimes, Bengaluru',
  'District Court, Dharwad',
  'Judicial Magistrate First Class, Mangaluru',
  'Sessions Court, Shivamogga',
  'District and Sessions Court, Kalaburagi',
  'Chief Judicial Magistrate Court, Davanagere',
]

const JUDGE_NAMES = [
  "Hon'ble Justice A.N. Kumar",
  "Hon'ble Justice B.S. Rao",
  "Hon'ble Justice C.D. Sharma",
  "Hon'ble Justice D.K. Patil",
  "Hon'ble Justice E.G. Reddy",
  "Hon'ble Justice F.H. Bhat",
  "Hon'ble Justice G.M. Iyengar",
  "Hon'ble Justice H.R. Deshpande",
]

export interface DemoChargesheet {
  ROWID: string
  case_rowid: string
  filing_date: string
  court_name: string
  judge_name: string
  chargesheet_number: string
  filing_status: string
}

// Only charge-sheet cases that are Closed or Charge Sheet Filed
const CHARGESHEET_ELIGIBLE = DEMO_CASES.filter(
  (c) => c.case_status === 'Closed' || c.case_status === 'Charge Sheet Filed'
)

export const DEMO_CHARGESHEETS: DemoChargesheet[] = Array.from({ length: 28 }, (_, i) => {
  const c = CHARGESHEET_ELIGIBLE[i % CHARGESHEET_ELIGIBLE.length]
  return {
    ROWID: `cs-${i + 1}`,
    case_rowid: c.ROWID,
    filing_date: genDatetime(Math.floor(rand() * 6)),
    court_name: pick(COURTS),
    judge_name: pick(JUDGE_NAMES),
    chargesheet_number: `CS/2025/${String(i + 1).padStart(4, '0')}`,
    filing_status: rand() > 0.2 ? 'Filed' : 'Under Review',
  }
})

// ═══════════════════════════════════════════════════════════════════════
// 8. NARRATIVE ARCS — 3 investigation story arcs
// ═══════════════════════════════════════════════════════════════════════

export const DEMO_NARRATIVE_ARCS = [
  {
    id: 'operation-black-lotus',
    name: 'Operation Black Lotus',
    type: 'Cross-District Narcotics Ring',
    status: 'Active Investigation',
    caseIds: ['case-0001', 'case-0002', 'case-0003', 'case-0004', 'case-0005', 'case-0006'],
    suspectNames: ['Ravi Shetty', 'Imtiaz Ahmed', 'Pradeep Gowda', 'Farooq Patel'],
    districts: ['Bengaluru Urban', 'Mysuru', 'Dakshina Kannada'],
    leadOfficer: 'Arun Gowda H, SHO',
    description: 'Inter-district narcotics and arms trafficking network operating between coastal Karnataka and Bengaluru. Six FIRs registered across three districts. Kingpin Ravi Shetty remains absconding. Financial trail shows ₹3.8 crore in suspicious transactions through shell companies.',
  },
  {
    id: 'majestic-pickpocket-ring',
    name: 'The Majestic Pickpocket Ring',
    type: 'Organized Chain Snatching Syndicate',
    status: 'Active Investigation',
    caseIds: ['case-0007', 'case-0008', 'case-0009', 'case-0010', 'case-0011', 'case-0012', 'case-0013', 'case-0014'],
    suspectNames: ['Mohd. Irfan', 'Kiran Reddy B'],
    districts: ['Bengaluru Urban'],
    leadOfficer: 'Priya Sharma M, CI',
    description: 'Organized chain snatching and theft ring operating in central Bengaluru during peak hours (10:00-14:00). Eight FIRs with identical MO — two-wheeler approach, snatch and flee. CCTV identifies recurring vehicle: Honda Activa KA-01-EJ-4521. Primary accused Mohd. Irfan remains absconding.',
  },
  {
    id: 'kalaburagi-murder-series',
    name: 'Kalaburagi Murder Series',
    type: 'Serial Homicide Investigation',
    status: 'CRITICAL — Active Manhunt',
    caseIds: ['case-0015', 'case-0016', 'case-0017'],
    suspectNames: ['Siddu M alias Siddheshwar'],
    districts: ['Kalaburagi', 'Vijayapura'],
    leadOfficer: 'Jagadish Patil S, SP',
    description: 'Three violent attacks (2 murders, 1 attempted murder) in 47 days across Kalaburagi and Vijayapura. Identical MO: blunt weapon, right-handed attacker, late-night (22:00-01:00), poorly lit areas. AFIS match confirms single suspect. Inter-state alert issued.',
  },
] as const

// ═══════════════════════════════════════════════════════════════════════
// 9. NARRATIVE ARC HELPER FUNCTIONS — Cross-tab navigation support
// ═══════════════════════════════════════════════════════════════════════

// Lazy-built case→arc index
let _caseArcMap: Map<string, typeof DEMO_NARRATIVE_ARCS[number]> | null = null

function getCaseArcMap(): Map<string, typeof DEMO_NARRATIVE_ARCS[number]> {
  if (_caseArcMap) return _caseArcMap
  _caseArcMap = new Map()
  for (const arc of DEMO_NARRATIVE_ARCS) {
    for (const caseId of arc.caseIds) {
      _caseArcMap.set(caseId, arc)
    }
  }
  return _caseArcMap
}

/** Returns the narrative arc a case belongs to, or null */
export function getCaseNarrativeArc(caseRowid: string): typeof DEMO_NARRATIVE_ARCS[number] | null {
  return getCaseArcMap().get(caseRowid) ?? null
}

/** Returns all cases belonging to a given narrative arc */
export function getArcCases(arcId: string): DemoCase[] {
  const arc = DEMO_NARRATIVE_ARCS.find(a => a.id === arcId)
  if (!arc) return []
  return arc.caseIds
    .map(id => DEMO_CASES.find(c => c.ROWID === id))
    .filter((c): c is DemoCase => c !== undefined)
}

/** Returns all suspects linked to a narrative arc (by their case associations) */
export function getArcSuspects(arcId: string): DemoSuspect[] {
  const arc = DEMO_NARRATIVE_ARCS.find(a => a.id === arcId)
  if (!arc) return []
  const caseIds = new Set<string>(arc.caseIds)
  return DEMO_SUSPECTS.filter(s => caseIds.has(s.case_rowid))
}

/** Returns all suspects linked to a specific case */
export function getCaseSuspects(caseRowid: string): DemoSuspect[] {
  return DEMO_SUSPECTS.filter(s => s.case_rowid === caseRowid)
}

/** Returns arcs that involve a specific suspect (by name substring match) */
export function getSuspectArcs(suspectName: string): typeof DEMO_NARRATIVE_ARCS[number][] {
  return DEMO_NARRATIVE_ARCS.filter(arc =>
    arc.suspectNames.some(name =>
      name.toLowerCase().includes(suspectName.toLowerCase()) ||
      suspectName.toLowerCase().includes(name.toLowerCase())
    )
  )
}

/** Returns arcs that involve a specific district */
export function getDistrictArcs(districtName: string): typeof DEMO_NARRATIVE_ARCS[number][] {
  return DEMO_NARRATIVE_ARCS.filter(arc =>
    arc.districts.some(d =>
      d.toLowerCase().includes(districtName.toLowerCase()) ||
      districtName.toLowerCase().includes(d.toLowerCase())
    )
  )
}

// ═══════════════════════════════════════════════════════════════════════
// 10. INVESTIGATION TIMELINE EVENTS — Per-case narrative timelines
// ═══════════════════════════════════════════════════════════════════════

export interface TimelineEvent {
  date: string
  label: string
  description: string
  type: 'info' | 'arrest' | 'legal' | 'alert' | 'court'
}

export const DEMO_TIMELINE_EVENTS: Record<string, TimelineEvent[]> = {
  // ── ARC 1: Operation Black Lotus ──
  'case-0001': [
    { date: '2025-05-12', label: 'FIR Registered', description: 'FIR/2025/KSP/0147 registered at Basavanagudi PS on complaint by confidential informant. IPC 8(c) NDPS Act r/w 29. Seizure of ₹47.2 lakh and 2.3 kg ganja documented.', type: 'info' },
    { date: '2025-05-12', label: 'IO Assigned', description: 'PSI Venkatesh R assigned as Investigation Officer. Case classified as sensitive under KSP SOP Chapter 7.', type: 'info' },
    { date: '2025-05-13', label: 'Scene of Crime Visited', description: 'IO and FSL team visited accused residence at Jayanagar 4th Block. Paraphernalia seized under panchanama. Samples sent to FSL Bengaluru for chemical analysis.', type: 'info' },
    { date: '2025-05-14', label: 'Arrest — Pradeep Gowda', description: 'Pradeep Gowda arrested at his residence by PSI Venkatesh R during early morning raid. Cash and contraband recovered. Confessed to 3 prior deliveries under interrogation.', type: 'arrest' },
    { date: '2025-05-18', label: 'Suspect Identified — Ravi Shetty', description: 'Pradeep Gowda revealed Ravi Shetty as kingpin. Surveillance established at known addresses. Look-out circular issued across Karnataka.', type: 'alert' },
    { date: '2025-05-22', label: 'Inter-District Coordination', description: 'SP Bengaluru Urban coordinates with Mysuru City CP and DK SP regarding suspected narcotics corridor. Joint operation framework drafted.', type: 'info' },
  ],
  'case-0002': [
    { date: '2025-04-05', label: 'FIR Registered', description: 'FIR/2025/KSP/0148 registered at Nazarbad PS, Mysuru on phone complaint. Vehicle KA-05-MJ-7821 (Tata Ace) intercepted with suspected narcotics.', type: 'info' },
    { date: '2025-04-05', label: 'IO Assigned', description: 'SI Mohammed Irfan K assigned as Investigation Officer. Case linked to Bengaluru surveillance operation.', type: 'info' },
    { date: '2025-04-06', label: 'Scene of Crime Visited', description: 'Vehicle inspection at Nazarbad check post. 4.7 kg suspected ganja seized. Driver Imtiaz Ahmed fled on foot. Tire marks and fingerprints lifted.', type: 'info' },
    { date: '2025-04-08', label: 'Suspect Identified — Imtiaz Ahmed', description: 'Vehicle owner traced to Imtiaz Ahmed, Kazi Street, Nazarbad. Phone CDR obtained. Last location: near Bengaluru satellite town.', type: 'alert' },
    { date: '2025-04-15', label: 'Forensic Report Received', description: 'FSL Mysuru confirms substance as cannabis (ganja), net weight 4.62 kg. Report forwarded to jurisdictional magistrate.', type: 'info' },
    { date: '2025-04-20', label: 'SCRB Intelligence Note', description: 'Case linked to FIR/2025/KSP/0147 (Bengaluru) — common phone numbers in CDR analysis. Operation Black Lotus framework activated.', type: 'alert' },
  ],
  'case-0003': [
    { date: '2025-06-20', label: 'FIR Registered', description: 'FIR/2025/KSP/0149 registered at Surathkal PS on written complaint. Arms seizure during routine NH-66 vehicle check at Surathkal check post.', type: 'info' },
    { date: '2025-06-20', label: 'IO Assigned', description: 'PSI Harish Chandra B assigned as Investigation Officer. Case classified as sensitive — arms + narcotics nexus suspected.', type: 'info' },
    { date: '2025-06-20', label: 'Scene of Crime Visited', description: 'Two country-made pistols (7.65 mm) and 12 live rounds seized. Vehicle description matches Bengaluru surveillance target. Check post staff statement recorded.', type: 'info' },
    { date: '2025-06-22', label: 'Arms Tracing Initiated', description: 'Ordinance Factory batch AF-2024-0891 confirmed. FSL Bengaluru ballistics examination requested. Interstate arms trafficking angle under investigation.', type: 'alert' },
    { date: '2025-06-28', label: 'Suspect Identified — Farooq Patel', description: 'Driver identified as Farooq Patel of Kasaragod Road, Surathkal. Absconding. Search operations launched in DK and Udupi districts.', type: 'alert' },
  ],
  'case-0004': [
    { date: '2025-03-08', label: 'FIR Registered', description: 'FIR/2025/KSP/0150 registered at Electronic City PS on online complaint. ₹3.8 crore fraud through shell companies and cryptocurrency conversion.', type: 'info' },
    { date: '2025-03-09', label: 'IO Assigned', description: 'CI Deepa Rao V assigned as Investigation Officer. Cyber Cell Bengaluru co-opted for digital evidence analysis.', type: 'info' },
    { date: '2025-03-12', label: 'Suspect Identified — Ravi Shetty', description: 'Principal accused Ravi Shetty identified as operator of front entities. Bank records show 14 accounts with suspicious transactions.', type: 'alert' },
    { date: '2025-03-20', label: 'Arrest — Venkateshwara Rao K.', description: 'Chartered Accountant Venkateshwara Rao K. arrested for facilitating financial transactions. Confessed to routing ₹3.8 crore through shell companies under IPC 420 r/w 34.', type: 'arrest' },
    { date: '2025-04-10', label: 'Chargesheet Filed', description: 'Chargesheet filed before Fast Track Court, Bengaluru under IPC 420, 34, 120B r/w IT Act Section 66D. Accused: Ravi Shetty (absconding) and Venkateshwara Rao K. (in custody).', type: 'legal' },
    { date: '2025-05-05', label: 'Court Hearing', description: 'First hearing at Fast Track Court, Bengaluru. Accused Venkateshwara Rao K. remanded to judicial custody. Non-bailable warrant issued against Ravi Shetty.', type: 'court' },
  ],
  'case-0005': [
    { date: '2025-05-18', label: 'FIR Registered', description: 'FIR/2025/KSP/0151 registered at Indiranagar PS on online complaint. Phishing operation targeting senior citizens via fake KSP Payment Portal.', type: 'info' },
    { date: '2025-05-19', label: 'IO Assigned', description: 'PSI Nandini Bhat P assigned as Investigation Officer. Cyber Cell requested for server log analysis.', type: 'info' },
    { date: '2025-05-22', label: 'Scene of Crime Visited', description: 'Digital forensics team analyzed offshore server logs. 340+ victim accounts identified. Two IP addresses traced to Mysuru — coordination with Mysuru Cyber Cell initiated.', type: 'info' },
    { date: '2025-05-28', label: 'Suspect Identified — Naveen Sharma R.', description: 'IP address analysis led to Naveen Sharma R., Jayanagar. Laptop and mobile devices seized. Forensic imaging in progress.', type: 'alert' },
    { date: '2025-06-02', label: 'Forensic Report Received', description: 'FSL Cyber Forensics report confirms phishing website hosted on servers in Singapore and Malaysia. Digital evidence preserved for prosecution under IT Act.', type: 'info' },
  ],
  'case-0006': [
    { date: '2025-02-22', label: 'FIR Registered', description: 'FIR/2025/KSP/0152 registered at Hunsur Road PS, Mysuru on in-person complaint. Narcotics seizure near Hunsur Road junction.', type: 'info' },
    { date: '2025-02-23', label: 'IO Assigned', description: 'SI Lakshmi Devi N assigned as Investigation Officer. Narcotics Cell Mysuru alerted for inter-district coordination.', type: 'info' },
    { date: '2025-02-23', label: 'Scene of Crime Visited', description: '1.8 kg processed ganja recovered from suspect. Spot panchanama prepared. Samples sent to FSL Mysuru.', type: 'info' },
    { date: '2025-02-23', label: 'Arrest — Pradeep Gowda', description: 'Pradeep Gowda arrested red-handed. Under interrogation, revealed supply chain from coastal Karnataka through Bengaluru-Mysuru corridor. Confessed to 3 previous deliveries.', type: 'arrest' },
    { date: '2025-03-05', label: 'Chargesheet Filed', description: 'Chargesheet filed before CJM Court, Mysuru under NDPS Act Sections 8(c), 20, 29. Accused Pradeep Gowda remanded to judicial custody.', type: 'legal' },
    { date: '2025-03-20', label: 'Court Hearing', description: 'Hearing at CJM Court, Mysuru. Bail application rejected. Accused remanded. Investigation identified Ravi Shetty as kingpin — led to FIR/2025/KSP/0147.', type: 'court' },
  ],

  // ── ARC 2: The Majestic Pickpocket Ring ──
  'case-0007': [
    { date: '2025-06-10', label: 'FIR Registered', description: 'FIR/2025/KSP/0156 registered at Majestic PS. Elderly woman — gold chain worth ₹1.2 lakh snatched near BMTC bus stand entrance.', type: 'info' },
    { date: '2025-06-10', label: 'IO Assigned', description: 'PSI Shailaja Iyer K assigned as Investigation Officer. CCTV footage requisition from BMTC and nearby commercial establishments.', type: 'info' },
    { date: '2025-06-11', label: 'Scene of Crime Visited', description: 'IO visited Majestic Bus Stand area. CCTV footage from 3 cameras obtained. Two-wheeler approach from behind, flee towards Shivajinagar — MO consistent with recent pattern.', type: 'info' },
    { date: '2025-06-15', label: 'Suspect Identified — Mohd. Irfan', description: 'CCTV analysis and witness statements point to Mohd. Irfan of Pottery Road, Shivajinagar. ANPR alert issued for Honda Activa KA-01-EJ-4521.', type: 'alert' },
  ],
  'case-0008': [
    { date: '2025-06-14', label: 'FIR Registered', description: 'FIR/2025/KSP/0157 registered at Shivajinagar PS. Chain snatching near bus stand — victim description: male, 25-30 yrs, dark complexion, red t-shirt.', type: 'info' },
    { date: '2025-06-14', label: 'IO Assigned', description: 'PSI Bhavya Srinivas G assigned as Investigation Officer. Case linked to FIR/2025/KSP/0156 — identical MO and suspect description.', type: 'info' },
    { date: '2025-06-15', label: 'Scene of Crime Visited', description: 'CCTV footage from Shivajinagar bus stand shows Honda Activa KA-01-EJ-4521. Vehicle spotted in 4 of 5 recent chain snatching incidents. ANPR alert upgraded.', type: 'info' },
    { date: '2025-06-18', label: 'Suspect Identified — Kiran Reddy B', description: 'Pillion rider identified as Kiran Reddy B. of Malleshwaram. Known repeat offender with 2 prior chain-snatching cases.', type: 'alert' },
  ],
  'case-0009': [
    { date: '2025-06-18', label: 'FIR Registered', description: 'FIR/2025/KSP/0158 registered at KR Market PS. Chain snatching in crowded area — no CCTV coverage at exact spot.', type: 'info' },
    { date: '2025-06-18', label: 'IO Assigned', description: 'PSI Anjali Desai P assigned as Investigation Officer. Linked to Shivajinagar-Majestic chain snatching pattern.', type: 'info' },
    { date: '2025-06-19', label: 'Scene of Crime Visited', description: 'Area inspection at KR Market. Victim description consistent with previous incidents. Nearby shops asked for private CCTV footage. No usable footage recovered.', type: 'info' },
    { date: '2025-06-22', label: 'Pattern Analysis', description: 'SCRB analysis: 5 chain snatchings in 20 days across Majestic, Shivajinagar, KR Market — same organized ring. Task force formation recommended.', type: 'alert' },
  ],
  'case-0010': [
    { date: '2025-06-22', label: 'FIR Registered', description: 'FIR/2025/KSP/0159 registered at City Railway Station PS. Chain snatching — same MO, Honda Activa KA-01-EJ-4521 captured on CCTV arriving 10:45 and departing 11:02.', type: 'info' },
    { date: '2025-06-22', label: 'IO Assigned', description: 'CI Priya Sharma M personally supervising. Coordination with RPF requested for railway premises CCTV and access control.', type: 'info' },
    { date: '2025-06-23', label: 'Scene of Crime Visited', description: 'CCTV footage from City Railway Station and RPF cameras secured. Vehicle movement tracked from Majestic to City Station. Route mapping completed.', type: 'info' },
    { date: '2025-06-25', label: 'Suspect Identified — Raju Naik T.', description: 'Rider identified as Raju Naik T. of Peenya Industrial Area. ANPR network used to track vehicle to Peenya area. Surveillance team deployed.', type: 'alert' },
    { date: '2025-06-28', label: 'Arrest — Raju Naik T.', description: 'Raju Naik T. arrested at City Railway Station by CI Priya Sharma M during decoy operation. Recovered stolen gold chain and Honda Activa KA-01-EJ-4521.', type: 'arrest' },
    { date: '2025-07-02', label: 'Chargesheet Filed', description: 'Chargesheet filed before JMFC Bengaluru under IPC 379, 34. Accused Raju Naik T. remanded. Investigation continues for ring leader Mohd. Irfan.', type: 'legal' },
  ],
  'case-0011': [
    { date: '2025-06-26', label: 'FIR Registered', description: 'FIR/2025/KSP/0160 registered at Cubbon Park PS on phone complaint. Chain snatching near Kempegowda Metro Station exit — victim distracted by accomplice.', type: 'info' },
    { date: '2025-06-26', label: 'IO Assigned', description: 'PSI Naveen Kumar J assigned as Investigation Officer. BMRCL CCTV footage obtained under transit police coordination.', type: 'info' },
    { date: '2025-06-27', label: 'Scene of Crime Visited', description: 'BMRCL CCTV from Kempegowda Metro Station secured. Confirms two-person MO — accomplice distracts victim while main suspect strikes. Consistent with Shivajinagar-Majestic ring.', type: 'info' },
    { date: '2025-06-30', label: 'Suspect Identified — Akbar Ali S.', description: 'Accomplice identified as Akbar Ali S. of Austin Town. Known associate of Mohd. Irfan. Previous cases in 2024 for pickpocketing.', type: 'alert' },
  ],
  'case-0012': [
    { date: '2025-05-05', label: 'FIR Registered', description: 'FIR/2025/KSP/0161 registered at Malleshwaram PS. Theft of mobile phone and wallet from auto rickshaw at 18th Cross.', type: 'info' },
    { date: '2025-05-05', label: 'IO Assigned', description: 'SI Meena Kumari J assigned as Investigation Officer. Auto rickshaw driver statement recorded.', type: 'info' },
    { date: '2025-05-06', label: 'Scene of Crime Visited', description: 'Auto rickshaw examined. Partial fingerprint recovered from seat handle. Area CCTV from nearby commercial complex obtained.', type: 'info' },
    { date: '2025-05-08', label: 'Arrest — Kiran Reddy B', description: 'Kiran Reddy B. arrested at Malleshwaram based on CCTV and fingerprint match. Confessed to 3 theft incidents in Majestic-Shivajinagar corridor. Stolen property recovered.', type: 'arrest' },
    { date: '2025-05-15', label: 'Chargesheet Filed', description: 'Chargesheet filed before JMFC Bengaluru under IPC 379. Stolen mobile and wallet returned to complainant. Accused released on bail.', type: 'legal' },
    { date: '2025-06-10', label: 'Case Closed', description: 'Case closed after charge sheet filing and property return. Accused Kiran Reddy B. released on bail — linked to ongoing pickpocket ring investigation.', type: 'info' },
  ],
  'case-0013': [
    { date: '2025-06-28', label: 'FIR Registered', description: 'FIR/2025/KSP/0162 registered at Rajajinagar PS on phone complaint. Two-wheeler theft from residential area — Honda Activa KA-01-EJ-4521.', type: 'info' },
    { date: '2025-06-28', label: 'IO Assigned', description: 'PSI Pavitra Kulkarni R assigned as Investigation Officer. Vehicle confirmed as same Activa used in chain snatching ring.', type: 'info' },
    { date: '2025-06-29', label: 'Scene of Crime Visited', description: 'Residence at Rajajinagar 1st Block inspected. Owner confirms vehicle stolen between 11:00-14:00. No CCTV in street. Neighbour witnessed two males on the vehicle.', type: 'info' },
    { date: '2025-07-01', label: 'Suspect Identified — Suresh Gowda M.', description: 'Suresh Gowda M. of Rajajinagar identified as possible fence. Known receiver of stolen vehicles. Released on bail in previous case.', type: 'alert' },
  ],
  'case-0014': [
    { date: '2025-07-02', label: 'FIR Registered', description: 'FIR/2025/KSP/0163 registered at Yeshwanthpur PS. Daytime burglary at locked residence — gold ornaments ₹80,000 and ₹15,000 cash stolen.', type: 'info' },
    { date: '2025-07-02', label: 'IO Assigned', description: 'SI Prakash Naik D assigned as Investigation Officer. Entry through rear window — forensic team called for fingerprint and tool mark analysis.', type: 'info' },
    { date: '2025-07-02', label: 'Scene of Crime Visited', description: 'Rear window forensic examination completed. Fingerprint lifts and tool marks documented. Neighbours report suspicious two-wheeler with two males around noon.', type: 'info' },
    { date: '2025-07-04', label: 'Pattern Correlation', description: 'Neighbour description of two males on two-wheeler matches chain snatching ring suspects. Possible escalation from chain snatching to residential burglary. Case linked to pickpocket ring investigation.', type: 'alert' },
  ],

  // ── ARC 3: Kalaburagi Murder Series ──
  'case-0015': [
    { date: '2025-06-15', label: 'FIR Registered', description: 'FIR/2025/KSP/0153 registered at Kalaburagi Town PS. Victim Hanumanthappa M. Hadli (52), businessman, found with blunt force injuries near Gandhi Chowk.', type: 'info' },
    { date: '2025-06-16', label: 'IO Assigned', description: 'CI Suresh Babu M assigned as Investigation Officer. SP Kalaburagi briefed — case classified as sensitive.', type: 'info' },
    { date: '2025-06-16', label: 'Scene of Crime Visited', description: 'FSL team from Kalaburagi visited Gandhi Chowk. Blood spatter indicates single attacker, right-handed. No CCTV in vicinity. White Maruti Alto KA-31-CD-2234 seen fleeing — registered to Siddu M alias Siddheshwar.', type: 'info' },
    { date: '2025-06-18', label: 'Suspect Identified — Siddu M alias Siddheshwar', description: 'Vehicle registered to Siddu M alias Siddheshwar of Jalihal village, Sedam Taluk. Address confirmed through RTO records. Look-out circular issued.', type: 'alert' },
    { date: '2025-06-22', label: 'Forensic Report Received', description: 'FSL Kalaburagi confirms blunt force trauma. Blood group and DNA profile of victim documented. Partial fingerprint recovered from nearby wall — AFIS search initiated.', type: 'info' },
    { date: '2025-06-25', label: 'Search Operation', description: 'Search operation at Jalihal village. Suspect not found at residence. Village survey conducted. Informants activated in Sedam and Chitrapur taluks.', type: 'alert' },
  ],
  'case-0016': [
    { date: '2025-07-25', label: 'FIR Registered', description: 'FIR/2025/KSP/0154 registered at Vijayapura Town PS on phone complaint. Victim Basavaraj Pattedar (45), agriculture trader, attacked with iron rod near Twin Cities Bus Stand.', type: 'info' },
    { date: '2025-07-25', label: 'IO Assigned', description: 'SP Kiran Patil R personally supervising. PSI Gururaj Bhat S assigned as IO. Interstate coordination with Kalaburagi SP initiated — MO matches FIR/2025/KSP/0153.', type: 'info' },
    { date: '2025-07-25', label: 'Scene of Crime Visited', description: 'Victim survived with critical head injuries. Statement under Section 161 CrPC: attacker wore black jacket, spoke in Kannada with Urdu mix (Dakhni dialect). Iron rod seized as evidence.', type: 'info' },
    { date: '2025-07-26', label: 'Suspect Identified — Mahesh T.', description: 'Partial fingerprint recovered from weapon. AFIS search returns match to Mahesh T. of Jalihal village — associate of Siddu M alias Siddheshwar. Vehicle description matches white Maruti Alto.', type: 'alert' },
    { date: '2025-07-28', label: 'Arrest — Mahesh T.', description: 'Mahesh T. arrested at Twin Cities Bus Stand, Vijayapura by SP Kiran Patil R during targeted operation. Under interrogation, reveals Siddu M as mastermind. Weapon matched to forensic profile.', type: 'arrest' },
  ],
  'case-0017': [
    { date: '2025-07-28', label: 'FIR Registered', description: 'FIR/2025/KSP/0155 registered at Sedam PS. CRITICAL — Third homicide in 47 days. Victim Siddaramayya Kuri (38), petty shop owner, Station Road, Sedam.', type: 'info' },
    { date: '2025-07-28', label: 'IO Assigned', description: 'SP Jagadish Patil S takes direct charge. CI Suresh Babu M and team from Kalaburagi Town PS redeployed. SCRB alerted for state-wide coordination.', type: 'info' },
    { date: '2025-07-28', label: 'Scene of Crime Visited', description: 'FSL team from Gulbarga (Kalaburagi) visits Sedam crime scene. MO identical to FIR/2025/KSP/0153: blunt weapon, right-handed attacker, late night, poorly lit area. Blood spatter pattern matches.', type: 'info' },
    { date: '2025-07-29', label: 'AFIS Match Confirmed', description: 'Fingerprint from FIR/2025/KSP/0154 weapon matches partial print recovered at Sedam — 94.2% confidence. Same suspect Siddu M alias Siddheshwar confirmed. Inter-state alert issued to Maharashtra and Telangana.', type: 'alert' },
    { date: '2025-07-29', label: 'Active Manhunt Declared', description: 'SP Jagadish Patil S declares active manhunt. 5 teams deployed: Sedam taluk, Kalaburagi rural, Vijayapura border, Maharashtra check posts (Solapur, Osmanabad), Telangana check posts (Narayanpet, Zaheerabad).', type: 'alert' },
    { date: '2025-07-30', label: 'SCRB Intelligence Briefing', description: 'SCRB Bengaluru issues statewide alert. Case reviewed by ADGP Law & Order. Cash reward of ₹2 lakh announced for information leading to arrest. 24x7 control room activated at Kalaburagi SP office.', type: 'info' },
  ],
}

/** Returns the investigation timeline events for a given case ROWID */
export function getCaseTimeline(caseRowid: string): TimelineEvent[] {
  return DEMO_TIMELINE_EVENTS[caseRowid] ?? []
}
