import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { AVATARS, levelFromXp } from '../lib/xp'

const tabs = [
  { to: '/', label: 'Home', emoji: '🏠' },
  { to: '/practice', label: 'Practice', emoji: '🧩' },
  { to: '/arcade', label: 'Arcade', emoji: '🎮' },
  { to: '/parent', label: 'Parents', emoji: '👪' },
]

export default function Layout() {
  const name = useStore((s) => s.name)
  const xp = useStore((s) => s.xp)
  const avatarId = useStore((s) => s.avatarId)
  const { level } = levelFromXp(xp)
  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0]

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:bg-brand-50'
    }`

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg text-white shadow-sm">🧠</span>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight text-slate-800">
                Reasoning<span className="text-brand-500">Lab</span>
              </div>
              <div className="hidden text-[10px] font-medium text-slate-400 sm:block">think smart, not hard</div>
            </div>
          </NavLink>

          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} className={linkClass} end={t.to === '/'}>
                <span aria-hidden>{t.emoji}</span> {t.label}
              </NavLink>
            ))}
          </nav>

          <NavLink to="/settings" className="ml-auto flex items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3 ring-1 ring-slate-200 hover:bg-slate-100">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-lg">{avatar.emoji}</span>
            <div className="leading-tight">
              <div className="max-w-[90px] truncate text-xs font-bold text-slate-700">{name || 'Explorer'}</div>
              <div className="text-[10px] font-medium text-brand-500">Level {level}</div>
            </div>
          </NavLink>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-4 pt-2 text-center text-[11px] font-medium text-slate-400">
        Created with ❤️ by <span className="font-bold text-brand-500">Mithil Bhansali</span> · For — <span className="font-bold text-slate-600">Vayun Bro</span> 🧠🚀
      </footer>

      {/* mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-black/5 bg-white/95 py-1.5 backdrop-blur md:hidden"
        aria-label="Mobile navigation"
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }: { isActive: boolean }) =>
              `flex flex-col items-center rounded-xl px-4 py-1 text-[11px] font-semibold ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            <span className="text-lg" aria-hidden>{t.emoji}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
