import { useState } from 'react'
import { useStore } from '../store/useStore'
import { AVATARS, levelFromXp } from '../lib/xp'

export default function Settings() {
  const s = useStore()
  const setProfile = useStore((st) => st.setProfile)
  const resetAll = useStore((st) => st.resetAll)
  const [name, setName] = useState(s.name)
  const [grade, setGrade] = useState<5 | 6>(s.grade)
  const [avatarId, setAvatarId] = useState(s.avatarId)
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const { level } = levelFromXp(s.xp)

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-extrabold text-slate-800">Settings ⚙️</h1>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <label className="block text-sm font-semibold text-slate-700" htmlFor="name">Your name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          placeholder="e.g. Vayun"
          className="mt-1.5 w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />

        <div className="mt-4 block text-sm font-semibold text-slate-700">Grade</div>
        <div className="mt-1.5 flex gap-2">
          {([5, 6] as const).map((g) => (
            <button
              key={g}
              onClick={() => { setGrade(g); setSaved(false) }}
              className={`rounded-xl px-5 py-2 text-sm font-bold ring-1 transition ${
                grade === g ? 'bg-brand-500 text-white ring-brand-500' : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-brand-50'
              }`}
            >
              Grade {g}
            </button>
          ))}
        </div>

        <div className="mt-4 block text-sm font-semibold text-slate-700">Avatar</div>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {AVATARS.map((a) => {
            const unlocked = level >= a.unlockLevel
            return (
              <button
                key={a.id}
                disabled={!unlocked}
                onClick={() => { setAvatarId(a.id); setSaved(false) }}
                className={`rounded-xl p-2.5 text-2xl ring-1 transition ${
                  avatarId === a.id
                    ? 'bg-brand-100 ring-brand-400'
                    : unlocked ? 'bg-slate-50 ring-slate-200 hover:bg-brand-50' : 'bg-slate-50 opacity-40 ring-slate-200'
                }`}
                title={unlocked ? a.name : `Unlocks at level ${a.unlockLevel}`}
              >
                {unlocked ? a.emoji : '🔒'}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setProfile(name.trim() || 'Explorer', grade, avatarId); setSaved(true) }}
          className="mt-5 w-full rounded-xl bg-brand-500 px-4 py-2.5 font-bold text-white hover:bg-brand-600"
        >
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-bold text-slate-700">Danger zone</h2>
        <p className="mt-1 text-xs text-slate-500">
          Reset all progress (rating, XP, badges, history). This cannot be undone.
        </p>
        {confirmReset ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { resetAll(); setConfirmReset(false) }}
              className="rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white hover:brightness-95"
            >
              Yes, reset everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="mt-3 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
          >
            Reset progress…
          </button>
        )}
      </div>
    </div>
  )
}
