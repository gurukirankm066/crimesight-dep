import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const db = new PrismaClient()
const DATA_DIR = join(process.cwd(), 'prisma', 'data')

// CSV parser handling quoted fields
function parseCSV(content: string): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return rows

  const headers = parseCSVLine(lines[0])
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'; i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') { inQuotes = true }
      else if (ch === ',') { result.push(current.trim()); current = '' }
      else { current += ch }
    }
  }
  result.push(current.trim())
  return result
}

function toBool(val: string): boolean { return val === 'true' }
function toFloat(val: string): number | null { const n = parseFloat(val); return isNaN(n) ? null : n }
function emptyToNull(val: string): string | null { return val === '' ? null : val }

// Model field type mapping
interface FieldConfig {
  field: string
  type: 'string' | 'bool' | 'int' | 'float' | 'nullableString' | 'nullableFloat'
}

const MODEL_CONFIGS: Record<string, { file: string; fields: FieldConfig[] }> = {
  Rank: {
    file: 'Table-Rank.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'rank_name', type: 'string' }, { field: 'hierarchy', type: 'string' },
      { field: 'is_active', type: 'bool' }, { field: 'rank_code', type: 'string' },
    ]
  },
  Designation: {
    file: 'Table-Designation.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'designation_name', type: 'string' }, { field: 'sort_order', type: 'int' },
      { field: 'is_active', type: 'bool' }, { field: 'designation_code', type: 'string' },
    ]
  },
  UserRole: {
    file: 'Table-UserRole.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'role_name', type: 'string' }, { field: 'role_code', type: 'string' },
      { field: 'description', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  CrimeType: {
    file: 'Table-CrimeType.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'crime_type_name', type: 'string' }, { field: 'crime_type_code', type: 'string' },
      { field: 'description', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  CrimeCategory: {
    file: 'Table-CrimeCategory.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'crime_category_name', type: 'string' }, { field: 'crime_category_code', type: 'string' },
      { field: 'description', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  Act: {
    file: 'Table-Act.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'act_name', type: 'string' }, { field: 'act_code', type: 'string' },
      { field: 'description', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  Section: {
    file: 'Table-Section.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'section_code', type: 'string' }, { field: 'section_title', type: 'string' },
      { field: 'act_rowid', type: 'string' }, { field: 'description', type: 'string' },
      { field: 'is_active', type: 'bool' },
    ]
  },
  EvidenceType: {
    file: 'Table-EvidenceType.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'evidence_type_name', type: 'string' }, { field: 'evidence_type_code', type: 'string' },
      { field: 'description', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  VehicleType: {
    file: 'Table-VehicleType.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'vehicle_type_name', type: 'string' }, { field: 'vehicle_type_code', type: 'string' },
      { field: 'description', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  State: {
    file: '__MANUAL__',
    fields: []
  },
  District: {
    file: 'Table-District.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'district_name', type: 'string' }, { field: 'district_code', type: 'string' },
      { field: 'state_rowid', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  Unit: {
    file: 'Table-Unit.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'unit_name', type: 'string' }, { field: 'unit_code', type: 'string' },
      { field: 'district_rowid', type: 'string' }, { field: 'unit_type', type: 'string' },
      { field: 'address', type: 'string' }, { field: 'latitude', type: 'string' },
      { field: 'longitude', type: 'string' }, { field: 'contact_number', type: 'string' },
      { field: 'email', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  Employee: {
    file: 'Table-Employee.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'employee_id', type: 'string' }, { field: 'full_name', type: 'string' },
      { field: 'badge_number', type: 'string' }, { field: 'email', type: 'string' },
      { field: 'phone', type: 'string' }, { field: 'rank_rowid', type: 'string' },
      { field: 'designation_rowid', type: 'string' }, { field: 'unit_rowid', type: 'string' },
      { field: 'role_rowid', type: 'string' }, { field: 'profile_photo', type: 'string' },
      { field: 'biometric_id', type: 'string' }, { field: 'is_active', type: 'bool' },
    ]
  },
  CaseMaster: {
    file: 'Table-CaseMaster.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'fir_number', type: 'string' }, { field: 'crime_type_rowid', type: 'string' },
      { field: 'crime_category_rowid', type: 'string' }, { field: 'act_rowid', type: 'string' },
      { field: 'section_rowid', type: 'string' }, { field: 'unit_rowid', type: 'string' },
      { field: 'district_rowid', type: 'string' }, { field: 'state_rowid', type: 'string' },
      { field: 'occurrence_datetime', type: 'string' }, { field: 'complaint_datetime', type: 'string' },
      { field: 'latitude', type: 'string' }, { field: 'longitude', type: 'string' },
      { field: 'place_of_occurrence', type: 'string' }, { field: 'complaint_mode', type: 'string' },
      { field: 'case_priority', type: 'string' }, { field: 'case_status', type: 'string' },
      { field: 'investigation_officer_rowid', type: 'string' },
      { field: 'created_by_rowid', type: 'string' },
      { field: 'ai_risk_score', type: 'nullableFloat' },
      { field: 'ai_summary', type: 'nullableString' },
      { field: 'is_sensitive', type: 'bool' },
    ]
  },
  Suspect: {
    file: 'Table-Suspect.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'suspect_name', type: 'string' },
      { field: 'gender', type: 'string' }, { field: 'age', type: 'string' },
      { field: 'phone', type: 'string' }, { field: 'email', type: 'string' },
      { field: 'aadhaar_number', type: 'string' }, { field: 'address', type: 'string' },
      { field: 'occupation', type: 'string' }, { field: 'arrest_status', type: 'string' },
      { field: 'is_repeat_offender', type: 'bool' }, { field: 'remarks', type: 'string' },
    ]
  },
  Victim: {
    file: 'Table-Victim.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'victim_name', type: 'string' },
      { field: 'gender', type: 'string' }, { field: 'age', type: 'string' },
      { field: 'phone', type: 'string' }, { field: 'email', type: 'string' },
      { field: 'aadhaar_number', type: 'string' }, { field: 'address', type: 'string' },
      { field: 'occupation', type: 'string' }, { field: 'injury_details', type: 'string' },
      { field: 'statement', type: 'string' }, { field: 'is_primary', type: 'bool' },
    ]
  },
  Witness: {
    file: 'Table-Witness.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'witness_name', type: 'string' },
      { field: 'phone', type: 'string' }, { field: 'email', type: 'string' },
      { field: 'address', type: 'string' }, { field: 'statement', type: 'string' },
      { field: 'witness_type', type: 'string' },
    ]
  },
  Evidence: {
    file: 'Table-Evidence.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'evidence_type_rowid', type: 'string' },
      { field: 'evidence_name', type: 'string' }, { field: 'description', type: 'string' },
      { field: 'file_url', type: 'string' }, { field: 'collected_by_rowid', type: 'string' },
      { field: 'collection_datetime', type: 'string' }, { field: 'chain_of_custody', type: 'string' },
      { field: 'forensic_status', type: 'string' },
    ]
  },
  Property: {
    file: 'Table-Property.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'property_name', type: 'string' },
      { field: 'property_type', type: 'string' }, { field: 'estimated_value', type: 'float' },
      { field: 'recovered_status', type: 'bool' }, { field: 'description', type: 'string' },
    ]
  },
  Vehicle: {
    file: 'Table-Vehicle.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'vehicle_number', type: 'string' },
      { field: 'vehicle_type_rowid', type: 'string' }, { field: 'make', type: 'string' },
      { field: 'model', type: 'string' }, { field: 'color', type: 'string' },
      { field: 'owner_name', type: 'string' }, { field: 'chassis_number', type: 'string' },
      { field: 'engine_number', type: 'string' }, { field: 'seized_status', type: 'bool' },
    ]
  },
  ArrestSurrender: {
    file: 'Table-ArrestSurrender.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'accused_rowid', type: 'string' },
      { field: 'arrest_type', type: 'string' }, { field: 'arrest_datetime', type: 'string' },
      { field: 'arrest_location', type: 'string' },
      { field: 'arresting_officer_rowid', type: 'string' }, { field: 'remarks', type: 'string' },
    ]
  },
  Chargesheet: {
    file: 'Table-Chargesheet.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'filing_date', type: 'string' },
      { field: 'court_name', type: 'string' }, { field: 'judge_name', type: 'string' },
      { field: 'chargesheet_number', type: 'string' }, { field: 'filing_status', type: 'string' },
      { field: 'document_url', type: 'string' },
    ]
  },
  InvestigationActivity: {
    file: 'Table-InvestigationActivity.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'activity_type', type: 'string' },
      { field: 'activity_description', type: 'string' }, { field: 'activity_datetime', type: 'string' },
      { field: 'officer_rowid', type: 'string' }, { field: 'attachment_url', type: 'string' },
    ]
  },
  CaseAssignment: {
    file: 'Table-CaseAssignment.csv',
    fields: [
      { field: 'ROWID', type: 'string' }, { field: 'CREATORID', type: 'string' },
      { field: 'CREATEDTIME', type: 'string' }, { field: 'MODIFIEDTIME', type: 'string' },
      { field: 'case_rowid', type: 'string' }, { field: 'assigned_to_rowid', type: 'string' },
      { field: 'assigned_by_rowid', type: 'string' }, { field: 'assigned_datetime', type: 'string' },
      { field: 'assignment_status', type: 'string' }, { field: 'remarks', type: 'string' },
    ]
  },
}

function transformRow(row: Record<string, string>, fields: FieldConfig[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const f of fields) {
    const val = row[f.field] || ''
    switch (f.type) {
      case 'string': result[f.field] = val; break
      case 'bool': result[f.field] = toBool(val); break
      case 'int': result[f.field] = parseInt(val) || 0; break
      case 'float': result[f.field] = toFloat(val) || 0; break
      case 'nullableString': result[f.field] = emptyToNull(val); break
      case 'nullableFloat': result[f.field] = toFloat(val); break
    }
  }
  return result
}

async function importModel(modelName: string) {
  const config = MODEL_CONFIGS[modelName]
  if (!config) return 0

  // Handle State specially
  if (modelName === 'State') {
    await db.state.create({
      data: {
        ROWID: '49093000000013007', CREATORID: 'SYSTEM',
        CREATEDTIME: '2026-06-28 00:00:00:000', MODIFIEDTIME: '2026-06-28 00:00:00:000',
        state_name: 'Karnataka', state_code: 'KA', is_active: true,
      }
    })
    console.log(`  State: 1 record (manual)`)
    return 1
  }

  const filePath = join(DATA_DIR, config.file)
  const content = readFileSync(filePath, 'utf-8')
  const rows = parseCSV(content)
  // Prisma uses camelCase: UserRole -> userRole, CaseMaster -> caseMaster, etc.
  const camelCase = modelName.replace(/^[A-Z]/, c => c.toLowerCase()).replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
  const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1) as keyof typeof db
  const model = db[modelKey] as any

  // Use createMany for bulk insert
  const BATCH = 200
  let imported = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map(r => transformRow(r, config.fields))
    await model.createMany({ data: batch })
    imported += batch.length
  }
  console.log(`  ${modelName}: ${imported} records`)
  return imported
}

async function main() {
  console.log('CrimesightAI Data Import\n')
  const start = Date.now()

  const order = [
    'Rank', 'Designation', 'UserRole', 'CrimeType', 'CrimeCategory',
    'Act', 'Section', 'EvidenceType', 'VehicleType', 'State',
    'District', 'Unit', 'Employee', 'CaseMaster',
    'Suspect', 'Victim', 'Witness', 'Evidence', 'Property', 'Vehicle',
    'ArrestSurrender', 'Chargesheet', 'InvestigationActivity', 'CaseAssignment',
  ]

  let total = 0
  for (const model of order) {
    const count = await importModel(model)
    total += count
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\nTotal: ${total} records in ${elapsed}s`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())