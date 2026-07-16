import { useId, useState } from 'react'

/*
 * Small chart kit following the dataviz method:
 * thin marks, 4px rounded data-ends, hairline grid, hover tooltips,
 * text in ink tokens (never series colour), single-series = no legend.
 */

// ── Stat tile (hero number) ──────────────────────────────────────────

export function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--viz-muted)' }}>{label}</div>
      <div className="mt-1 text-3xl font-bold" style={{ color: accent ?? 'var(--viz-ink)' }}>{value}</div>
      {sub && <div className="mt-0.5 text-xs" style={{ color: 'var(--viz-ink-2)' }}>{sub}</div>}
    </div>
  )
}

// ── Line trend chart (single series, crosshair + tooltip) ────────────

export interface TrendPoint { label: string; value: number }

export function TrendChart({ points, height = 160, formatValue = (v: number) => String(v) }: {
  points: TrendPoint[]
  height?: number
  formatValue?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const clipId = useId()
  const w = 560
  const padL = 44
  const padR = 12
  const padT = 14
  const padB = 26
  if (points.length < 2) {
    return <div className="py-8 text-center text-sm" style={{ color: 'var(--viz-muted)' }}>Solve a few questions to see your trend ✨</div>
  }
  const vals = points.map((p) => p.value)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const span = hi - lo || 1
  const yMin = lo - span * 0.15
  const yMax = hi + span * 0.15
  const xFor = (i: number) => padL + (i / (points.length - 1)) * (w - padL - padR)
  const yFor = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (height - padT - padB)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)}`).join(' ')
  const gridYs = [0.25, 0.5, 0.75].map((f) => padT + f * (height - padT - padB))
  const hoverPt = hover !== null ? points[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="w-full"
        role="img"
        aria-label="Trend line chart"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * w
          const i = Math.round(((x - padL) / (w - padL - padR)) * (points.length - 1))
          setHover(Math.max(0, Math.min(points.length - 1, i)))
        }}
      >
        <clipPath id={clipId}><rect x={padL} y={0} width={w - padL - padR} height={height} /></clipPath>
        {gridYs.map((y, i) => (
          <line key={i} x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--viz-grid)" strokeWidth={1} />
        ))}
        <line x1={padL} y1={height - padB} x2={w - padR} y2={height - padB} stroke="var(--viz-axis)" strokeWidth={1} />
        {/* y labels */}
        <text x={padL - 8} y={yFor(hi) + 4} textAnchor="end" fontSize={11} fill="var(--viz-muted)">{formatValue(hi)}</text>
        <text x={padL - 8} y={yFor(lo) + 4} textAnchor="end" fontSize={11} fill="var(--viz-muted)">{formatValue(lo)}</text>
        {/* x labels: first + last */}
        <text x={xFor(0)} y={height - 8} textAnchor="start" fontSize={11} fill="var(--viz-muted)">{points[0].label}</text>
        <text x={xFor(points.length - 1)} y={height - 8} textAnchor="end" fontSize={11} fill="var(--viz-muted)">{points[points.length - 1].label}</text>
        <g clipPath={`url(#${clipId})`}>
          <path d={path} fill="none" stroke="var(--viz-s1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </g>
        {hover !== null && hoverPt && (
          <g>
            <line x1={xFor(hover)} y1={padT} x2={xFor(hover)} y2={height - padB} stroke="var(--viz-axis)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={xFor(hover)} cy={yFor(hoverPt.value)} r={5} fill="var(--viz-s1)" stroke="var(--viz-surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover !== null && hoverPt && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-md ring-1 ring-black/10"
          style={{ left: `${(xFor(hover) / w) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span style={{ color: 'var(--viz-ink-2)' }}>{hoverPt.label}: </span>
          <span className="font-semibold" style={{ color: 'var(--viz-ink)' }}>{formatValue(hoverPt.value)}</span>
        </div>
      )}
    </div>
  )
}

// ── Vertical bars (daily activity) ───────────────────────────────────

export interface BarPoint { label: string; value: number; hint?: string }

export function BarsChart({ points, height = 150, color = 'var(--viz-s2)', formatValue = (v: number) => String(v) }: {
  points: BarPoint[]
  height?: number
  color?: string
  formatValue?: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const w = 560
  const padB = 24
  const padT = 12
  const max = Math.max(1, ...points.map((p) => p.value))
  const bw = Math.min(44, (w - 20) / points.length - 8)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Bar chart" onMouseLeave={() => setHover(null)}>
        <line x1={8} y1={height - padB} x2={w - 8} y2={height - padB} stroke="var(--viz-axis)" strokeWidth={1} />
        {points.map((p, i) => {
          const x = 12 + (i + 0.5) * ((w - 24) / points.length) - bw / 2
          const h = Math.max(p.value === 0 ? 2 : 4, (p.value / max) * (height - padB - padT))
          const y = height - padB - h
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              {/* invisible hit target bigger than the mark */}
              <rect x={x - 6} y={padT} width={bw + 12} height={height - padB - padT} fill="transparent" />
              <rect x={x} y={y} width={bw} height={h} fill={p.value === 0 ? 'var(--viz-grid)' : color}
                rx={4} opacity={hover === null || hover === i ? 1 : 0.45} />
              <text x={x + bw / 2} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">{p.label}</text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-md ring-1 ring-black/10"
          style={{ left: `${((12 + (hover + 0.5) * ((w - 24) / points.length)) / w) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span style={{ color: 'var(--viz-ink-2)' }}>{points[hover].hint ?? points[hover].label}: </span>
          <span className="font-semibold" style={{ color: 'var(--viz-ink)' }}>{formatValue(points[hover].value)}</span>
        </div>
      )}
    </div>
  )
}

// ── Horizontal skill bars (per-entity colour, direct labels) ─────────

export interface SkillBarRow { name: string; emoji: string; value: number; color: string; sub?: string }

export function SkillBars({ rows, max = 100 }: { rows: SkillBarRow[]; max?: number }) {
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2">
          <div className="w-40 shrink-0 truncate text-xs font-medium sm:w-48 sm:text-sm" style={{ color: 'var(--viz-ink-2)' }}>
            <span className="mr-1">{r.emoji}</span>{r.name}
          </div>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--viz-grid)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: r.color }}
            />
          </div>
          <div className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: 'var(--viz-ink)' }}>
            {r.sub ?? `${r.value}%`}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Progress ring (readiness meter) ──────────────────────────────────

export function ProgressRing({ pct, size = 120, label }: { pct: number; size?: number; label?: string }) {
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Progress: ${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--viz-grid)" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--viz-s2)" strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize={size / 4.5} fontWeight={700} fill="var(--viz-ink)">{pct}%</text>
      {label && <text x={size / 2} y={size / 2 + 18} textAnchor="middle" fontSize={11} fill="var(--viz-muted)">{label}</text>}
    </svg>
  )
}
