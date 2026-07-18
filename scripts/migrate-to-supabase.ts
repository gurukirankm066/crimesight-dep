/**
 * Fast SQLite → Supabase Migration
 * Uses bun:sqlite + pg with batched INSERT (50 rows per query).
 */

import { Database } from 'bun:sqlite'
import pg from 'pg'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SQLITE_PATH = './db/custom.db'
const BATCH_SIZE = 50

if (!SUPABASE_URL) { console.error('❌ SUPABASE_URL not set'); process.exit(1) }

const TABLE_ORDER = [
  'State', 'District', 'Unit', 'Rank', 'Designation', 'UserRole', 'Employee',
  'CrimeType', 'CrimeCategory', 'Act', 'Section', 'EvidenceType', 'VehicleType',
  'CaseMaster', 'Suspect', 'Victim', 'Witness', 'Evidence', 'Property', 'Vehicle',
  'ArrestSurrender', 'Chargesheet', 'InvestigationActivity', 'CaseAssignment',
]

async function main() {
  const t0 = Date.now()
  console.log('╔════════════════════════════════════════════════════╗')
  console.log('║  CrimeSight AI — Fast SQLite → Supabase Migration  ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  // Open SQLite
  console.log('📦 Reading SQLite...')
  const sqlite = new Database(SQLITE_PATH, { readonly: true })
  const sqliteTables: string[] = sqlite.query("SELECT name FROM sqlite_master WHERE type='table'").all().map((r: any) => r.name)

  // Connect to Supabase
  console.log('🔗 Connecting to Supabase...')
  const pool = new pg.Pool({ connectionString: SUPABASE_URL, max: 3 })
  await pool.query('SELECT 1')
  console.log('  ✅ Connected\n')

  // ── Clear existing data first (for clean re-run) ──────────────────────
  console.log('🧹 Clearing existing data...')
  for (const table of [...TABLE_ORDER].reverse()) {
    await pool.query(`TRUNCATE "${table}" CASCADE`)
  }
  console.log('  ✅ Cleared\n')

  // ── Migrate ────────────────────────────────────────────────────────────
  console.log('🚀 Migrating (batch size: ' + BATCH_SIZE + ')...\n')

  let totalImported = 0

  for (const table of TABLE_ORDER) {
    if (!sqliteTables.includes(table)) {
      console.log(`  ⏭️  ${table}: not found`)
      continue
    }

    const rows: Record<string, any>[] = sqlite.query(`SELECT * FROM "${table}"`).all() as any[]
    if (rows.length === 0) {
      console.log(`  ⏭️  ${table}: 0 rows`)
      continue
    }

    const columns = Object.keys(rows[0])
    const colList = columns.map(c => `"${c}"`).join(', ')

    // Process in batches
    let tableImported = 0
    for (let b = 0; b < rows.length; b += BATCH_SIZE) {
      const batch = rows.slice(b, b + BATCH_SIZE)
      const valueGroups: string[] = []
      const allValues: any[] = []
      let paramIdx = 1

      for (const row of batch) {
        const placeholders: string[] = []
        for (const col of columns) {
          const val = row[col]
          placeholders.push(`$${paramIdx}`)
          if (val === null || val === undefined) allValues.push(null)
          else if (typeof val === 'boolean') allValues.push(val)
          else if (typeof val === 'number') allValues.push(val)
          else allValues.push(String(val))
          paramIdx++
        }
        valueGroups.push(`(${placeholders.join(', ')})`)
      }

      const sql = `INSERT INTO "${table}" (${colList}) VALUES ${valueGroups.join(', ')} ON CONFLICT ("ROWID") DO NOTHING`

      try {
        const res = await pool.query(sql, allValues)
        tableImported += res.rowCount || 0
      } catch (err: any) {
        // Fallback: try individual inserts for this batch
        for (const row of batch) {
          const vals = columns.map(col => {
            const val = row[col]
            if (val === null || val === undefined) return null
            if (typeof val === 'boolean') return val
            if (typeof val === 'number') return val
            return String(val)
          })
          const p = columns.map((_, i) => `$${i + 1}`).join(', ')
          try {
            const r = await pool.query(`INSERT INTO "${table}" (${colList}) VALUES (${p}) ON CONFLICT ("ROWID") DO NOTHING`, vals)
            tableImported += r.rowCount || 0
          } catch { /* skip bad rows */ }
        }
      }

      // Progress
      const done = Math.min(b + BATCH_SIZE, rows.length)
      const pct = Math.round((done / rows.length) * 100)
      process.stdout.write(`\r  ${table}: ${'█'.repeat(Math.round(pct / 2.5))}${'░'.repeat(40 - Math.round(pct / 2.5))} ${pct}% (${done}/${rows.length})`)
    }

    console.log(` ✅ ${tableImported} rows`)
    totalImported += tableImported
  }

  sqlite.close()
  await pool.end()

  // ── Verify ───────────────────────────────────────────────────────────────
  console.log('\n🔍 Verification:\n')
  const vp = new pg.Pool({ connectionString: SUPABASE_URL })
  let verifyTotal = 0
  for (const table of TABLE_ORDER) {
    try {
      const r = await vp.query(`SELECT COUNT(*) as c FROM "${table}"`)
      const c = parseInt(r.rows[0].c)
      verifyTotal += c
      console.log(`  ${c > 0 ? '✅' : '⚠️ '} ${table}: ${c}`)
    } catch (err: any) {
      console.log(`  ❌ ${table}: ${err.message?.slice(0, 60)}`)
    }
  }
  await vp.end()

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`\n═══════════════════════════════════════════`)
  console.log(`  ✨ Done in ${elapsed}s | ${totalImported} imported | ${verifyTotal} verified`)
  console.log(`═══════════════════════════════════════════\n`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })