import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Onboarding from './components/Onboarding'
import Dashboard from './pages/Dashboard'
import PracticeHub from './pages/PracticeHub'
import Session from './pages/Session'
import Arcade from './pages/Arcade'
import Parent from './pages/Parent'
import Settings from './pages/Settings'
import { useStore } from './store/useStore'

export default function App() {
  const onboarded = useStore((s) => s.onboarded)

  return (
    <BrowserRouter>
      {!onboarded && <Onboarding />}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="practice" element={<PracticeHub />} />
          <Route path="practice/skill/:skillId" element={<Session mode="skill" />} />
          <Route path="practice/daily" element={<Session mode="daily" />} />
          <Route path="practice/review" element={<Session mode="review" />} />
          <Route path="practice/quick" element={<Session mode="quick" />} />
          <Route path="arcade" element={<Arcade />} />
          <Route path="parent" element={<Parent />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
