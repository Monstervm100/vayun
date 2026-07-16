import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Development persistence: a JSON file with the same shape the Postgres
 * schema models (see db/schema.sql). The API layer only talks to these
 * functions, so swapping in Supabase/Postgres is a drop-in replacement.
 */

const here = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(here, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'store.json')

export interface SyncRecord {
  studentId: string
  name: string
  version: number
  /** opaque client progress blob (ratings, xp, attempts …) */
  blob: unknown
  tournamentScore: number
  updatedAt: string
}

interface Db {
  students: Record<string, SyncRecord>
}

function load(): Db {
  if (!existsSync(DATA_FILE)) return { students: {} }
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as Db
  } catch {
    return { students: {} }
  }
}

function save(db: Db): void {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

export function getStudent(studentId: string): SyncRecord | null {
  return load().students[studentId] ?? null
}

/** versioned upsert — returns the stored record, or null on version conflict */
export function putStudent(rec: Omit<SyncRecord, 'updatedAt'>): SyncRecord | null {
  const db = load()
  const existing = db.students[rec.studentId]
  if (existing && rec.version <= existing.version) return null
  const stored: SyncRecord = { ...rec, updatedAt: new Date().toISOString() }
  db.students[rec.studentId] = stored
  save(db)
  return stored
}

export function leaderboard(limit = 20): { name: string; score: number }[] {
  const db = load()
  return Object.values(db.students)
    .map((s) => ({ name: s.name, score: s.tournamentScore }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
