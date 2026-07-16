import type { Figure } from '../types'

const SLOT: Record<string, string> = {
  s1: 'var(--viz-s1)', s2: 'var(--viz-s2)', s3: 'var(--viz-s3)',
  s4: 'var(--viz-s4)', s5: 'var(--viz-s5)', s6: 'var(--viz-s6)',
  muted: 'var(--viz-muted)',
}

function fillFor(key?: string): string {
  return key ? SLOT[key] ?? key : 'var(--viz-s1)'
}

function Shape({ shape, fill, x, y, size }: { shape: string; fill?: string; x: number; y: number; size: number }) {
  const c = fillFor(fill)
  const h = size / 2
  switch (shape) {
    case 'circle':
      return <circle cx={x} cy={y} r={h * 0.85} fill={c} />
    case 'square':
      return <rect x={x - h * 0.8} y={y - h * 0.8} width={size * 0.8} height={size * 0.8} rx={4} fill={c} />
    case 'triangle':
      return <polygon points={`${x},${y - h * 0.85} ${x - h * 0.85},${y + h * 0.7} ${x + h * 0.85},${y + h * 0.7}`} fill={c} />
    case 'diamond':
      return <polygon points={`${x},${y - h * 0.9} ${x + h * 0.9},${y} ${x},${y + h * 0.9} ${x - h * 0.9},${y}`} fill={c} />
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? h * 0.9 : h * 0.38
        const a = (Math.PI / 5) * i - Math.PI / 2
        pts.push(`${x + r * Math.cos(a)},${y + r * Math.sin(a)}`)
      }
      return <polygon points={pts.join(' ')} fill={c} />
    }
    case 'question':
      return (
        <g>
          <rect x={x - h * 0.8} y={y - h * 0.8} width={size * 0.8} height={size * 0.8} rx={8}
            fill="none" stroke="var(--viz-muted)" strokeWidth={2} strokeDasharray="6 4" />
          <text x={x} y={y + 7} textAnchor="middle" fontSize={size * 0.5} fill="var(--viz-ink-2)" fontWeight={700}>?</text>
        </g>
      )
    default:
      return null
  }
}

/** Renders declarative question figures as crisp, colour-safe SVG. */
export default function FigureRenderer({ figure }: { figure: Figure }) {
  if (figure.kind === 'shapeRow') {
    const size = 52
    const gap = 14
    const width = figure.shapes.length * (size + gap) + gap
    return (
      <svg viewBox={`0 0 ${width} ${size + 24}`} className="mx-auto max-w-full" width={width} role="img" aria-label="Row of shapes forming a pattern">
        {figure.shapes.map((s, i) => (
          <g key={i}>
            <Shape shape={s.shape} fill={s.fill} x={gap + i * (size + gap) + size / 2} y={12 + size / 2} size={size} />
            {s.label && (
              <text x={gap + i * (size + gap) + size / 2} y={size + 20} textAnchor="middle" fontSize={12} fill="var(--viz-ink-2)">{s.label}</text>
            )}
          </g>
        ))}
      </svg>
    )
  }

  if (figure.kind === 'grid') {
    const cell = 44
    const pad = 4
    const w = figure.cols * cell + pad * 2
    const h = figure.rows * cell + pad * 2
    const cellAt = (r: number, c: number) => figure.cells.find((x) => x.r === r && x.c === c)
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto max-w-full" width={Math.min(w, 320)} role="img" aria-label="Grid figure">
        {Array.from({ length: figure.rows }).map((_, r) =>
          Array.from({ length: figure.cols }).map((_, c) => {
            const info = cellAt(r, c)
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={pad + c * cell + 1} y={pad + r * cell + 1}
                  width={cell - 2} height={cell - 2} rx={6}
                  fill={info?.fill ? fillFor(info.fill) : 'var(--viz-surface)'}
                  stroke="var(--viz-axis)" strokeWidth={1.5}
                />
                {info?.label && (
                  <text x={pad + c * cell + cell / 2} y={pad + r * cell + cell / 2 + 6}
                    textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--viz-ink)">
                    {info.label}
                  </text>
                )}
              </g>
            )
          }),
        )}
      </svg>
    )
  }

  if (figure.kind === 'cubeNet') {
    const cell = 46
    const maxR = Math.max(...figure.faces.map((f) => f.pos[0])) + 1
    const maxC = Math.max(...figure.faces.map((f) => f.pos[1])) + 1
    const w = maxC * cell + 8
    const h = maxR * cell + 8
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto max-w-full" width={Math.min(w, 300)} role="img" aria-label="Cube net">
        {figure.faces.map((f, i) => (
          <g key={i}>
            <rect x={4 + f.pos[1] * cell} y={4 + f.pos[0] * cell} width={cell - 3} height={cell - 3} rx={6}
              fill="var(--viz-surface)" stroke="var(--viz-s1)" strokeWidth={2} />
            <text x={4 + f.pos[1] * cell + (cell - 3) / 2} y={4 + f.pos[0] * cell + cell / 2 + 5}
              textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--viz-ink)">
              {f.label}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  if (figure.kind === 'numberLine') {
    const w = 340
    const pad = 24
    const y = 40
    const span = figure.max - figure.min || 1
    const xFor = (v: number) => pad + ((v - figure.min) / span) * (w - pad * 2)
    return (
      <svg viewBox={`0 0 ${w} 80`} className="mx-auto max-w-full" width={w} role="img" aria-label="Number line">
        <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="var(--viz-axis)" strokeWidth={2} />
        {figure.marks.map((m, i) => (
          <g key={i}>
            <line x1={xFor(m.at)} y1={y - 7} x2={xFor(m.at)} y2={y + 7}
              stroke={m.highlight ? 'var(--viz-s6)' : 'var(--viz-axis)'} strokeWidth={m.highlight ? 3 : 2} />
            <text x={xFor(m.at)} y={y + 26} textAnchor="middle" fontSize={13} fill="var(--viz-ink-2)">
              {m.label ?? m.at}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  if (figure.kind === 'balance') {
    const w = 320
    const tiltDeg = figure.tilt === 'left' ? -6 : figure.tilt === 'right' ? 6 : 0
    return (
      <svg viewBox={`0 0 ${w} 120`} className="mx-auto max-w-full" width={w} role="img" aria-label="Balance scale">
        <polygon points={`${w / 2 - 14},108 ${w / 2 + 14},108 ${w / 2},70`} fill="var(--viz-muted)" />
        <g transform={`rotate(${tiltDeg} ${w / 2} 70)`}>
          <line x1={40} y1={70} x2={w - 40} y2={70} stroke="var(--viz-ink-2)" strokeWidth={4} strokeLinecap="round" />
          <text x={70} y={56} textAnchor="middle" fontSize={20}>{figure.left.join('')}</text>
          <text x={w - 70} y={56} textAnchor="middle" fontSize={20}>{figure.right.join('')}</text>
          <line x1={55} y1={70} x2={85} y2={70} stroke="var(--viz-s1)" strokeWidth={6} strokeLinecap="round" />
          <line x1={w - 85} y1={70} x2={w - 55} y2={70} stroke="var(--viz-s1)" strokeWidth={6} strokeLinecap="round" />
        </g>
      </svg>
    )
  }

  return null
}
