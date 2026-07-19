/**
 * 10K Case Data Generator
 * Seeded PRNG — produces identical 10,000 cases every time.
 * Realistic Karnataka-weighted district distribution, 90-day window.
 */

// ─── Seeded PRNG (Lehmer / Park-Miller) ───
function createRng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rng = createRng(20260101)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function weightedPick<T extends { w: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.w, 0)
  let r = rng() * total
  for (const item of items) {
    r -= item.w
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

function randFloat(min: number, max: number): number {
  return rng() * (max - min) + min
}

// ─── District Data (31 Karnataka districts) ───
interface DistrictInfo {
  name: string
  weight: number // population-weighted crime share
  lat: number
  lng: number
  psNames: string[]
  areaNames: string[]
}

const DISTRICTS: DistrictInfo[] = [
  { name: 'Bengaluru Urban', weight: 2800, lat: 12.9716, lng: 77.5946, psNames: ['MG Road PS', 'Whitefield PS', 'Koramangala PS', 'Jayanagar PS', 'Rajajinagar PS', 'Peenya PS', 'Yelahanka PS', 'Banashankari PS'], areaNames: ['Majestic', 'Shivajinagar', 'Indiranagar', 'HSR Layout', 'BTM Layout', 'Marathahalli', 'Electronic City', 'Hebbal', 'KR Market', 'Jalahalli'] },
  { name: 'Mysuru', weight: 850, lat: 12.2958, lng: 76.6394, psNames: ['Saraswathipuram PS', 'Nazarbad PS', 'Lashkar Mohalla PS', 'Vidyaranyapuram PS'], areaNames: ['Mysore Palace Area', 'Gokulam', 'Kuvempunagar', 'Siddhartha Layout', 'Hunsur Road'] },
  { name: 'Hubballi-Dharwad', weight: 680, lat: 15.3647, lng: 75.1240, psNames: ['Hubballi Rural PS', 'Dharwad PS', 'Vidyanagar PS', 'Karnatak Nagar PS'], areaNames: ['Old Hubli', 'Dharwad CBD', 'IIT Area', 'Twin City Road'] },
  { name: 'Mangaluru', weight: 520, lat: 12.9141, lng: 74.8560, psNames: ['Mangaluru North PS', 'Pandeshwar PS', 'Kadri PS', 'Attavar PS'], areaNames: ['Hampankatta', 'KS Rao Road', 'Surathkal', 'Bejai', 'Falnir'] },
  { name: 'Belagavi', weight: 480, lat: 15.8522, lng: 74.4986, psNames: ['Belagavi Town PS', 'Gokak Road PS', 'Camp PS', 'Shahpur PS'], areaNames: ['Raviwar Peth', 'Maruti Galli', 'Tilakwadi', 'Khanapur Road'] },
  { name: 'Tumakuru', weight: 420, lat: 13.0674, lng: 77.1025, psNames: ['Tumakuru City PS', 'Sira Road PS', 'Kyathsandra PS'], areaNames: ['Siddaganga Mutt Area', 'NH-4 Bypass', 'Bus Stand Area'] },
  { name: 'Kalaburagi', weight: 340, lat: 17.3297, lng: 76.8343, psNames: ['Kalaburagi City PS', 'Gulbarga Rural PS', 'Super Market PS'], areaNames: ['Super Market Road', 'Jawahar Nagar', 'SDM College Area'] },
  { name: 'Davanagere', weight: 310, lat: 14.4638, lng: 75.9250, psNames: ['Davanagere City PS', 'Harihar PS'], areaNames: ['Civic Centre', 'Kunduvada Road', 'Areal Road'] },
  { name: 'Ballari', weight: 290, lat: 15.1394, lng: 76.9210, psNames: ['Ballari City PS', 'Toranagallu PS', 'Cantonment PS'], areaNames: ['Bellary Fort Area', 'NH-150', 'Steel Plant Road'] },
  { name: 'Shivamogga', weight: 270, lat: 13.9299, lng: 75.5681, psNames: ['Shivamogga City PS', 'Bhadravathi PS'], areaNames: ['Gandhi Bazaar', 'KSRTC Bus Stand', 'Sagar Road'] },
  { name: 'Dharwad', weight: 250, lat: 15.4527, lng: 75.0075, psNames: ['Dharwad City PS', 'Courtyard PS'], areaNames: ['KCC Bank Road', 'Dharwad Fort', 'University Area'] },
  { name: 'Vijayapura', weight: 240, lat: 16.8303, lng: 75.7100, psNames: ['Vijayapura City PS', 'Twin City PS'], areaNames: ['Gol Gumbaz Area', 'Station Road', 'Adarsh Nagar'] },
  { name: 'Raichur', weight: 220, lat: 16.2076, lng: 77.3463, psNames: ['Raichur City PS', 'Manvi Road PS'], areaNames: ['Raichur Fort Area', 'Station Road', 'Hyderabad Road'] },
  { name: 'Kolar', weight: 210, lat: 13.1367, lng: 78.1291, psNames: ['Kolar City PS', 'Gold Field PS', 'Mulbagal PS'], areaNames: ['Kolar Gold Fields', 'Old Town', 'Bangarpet Road'] },
  { name: 'Bidar', weight: 200, lat: 17.9104, lng: 77.5199, psNames: ['Bidar City PS', 'Gulbarga Road PS'], areaNames: ['Bidar Fort Area', 'Narasimha Jhira', 'Chidri Road'] },
  { name: 'Dakshina Kannada', weight: 190, lat: 12.9187, lng: 75.1175, psNames: ['Mangaluru South PS', 'Ullal PS', 'Bantwal PS'], areaNames: ['Ullal Bridge', 'Panambur', 'Nethravathi Bridge'] },
  { name: 'Chitradurga', weight: 180, lat: 14.2287, lng: 76.3972, psNames: ['Chitradurga City PS', 'Hiriyur PS'], areaNames: ['Chitradurga Fort Area', 'Jagalur Road', 'MH Road'] },
  { name: 'Kodagu', weight: 170, lat: 12.3375, lng: 75.8069, psNames: ['Madikeri Town PS', 'Virajpet PS', 'Somwarpet PS'], areaNames: ['Madikeri Fort Area', 'Raja Seat Road', 'Abbay Falls Road'] },
  { name: 'Udupi', weight: 160, lat: 13.3409, lng: 74.7420, psNames: ['Udupi Town PS', 'Malpe PS', 'Manipal PS'], areaNames: ['Car Street', 'Malpe Beach Road', 'Manipal Circle'] },
  { name: 'Hassan', weight: 155, lat: 13.0072, lng: 76.0994, psNames: ['Hassan City PS', 'Belur PS', 'Sakleshpur PS'], areaNames: ['Bus Stand Area', 'Kenkere Road', 'SH-57'] },
  { name: 'Uttara Kannada', weight: 150, lat: 14.5528, lng: 74.4938, psNames: ['Karwar PS', 'Sirsi PS', 'Honnavar PS'], areaNames: ['Karwar Beach Road', 'NH-66', 'Kali River Bridge'] },
  { name: 'Mandya', weight: 145, lat: 12.5218, lng: 76.8955, psNames: ['Mandya City PS', 'Mysore Road PS', 'Pandavapura PS'], areaNames: ['Bus Stand Area', 'Sugar Factory Road', 'SH-33'] },
  { name: 'Chikkamagaluru', weight: 140, lat: 13.3177, lng: 75.7730, psNames: ['Chikkamagaluru Town PS', 'Mullayanagiri PS'], areaNames: ['Bus Stand Area'] },
  { name: 'Gadag', weight: 130, lat: 15.4167, lng: 75.6314, psNames: ['Gadag Town PS', 'Lakshmeshwar PS'], areaNames: ['KLE Society Road', 'Trikuteshwara Temple Area'] },
  { name: 'Haveri', weight: 125, lat: 14.7961, lng: 75.3965, psNames: ['Haveri Town PS', 'Ranebennur PS'], areaNames: ['Bus Stand Area', 'NH-48'] },
  { name: 'Koppal', weight: 120, lat: 15.3518, lng: 76.1543, psNames: ['Koppal Town PS', 'Gangavathi PS'], areaNames: ['Koppal Fort Area', 'NH-67'] },
  { name: 'Bagalkote', weight: 115, lat: 16.1854, lng: 75.6901, psNames: ['Bagalkote Town PS', 'Jamtaladini PS'], areaNames: ['Bagalkote Fort Area', 'Ilkal Road'] },
  { name: 'Chamarajanagar', weight: 110, lat: 11.9220, lng: 76.9419, psNames: ['Chamarajanagar Town PS', 'Kollegal PS'], areaNames: ['Bus Stand Area', 'BR Hills Road'] },
  { name: 'Yadgir', weight: 105, lat: 16.7688, lng: 77.1321, psNames: ['Yadgir Town PS', 'Shorapur PS'], areaNames: ['Bus Stand Area', 'Hyderabad Highway'] },
  { name: 'Bengaluru Rural', weight: 100, lat: 12.9677, lng: 77.5773, psNames: ['Devanahalli PS', 'Hoskote PS', 'Nelamangala PS'], areaNames: ['Devanahalli Fort', 'NH-44', 'KIA Road'] },
  { name: 'Ramanagara', weight: 95, lat: 12.7179, lng: 77.2776, psNames: ['Ramanagara Town PS', 'Channapatna PS'], areaNames: ['Bangalore-Mysore Road', 'Mysore Road Industrial Area'] },
  { name: 'Vijayanagara', weight: 90, lat: 15.1830, lng: 76.3988, psNames: ['Hospet Town PS', 'Kampli PS'], areaNames: ['Hospet Bus Stand', 'Tungabhadra Dam Road'] },
  { name: 'Chikkaballapur', weight: 85, lat: 13.4340, lng: 78.1027, psNames: ['Chikkaballapur Town PS', 'Bagepalli PS'], areaNames: ['Bus Stand Area', 'NH-44'] },
]

// ─── Crime Types ───
const CRIME_TYPES = [
  { name: 'Theft (IPC 379)', w: 2500, category: 'Property', ipc: '379' },
  { name: 'Assault (IPC 354)', w: 1200, category: 'Violent', ipc: '354' },
  { name: 'Cyber Crime (IT Act 66)', w: 1100, category: 'Cyber', ipc: '66' },
  { name: 'Cheating (IPC 420)', w: 900, category: 'Fraud', ipc: '420' },
  { name: 'Fraud (IPC 420)', w: 700, category: 'Fraud', ipc: '420' },
  { name: 'Vehicle Theft (IPC 379)', w: 680, category: 'Property', ipc: '379' },
  { name: 'Burglary (IPC 457)', w: 650, category: 'Property', ipc: '457' },
  { name: 'Robbery (IPC 392)', w: 500, category: 'Violent', ipc: '392' },
  { name: 'Chain Snatching (IPC 356)', w: 480, category: 'Property', ipc: '356' },
  { name: 'Murder (IPC 302)', w: 200, category: 'Violent', ipc: '302' },
  { name: 'NDPS Act', w: 350, category: 'Narcotics', ipc: 'NDPS' },
  { name: 'Missing Person (IPC 363)', w: 300, category: 'Others', ipc: '363' },
  { name: 'Traffic Offence (MVA)', w: 280, category: 'Others', ipc: 'MVA' },
  { name: 'Rape (IPC 376)', w: 120, category: 'Violent', ipc: '376' },
  { name: 'Kidnapping (IPC 363)', w: 100, category: 'Violent', ipc: '363' },
  { name: 'Human Trafficking (IPC 370)', w: 60, category: 'Organized', ipc: '370' },
  { name: 'Dacoity (IPC 395)', w: 50, category: 'Organized', ipc: '395' },
  { name: 'Arms Act (Sec 25)', w: 40, category: 'Organized', ipc: '25' },
  { name: 'Excise Act', w: 90, category: 'Others', ipc: 'Excise' },
  { name: 'Rioting (IPC 147)', w: 70, category: 'Public Order', ipc: '147' },
  { name: 'Road Accident (MVA 184)', w: 100, category: 'Others', ipc: '184' },
]

const PRIORITIES: Array<{ name: string; w: number }> = [
  { name: 'Low', w: 580 },
  { name: 'Medium', w: 250 },
  { name: 'High', w: 130 },
  { name: 'Critical', w: 40 },
]

const STATUSES: Array<{ name: string; w: number }> = [
  { name: 'Open', w: 380 },
  { name: 'Under Investigation', w: 290 },
  { name: 'Closed', w: 200 },
  { name: 'Charge Sheet Filed', w: 130 },
]

const COMPLAINT_MODES = ['Walk-in', 'Online', 'Phone', 'Email', 'Through Court', 'Source Information']

// ─── Generated Case Type ───
export interface GeneratedCase {
  rowid: string
  fir: string
  crimeType: string
  crimeCategory: string
  district: string
  districtRowid: string
  priority: string
  status: string
  latitude: number
  longitude: number
  place: string
  complaintMode: string
  occurrenceDate: string
  complaintDate: string
  riskScore: number
  isSensitive: boolean
  officerRowid: string
  // Flat counts for generated cases (no nested arrays)
  suspects: []
  vehicles: []
  evidence: []
  arrests: []
  witnesses: []
  similarCases: []
  forensicMatches: []
  hasRepeatOffender: boolean
  suspectCount: number
  evidenceCount: number
  vehicleCount: number
  // Extra fields for freshness
  daysAgo: number
}

// ─── Date Generation — FY 2025-26 (Apr 2025 – Mar 2026) ───
// The fixed period keeps the synthetic prototype reproducible across demos.
// Recent 30 days still get heavier weighting for "live" feel.
const FY_START = new Date(2025, 3, 1)  // Apr 1, 2025
const FY_END   = new Date(2026, 2, 31) // Mar 31, 2026
const FY_TOTAL_DAYS = Math.round((FY_END.getTime() - FY_START.getTime()) / 86400000) // ~365

function generateDate(daysAgo: number, hour?: number): string {
  const d = new Date(FY_END)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour ?? randInt(0, 23), randInt(0, 59), randInt(0, 59))
  // Clamp to FY range
  if (d < FY_START) d.setTime(FY_START.getTime())
  if (d > FY_END) d.setTime(FY_END.getTime())
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

function getDaysAgo(): number {
  const r = rng()
  // Weighted: recent 30 days ~25%, rest spread across full FY
  if (r < 0.015) return 0           // ~150 today (Mar 31)
  if (r < 0.040) return 1           // ~250 yesterday
  if (r < 0.065) return 2           // ~250 two days ago
  if (r < 0.100) return randInt(3, 7)   // ~350 last week
  if (r < 0.150) return randInt(8, 30)  // ~500 last month
  if (r < 0.250) return randInt(31, 90) // ~1000 last quarter
  if (r < 0.450) return randInt(91, 180) // ~2000 first half
  if (r < 0.700) return randInt(181, 273) // ~2500 second half
  return randInt(274, 364)              // ~3000 earliest quarter (Apr–Jun)
}

// ─── Generate All 10K Cases ───
export const TOTAL_CASES = 10000
const totalWeight = DISTRICTS.reduce((s, d) => s + d.weight, 0)

function generateCases(): GeneratedCase[] {
  const cases: GeneratedCase[] = []

  for (let i = 0; i < TOTAL_CASES; i++) {
    const district = weightedPick(DISTRICTS.map(d => ({ ...d, w: d.weight })))
    const crime = weightedPick(CRIME_TYPES)
    const priority = weightedPick(PRIORITIES)
    const status = weightedPick(STATUSES)
    const daysAgo = getDaysAgo()
    const isSensitive = rng() < 0.05 // 5% sensitive
    const hasRepeat = rng() < 0.15 // 15% repeat offender
    const complaintMode = pick(COMPLAINT_MODES)

    // Risk score calculation
    let riskBase = 20
    if (priority.name === 'Critical') riskBase += 40
    else if (priority.name === 'High') riskBase += 25
    else if (priority.name === 'Medium') riskBase += 10
    if (hasRepeat) riskBase += 15
    if (crime.category === 'Violent') riskBase += 10
    if (crime.category === 'Organized') riskBase += 15
    if (isSensitive) riskBase += 5
    const riskScore = Math.min(99, Math.max(5, riskBase + randInt(-10, 15)))

    // Lat/lng with slight jitter from district center
    const lat = district.lat + (rng() - 0.5) * 0.15
    const lng = district.lng + (rng() - 0.5) * 0.15

    // Place name
    const area = district.areaNames[Math.floor(rng() * district.areaNames.length)]
    const place = `${randInt(1, 999)}, ${area}, ${district.name}`

    // PS-based officer rowid
    const ps = district.psNames[Math.floor(rng() * district.psNames.length)]

    const occurrenceDate = generateDate(daysAgo, randInt(0, 23))
    const complaintDate = generateDate(daysAgo, randInt(8, 22)) // complaint after occurrence

    cases.push({
      rowid: `GEN-${String(i + 1).padStart(6, '0')}`,
      fir: `FIR/2026/KSP/${String(i + 1).padStart(5, '0')}`,
      crimeType: crime.name,
      crimeCategory: crime.category,
      district: district.name,
      districtRowid: `DST-${district.name}`,
      priority: priority.name,
      status: status.name,
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lng * 10000) / 10000,
      place,
      complaintMode,
      occurrenceDate,
      complaintDate,
      riskScore: Math.round(riskScore),
      isSensitive,
      officerRowid: ps,
      suspects: [],
      vehicles: [],
      evidence: [],
      arrests: [],
      witnesses: [],
      similarCases: [],
      forensicMatches: [],
      hasRepeatOffender: hasRepeat,
      suspectCount: randInt(1, 4),
      evidenceCount: randInt(0, 8),
      vehicleCount: rng() < 0.3 ? randInt(1, 3) : 0,
      daysAgo,
    })
  }

  // Sort by date descending (newest first)
  cases.sort((a, b) => a.daysAgo - b.daysAgo)
  return cases
}

