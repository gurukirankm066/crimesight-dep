import fs from 'node:fs/promises'
import path from 'node:path'

const outputDir = '/private/tmp/crimesight-foundry-upload'
const districts = [
  ['Bengaluru Urban', 'Koramangala PS', 12.9352, 77.6245],
  ['Mysuru', 'Nazarbad PS', 12.3051, 76.6551],
  ['Mangaluru', 'Pandeshwar PS', 12.8698, 74.8421],
  ['Belagavi', 'Camp PS', 15.8497, 74.4977],
  ['Hubballi-Dharwad', 'Vidyanagar PS', 15.3647, 75.1240],
]
const crimes = [
  ['Theft', 'Property'], ['Cyber Crime', 'Cyber'], ['Vehicle Theft', 'Property'], ['Fraud', 'Fraud'], ['Assault', 'Violent'],
]
const officers = [
  ['OFF-001', 'PSI Ananya Rao', 'Bengaluru Urban'], ['OFF-002', 'PSI Ravi Kumar', 'Mysuru'], ['OFF-003', 'PSI Nisha Shetty', 'Mangaluru'], ['OFF-004', 'PSI Arjun Patil', 'Belagavi'], ['OFF-005', 'PSI Farhan Khan', 'Hubballi-Dharwad'],
]
const escape = (value) => `"${String(value).replaceAll('"', '""')}"`
const csv = (headers, rows) => [headers.join(','), ...rows.map(row => row.map(escape).join(','))].join('\n') + '\n'

const firs = []
const people = []
const evidence = []
const locations = districts.map(([district, station, lat, lng], i) => [`LOC-${String(i + 1).padStart(3, '0')}`, district, station, lat, lng])

for (let index = 1; index <= 100; index++) {
  const districtIndex = (index - 1) % districts.length
  const [district, station, lat, lng] = districts[districtIndex]
  const [crimeType, category] = crimes[(index - 1) % crimes.length]
  const priority = index % 17 === 0 ? 'Critical' : index % 5 === 0 ? 'High' : 'Medium'
  const status = index % 4 === 0 ? 'Under Investigation' : index % 3 === 0 ? 'Open' : 'Closed'
  const firNumber = `SYN-FIR-2026-${String(index).padStart(4, '0')}`
  const personId = `PER-${String(index).padStart(4, '0')}`
  const evidenceId = `EVD-${String(index).padStart(4, '0')}`
  const officerId = officers[districtIndex][0]
  const date = `2026-${String(1 + ((index - 1) % 3)).padStart(2, '0')}-${String(1 + ((index * 3) % 27)).padStart(2, '0')}`
  const risk = Math.min(96, 38 + (index * 7) % 56)
  firs.push([firNumber, crimeType, category, priority, status, date, district, `LOC-${String(districtIndex + 1).padStart(3, '0')}`, officerId, risk, index % 9 === 0, index % 7 === 0, 'Synthetic KSP ER-aligned prototype record'])
  people.push([personId, firNumber, index % 4 === 0 ? 'Witness' : index % 3 === 0 ? 'Victim' : 'Suspect', `Synthetic Person ${String(index).padStart(3, '0')}`, index % 7 === 0, district])
  evidence.push([evidenceId, firNumber, index % 2 === 0 ? 'CCTV Footage' : 'Digital Device', index % 3 === 0 ? 'Under Analysis' : 'Collected', 'Synthetic evidence placeholder'])
}

await fs.mkdir(outputDir, { recursive: true })
await Promise.all([
  fs.writeFile(path.join(outputDir, 'fir_cases.csv'), csv(['fir_number', 'crime_type', 'crime_category', 'priority', 'case_status', 'occurrence_date', 'district', 'location_id', 'officer_id', 'risk_score', 'is_sensitive', 'repeat_indicator', 'provenance'], firs)),
  fs.writeFile(path.join(outputDir, 'persons.csv'), csv(['person_id', 'fir_number', 'role', 'display_name', 'repeat_indicator', 'district'], people)),
  fs.writeFile(path.join(outputDir, 'locations.csv'), csv(['location_id', 'district', 'police_station', 'latitude', 'longitude'], locations)),
  fs.writeFile(path.join(outputDir, 'officers.csv'), csv(['officer_id', 'display_name', 'district'], officers)),
  fs.writeFile(path.join(outputDir, 'evidence_items.csv'), csv(['evidence_id', 'fir_number', 'evidence_type', 'forensic_status', 'provenance'], evidence)),
  fs.writeFile(path.join(outputDir, 'README.txt'), 'CrimeSight Foundry demo data\n100 synthetic, non-operational FIR records.\nAll names, relationships, identifiers, locations, evidence, and scores are synthetic.\n'),
])
console.log(outputDir)
