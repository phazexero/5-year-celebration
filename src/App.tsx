import { MotionConfig } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MusicToggle } from './components/MusicToggle'
import { PageLoader } from './components/PageLoader'
import { Gate } from './pages/Gate'
import Home from './pages/Home'
import Year from './pages/Year'

// heavier pages load on demand so the first paint stays light
const Finale = lazy(() => import('./pages/Finale'))
const Play = lazy(() => import('./pages/Play'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Gate>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ErrorBoundary>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/year/:n" element={<Year />} />
                <Route path="/finale" element={<Finale />} />
                <Route path="/play/*" element={<Play />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <MusicToggle />
          </ErrorBoundary>
        </BrowserRouter>
      </Gate>
    </MotionConfig>
  )
}