// ─── Generate & Export ───
export const GENERATED_CASES: GeneratedCase[] = generateCases()

// ─── Aggregation Helpers ───

export function getGeneratedDistrictStats(): Record<string, { total: number; open: number; closed: number; critical: number; active: number; byType: Record<string, number> }> {
  const stats: Record<string, any> = {}
  for (const c of GENERATED_CASES) {
    if (!stats[c.district]) {
      stats[c.district] = { total: 0, open: 0, closed: 0, critical: 0, active: 0, byType: {} }
    }
    const s = stats[c.district]
    s.total++
    if (c.status === 'Open' || c.status === 'Under Investigation') { s.open++; s.active++ }
    if (c.status === 'Closed' || c.status === 'Charge Sheet Filed') s.closed++
    if (c.priority === 'Critical' || c.priority === 'High') s.critical++
    s.byType[c.crimeType] = (s.byType[c.crimeType] || 0) + 1
  }
  return stats
}

export function getGeneratedCrimeTypeStats(): { name: string; count: number; category: string }[] {
  const map: Record<string, { count: number; category: string }> = {}
  for (const c of GENERATED_CASES) {
    if (!map[c.crimeType]) map[c.crimeType] = { count: 0, category: c.crimeCategory }
    map[c.crimeType].count++
  }
  return Object.entries(map)
    .map(([name, v]) => ({ name, count: v.count, category: v.category }))
    .sort((a, b) => b.count - a.count)
}

