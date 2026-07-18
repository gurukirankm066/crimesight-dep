/**
 * Data Access Layer - Shared helpers for API routes
 * Since there are no Prisma @relation directives, we manually join data
 * using fetch-then-merge pattern.
 */
import { db } from '@/lib/db'
import type {
  District, Unit, CrimeType, CrimeCategory, Act, Section,
  Employee, Rank, Designation, EvidenceType, VehicleType, UserRole
} from '@prisma/client'

// ─── Lookup Maps (cached per request) ─────────────────────────────────

type LookupMap<T> = Map<string, T>

let _districts: LookupMap<District> | null = null
let _units: LookupMap<Unit> | null = null
let _crimeTypes: LookupMap<CrimeType> | null = null
let _crimeCategories: LookupMap<CrimeCategory> | null = null
let _acts: LookupMap<Act> | null = null
let _sections: LookupMap<Section> | null = null
let _employees: LookupMap<Employee> | null = null
let _ranks: LookupMap<Rank> | null = null
let _designations: LookupMap<Designation> | null = null
let _evidenceTypes: LookupMap<EvidenceType> | null = null
let _vehicleTypes: LookupMap<VehicleType> | null = null
let _userRoles: LookupMap<UserRole> | null = null

function toMap<T extends { ROWID: string }>(rows: T[]): LookupMap<T> {
  const m = new Map<string, T>()
  for (const row of rows) m.set(row.ROWID, row)
  return m
}

export async function getDistricts() {
  if (!_districts) _districts = toMap(await db.district.findMany())
  return _districts
}
export async function getUnits() {
  if (!_units) _units = toMap(await db.unit.findMany())
  return _units
}
export async function getCrimeTypes() {
  if (!_crimeTypes) _crimeTypes = toMap(await db.crimeType.findMany())
  return _crimeTypes
}
export async function getCrimeCategories() {
  if (!_crimeCategories) _crimeCategories = toMap(await db.crimeCategory.findMany())
  return _crimeCategories
}
export async function getActs() {
  if (!_acts) _acts = toMap(await db.act.findMany())
  return _acts
}
export async function getSections() {
  if (!_sections) _sections = toMap(await db.section.findMany())
  return _sections
}
export async function getEmployees() {
  if (!_employees) _employees = toMap(await db.employee.findMany())
  return _employees
}
export async function getRanks() {
  if (!_ranks) _ranks = toMap(await db.rank.findMany())
  return _ranks
}
export async function getDesignations() {
  if (!_designations) _designations = toMap(await db.designation.findMany())
  return _designations
}
export async function getEvidenceTypes() {
  if (!_evidenceTypes) _evidenceTypes = toMap(await db.evidenceType.findMany())
  return _evidenceTypes
}
export async function getVehicleTypes() {
  if (!_vehicleTypes) _vehicleTypes = toMap(await db.vehicleType.findMany())
  return _vehicleTypes
}
export async function getUserRoles() {
  if (!_userRoles) _userRoles = toMap(await db.userRole.findMany())
  return _userRoles
}

/** Clear all cached lookups (useful in dev / HMR) */
export function clearLookups() {
  _districts = _units = _crimeTypes = _crimeCategories = _acts = _sections = null
  _employees = _ranks = _designations = _evidenceTypes = _vehicleTypes = _userRoles = null
}

/** Parse datetime string that may be "2025-03-14 19:51:38" or "2025-03-14 19:51:38:000" */
export function parseDatetime(raw: string | null | undefined): Date | null {
  if (!raw) return null
  // Normalize: take first 19 chars "YYYY-MM-DD HH:MM:SS"
  const trimmed = raw.substring(0, 19)
  const d = new Date(trimmed.replace(' ', 'T'))
  return isNaN(d.getTime()) ? null : d
}

/** Extract hour (0-23) from datetime string */
export function extractHour(raw: string | null | undefined): number | null {
  const d = parseDatetime(raw)
  return d ? d.getHours() : null
}

/** Extract "YYYY-MM" from datetime string */
export function extractMonth(raw: string | null | undefined): string | null {
  const d = parseDatetime(raw)
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : null
}

/**
 * Enrich an array of case-like objects with district_name and crime_type_name.
 * The case object must have district_rowid and crime_type_rowid.
 */
export async function enrichCases<T extends { district_rowid: string; crime_type_rowid: string }>(
  cases: T[]
): Promise<(T & { district_name: string; crime_type_name: string })[]> {
  const [districts, crimeTypes] = await Promise.all([getDistricts(), getCrimeTypes()])
  return cases.map((c) => ({
    ...c,
    district_name: districts.get(c.district_rowid)?.district_name ?? 'Unknown',
    crime_type_name: crimeTypes.get(c.crime_type_rowid)?.crime_type_name ?? 'Unknown',
  }))
}