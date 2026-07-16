import { useStore, weekKey } from '../store/useStore'
import { AVATARS, BADGES, levelFromXp, levelTitle } from '../lib/xp'
import { tournamentField } from '../lib/recommend'

export default function Arcade() {
  const s = useStore()
  const setAvatar = useStore((st) => st.setAvatar)
  const { level, into, needed } = levelFromXp(s.xp)
  const avatar = AVATARS.find((a) => a.id === s.avatarId) ?? AVATARS[0]
  const wk = weekKey()
  const rows = tournamentField(wk, s.tournament.week === wk ? s.tournament.score : 0, avatar.emoji)
  const yourRank = rows.findIndex((r) => r.isYou) + 1

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-800">Arcade 🎮</h1>
        <p className="mt-1 text-sm text-slate-500">Badges, tournaments and collectibles — all earned by real reasoning.</p>
      </header>

      {/* level card */}
      <section className="rounded-2xl bg-gradient-to-br from-sun-300 to-coral-500 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/25 text-4xl backdrop-blur">{avatar.emoji}</span>
          <div>
            <div className="text-xl font-extrabold">Level {level} · {levelTitle(level)}</div>
            <div className="mt-1 text-sm text-white/90">{s.xp} XP total · {needed - into} XP to next level</div>
            <div className="mt-2 h-2.5 w-56 max-w-full overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: `${(into / needed) * 100}%` }} />
            </div>
          </div>
          <div className="ml-auto rounded-2xl bg-white/20 px-4 py-3 text-center backdrop-blur">
            <div className="text-3xl font-black">{s.badges.length}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide">badges</div>
          </div>
        </div>
      </section>

      {/* weekly tournament */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-bold text-slate-800">Weekly tournament 🏟️</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Every correct answer this week scores tournament points. You're {yourRank <= 3 ? 'on the podium! 🏅' : `in place ${yourRank} — keep going!`}
          </p>
          <ol className="mt-3 space-y-1.5">
            {rows.map((r, i) => (
              <li
                key={r.name}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  r.isYou ? 'bg-brand-50 ring-2 ring-brand-300' : 'bg-slate-50'
                }`}
              >
                <span className="w-6 text-center text-sm font-black text-slate-400">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <span className="text-lg">{r.emoji}</span>
                <span className={`text-sm font-semibold ${r.isYou ? 'text-brand-700' : 'text-slate-700'}`}>{r.name}</span>
                <span className="ml-auto text-sm font-bold tabular-nums text-slate-600">{r.score} pts</span>
              </li>
            ))}
          </ol>
        </div>

        {/* avatars */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-bold text-slate-800">Collectible avatars 🦊</h2>
          <p className="mt-0.5 text-xs text-slate-500">Level up to unlock new companions. Tap to equip.</p>
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {AVATARS.map((a) => {
              const unlocked = level >= a.unlockLevel
              const active = s.avatarId === a.id
              return (
                <button
                  key={a.id}
                  disabled={!unlocked}
                  onClick={() => setAvatar(a.id)}
                  title={unlocked ? a.name : `${a.name} — unlocks at level ${a.unlockLevel}`}
                  className={`flex flex-col items-center rounded-2xl p-3 transition ${
                    active
                      ? 'bg-brand-100 ring-2 ring-brand-400'
                      : unlocked
                        ? 'bg-slate-50 ring-1 ring-slate-200 hover:bg-brand-50'
                        : 'bg-slate-50 opacity-40 ring-1 ring-slate-200'
                  }`}
                >
                  <span className="text-3xl">{unlocked ? a.emoji : '🔒'}</span>
                  <span className="mt-1 text-[10px] font-semibold text-slate-500">
                    {unlocked ? a.name : `Lv ${a.unlockLevel}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* badges */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold text-slate-800">Badges & achievements 🏅</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {BADGES.map((b) => {
            const earned = s.badges.includes(b.id)
            return (
              <div
                key={b.id}
                className={`rounded-2xl p-3 text-center ring-1 ${
                  earned ? 'bg-sun-100 ring-sun-300' : 'bg-slate-50 opacity-50 ring-slate-200'
                }`}
              >
                <div className="text-2xl">{earned ? b.emoji : '🔒'}</div>
                <div className="mt-1 text-xs font-bold text-slate-700">{b.name}</div>
                <div className="mt-0.5 text-[10px] leading-tight text-slate-500">{b.desc}</div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
