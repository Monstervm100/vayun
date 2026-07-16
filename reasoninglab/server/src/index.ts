import express from 'express'
import cors from 'cors'
import { hasTutorCredentials, tutorReply, type TutorRequest } from './tutor.js'
import { getStudent, leaderboard, putStudent } from './store.js'

/**
 * ReasoningLab API.
 *
 * Modular, versioned surface (/api/v1 alias kept at /api for the dev client).
 * Routes are grouped per capability so new competitions (AMC 8, MathCounts,
 * MOEMS, CogAT …) plug in as new routers without touching existing ones.
 */

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const api = express.Router()

// ── health ───────────────────────────────────────────────────────────
api.get('/health', (_req, res) => {
  res.json({ ok: true, tutor: hasTutorCredentials() ? 'claude' : 'rule-based-fallback' })
})

// ── AI Socratic tutor ────────────────────────────────────────────────
api.post('/tutor', async (req, res) => {
  const body = req.body as Partial<TutorRequest>
  if (!body?.question?.prompt || !Array.isArray(body.question.choices)) {
    res.status(400).json({ error: 'invalid tutor request' })
    return
  }
  const reply = await tutorReply(body as TutorRequest)
  // reply === null → client uses its local Socratic ladder
  res.json({ reply, source: reply ? 'claude' : 'fallback' })
})

// ── progress sync (guest-first: client owns state, server backs it up) ──
api.get('/sync/:studentId', (req, res) => {
  const rec = getStudent(req.params.studentId)
  if (!rec) {
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json(rec)
})

api.post('/sync', (req, res) => {
  const { studentId, name, version, blob, tournamentScore } = req.body ?? {}
  if (typeof studentId !== 'string' || typeof version !== 'number') {
    res.status(400).json({ error: 'studentId and numeric version required' })
    return
  }
  const stored = putStudent({
    studentId,
    name: typeof name === 'string' ? name : 'Explorer',
    version,
    blob,
    tournamentScore: typeof tournamentScore === 'number' ? tournamentScore : 0,
  })
  if (!stored) {
    res.status(409).json({ error: 'version conflict — pull latest first' })
    return
  }
  res.json(stored)
})

// ── leaderboard ──────────────────────────────────────────────────────
api.get('/leaderboard', (_req, res) => {
  res.json({ entries: leaderboard() })
})

app.use('/api', api)
app.use('/api/v1', api)

const PORT = Number(process.env.PORT ?? 5175)
app.listen(PORT, () => {
  console.log(`ReasoningLab API listening on http://localhost:${PORT}`)
  console.log(`Tutor mode: ${hasTutorCredentials() ? 'Claude (claude-opus-4-8)' : 'rule-based fallback (set ANTHROPIC_API_KEY to enable Claude)'}`)
})
