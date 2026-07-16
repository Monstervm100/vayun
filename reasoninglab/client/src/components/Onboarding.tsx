import { useState } from 'react'
import { useStore } from '../store/useStore'
import { AVATARS } from '../lib/xp'

/** First-run welcome: name, grade, starter avatar. Guest-first — no account needed. */
export default function Onboarding() {
  const setProfile = useStore((s) => s.setProfile)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<5 | 6>(5)
  const [avatarId, setAvatarId] = useState('fox')
  const starters = AVATARS.filter((a) => a.unlockLevel === 1)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl pop">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-3xl text-white shadow">🧠</span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-800">
            Welcome to Reasoning<span className="text-brand-500">Lab</span>!
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Train the thinking skills behind Math Kangaroo and other reasoning contests — with a coach that adapts to you.
          </p>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="ob-name">What should we call you?</label>
        <input
          id="ob-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          className="mt-1.5 w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />

        <div className="mt-4 text-sm font-semibold text-slate-700">Your grade</div>
        <div className="mt-1.5 flex gap-2">
          {([5, 6] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold ring-1 transition ${
                grade === g ? 'bg-brand-500 text-white ring-brand-500' : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-brand-50'
              }`}
            >
              Grade {g}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm font-semibold text-slate-700">Pick your companion</div>
        <div className="mt-1.5 flex gap-2">
          {starters.map((a) => (
            <button
              key={a.id}
              onClick={() => setAvatarId(a.id)}
              className={`flex-1 rounded-2xl p-3 text-center ring-1 transition ${
                avatarId === a.id ? 'bg-brand-100 ring-2 ring-brand-400' : 'bg-slate-50 ring-slate-200 hover:bg-brand-50'
              }`}
            >
              <div className="text-3xl">{a.emoji}</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">{a.name}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setProfile(name.trim() || 'Explorer', grade, avatarId)}
          className="mt-6 w-full rounded-xl bg-brand-500 px-4 py-3 text-base font-extrabold text-white shadow-sm transition hover:bg-brand-600"
        >
          Start reasoning! 🚀
        </button>
        <p className="mt-2.5 text-center text-[11px] text-slate-400">
          No account needed — your progress is saved on this device.
        </p>
      </div>
    </div>
  )
}