export function getGeneratedStats() {
  const total = GENERATED_CASES.length
  const open = GENERATED_CASES.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length
  const closed = GENERATED_CASES.filter(c => c.status === 'Closed').length
  const chargesheeted = GENERATED_CASES.filter(c => c.status === 'Charge Sheet Filed').length
  const arrests = Math.round(total * 0.38) // ~38% arrest rate
  const critical = GENERATED_CASES.filter(c => c.priority === 'Critical').length
  const repeatOffenders = GENERATED_CASES.filter(c => c.hasRepeatOffender).length
  const districts = new Set(GENERATED_CASES.map(c => c.district)).size
  const today = GENERATED_CASES.filter(c => c.daysAgo === 0).length
  const yesterday = GENERATED_CASES.filter(c => c.daysAgo === 1).length

  return {
    totalCases: total,
    activeInvestigations: open,
    arrests,
    chargesheets: chargesheeted,
    districts,
    officers: 156,
    critical,
    repeatOffenders,
    closed,
    todayCount: today,
    yesterdayCount: yesterday,
  }
}

export function getRecentCases(count: number = 30): GeneratedCase[] {
  return GENERATED_CASES.slice(0, count)
}

export function getTodayCases(): GeneratedCase[] {
  return GENERATED_CASES.filter(c => c.daysAgo === 0)
}

