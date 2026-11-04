import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PageLoader } from '../components/PageLoader'
import { RealtimeProvider } from '../lib/realtime'
import Lobby from './Lobby'

const MemoryMatch = lazy(() => import('./games/MemoryMatch'))
const KnowMe = lazy(() => import('./games/KnowMe'))

/** everything under /play shares one Firebase connection and one presence */
export default function Play() {
  return (
    <RealtimeProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<Lobby />} />
          <Route path="match" element={<MemoryMatch />} />
          <Route path="quiz" element={<KnowMe />} />
          <Route path="*" element={<Lobby />} />
        </Routes>
      </Suspense>
    </RealtimeProvider>
  )
}
