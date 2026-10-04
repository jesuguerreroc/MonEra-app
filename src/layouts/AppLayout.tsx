import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { BottomNav } from '../components/layout/BottomNav'
import { MobileHeader } from '../components/layout/MobileHeader'
import { useData } from '../context/DataContext'

export default function AppLayout() {
  const { error } = useData()
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <MobileHeader />
        <main key={pathname} className="animate-rise mx-auto max-w-6xl px-4 md:px-8 pt-2 md:pt-8 pb-32 md:pb-12">
          {error && <div role="alert" className="mb-4 rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm font-medium">{error}</div>}
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