export function getOvernightCases(): GeneratedCase[] {
  return GENERATED_CASES.filter(c => c.daysAgo <= 1)
}

export function getCasesByDistrict(districtName: string): GeneratedCase[] {
  return GENERATED_CASES.filter(c => c.district === districtName)
}

export function getHourlyDistribution(): { hour: string; count: number }[] {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, count: 0 }))
  for (const c of GENERATED_CASES) {
    const h = parseInt(c.occurrenceDate.split(' ')[1]?.split(':')[0] || '12')
    if (h >= 0 && h < 24) hours[h].count++
  }
  return hours
}

export function getMonthlyDistribution(): { month: string; cases: number }[] {
  const months: Record<string, number> = {}
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (const c of GENERATED_CASES) {
    const m = parseInt(c.occurrenceDate.split('-')[1] || '1')
    const key = monthNames[m - 1] || 'Jan'
    months[key] = (months[key] || 0) + 1
  }
  return monthNames.map(m => ({ month: m, cases: months[m] || 0 }))
}

// Ticker items format (compatible with store TickerItem)
export function getTickerItems(): { id: string; fir: string; district: string; crimeType: string; priority: string; status: string; date: string }[] {
  return GENERATED_CASES.slice(0, 50).map(c => ({
    id: c.rowid,
    fir: c.fir,
    district: c.district,
    crimeType: c.crimeType,
    priority: c.priority,
    status: c.status,
    date: c.occurrenceDate,
  }))
}

// Priority distribution (for severity chart)
export function getGeneratedPriorityStats(): { name: string; value: number; color: string }[] {
  const counts: Record<string, number> = {}
  for (const c of GENERATED_CASES) {
    counts[c.priority] = (counts[c.priority] || 0) + 1
  }
  const colorMap: Record<string, string> = {
    Critical: '#f87171',
    High: '#fb923c',
    Medium: '#94a3b8',
    Low: '#475569',
  }
  return ['Critical', 'High', 'Medium', 'Low']
    .map(name => ({ name, value: counts[name] || 0, color: colorMap[name] || '#475569' }))
}

// Status pipeline (for pipeline chart)
export function getGeneratedStatusPipeline(): { label: string; count: number; color: string; pct: number }[] {
  const counts: Record<string, number> = {}
  for (const c of GENERATED_CASES) {
    counts[c.status] = (counts[c.status] || 0) + 1
  }
  const order = ['Open', 'Under Investigation', 'Charge Sheet Filed', 'Closed']
  const colorMap: Record<string, string> = {
    Open: '#34d399',
    'Under Investigation': '#6ee7b7',
    'Charge Sheet Filed': '#a7f3d0',
    Closed: '#475569',
  }
  const maxCount = Math.max(...order.map(s => counts[s] || 0), 1)
  return order.map(label => ({
    label,
    count: counts[label] || 0,
    color: colorMap[label] || '#475569',
    pct: Math.round(((counts[label] || 0) / maxCount) * 100),
  }))
}

// SP Scorecard — computed from 10K data with realistic SP names
const SP_NAMES: Record<string, string> = {
  'Bengaluru Urban': 'SP C.B. Ramesh',
  'Mysuru': 'SP R. Narayana',
  'Hubballi-Dharwad': 'SP S.B. Patil',
  'Mangaluru': 'SP N. Shashi Kumar',
  'Belagavi': 'SP M.B. Patil',
  'Kalaburagi': 'SP Jagadish Patil S',
  'Tumakuru': 'SP H.R. Kumar',
  'Davanagere': 'SP K. Ravi',
  'Ballari': 'SP D. Venkatesh',
  'Shivamogga': 'SP K. Suresh',
}

const SP_TRENDS: Record<string, string> = {
  'Bengaluru Urban': '+4.2%',
  'Mysuru': '-1.3%',
  'Hubballi-Dharwad': '+2.1%',
  'Mangaluru': '+3.5%',
  'Belagavi': '+2.8%',
  'Kalaburagi': '-6.1%',
  'Tumakuru': '+1.8%',
  'Davanagere': '+0.5%',
  'Ballari': '-2.3%',
  'Shivamogga': '+0.7%',
}

export function getSPScorecard(): { district: string; sp: string; firs: number; open: number; disposed: number; closure: number; trend: string }[] {
  const stats = getGeneratedDistrictStats()
  return Object.entries(stats)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([district, s]) => {
      const disposed = s.closed
      const closure = s.total > 0 ? Math.round((disposed / s.total) * 100) : 0
      return {
        district,
        sp: SP_NAMES[district] || `SP ${district.split(' ')[0]}`,
        firs: s.total,
        open: s.open,
        disposed,
        closure,
        trend: SP_TRENDS[district] || `${(Math.random() > 0.5 ? '+' : '-')}${(Math.random() * 5).toFixed(1)}%`,
      }
    })
}

// District map data for Geo Intel
export function getDistrictMapData(): { name: string; totalCases: number; activeCases: number; criticalCases: number; byType: Record<string, number>; latitude: number; longitude: number }[] {
  const stats = getGeneratedDistrictStats()
  return DISTRICTS.map(d => ({
    name: d.name,
    totalCases: stats[d.name]?.total ?? 0,
    activeCases: stats[d.name]?.active ?? 0,
    criticalCases: stats[d.name]?.critical ?? 0,
    byType: stats[d.name]?.byType ?? {},
    latitude: d.lat,
    longitude: d.lng,
  }))
}
