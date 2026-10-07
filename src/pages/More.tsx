import { Link } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { MORE_NAV } from '../components/layout/nav'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

export default function More() {
  const { logout } = useAuth()
  const { toast } = useUI()
  return (
    <>
      <PageHeader title="Más" />
      <Card className="!p-2 divide-y divide-line">
        {MORE_NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-3 min-h-14">
            <span className="size-10 rounded-full bg-lavender text-primary grid place-items-center"><Icon size={19} /></span>
            <span className="flex-1 font-medium">{label}</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        ))}
        <button onClick={() => logout().catch(() => toast('Tienes cambios sin subir. Conéctate a internet antes de cerrar sesión.', 'error'))} className="w-full flex items-center gap-3 px-3 min-h-14 text-danger">
          <span className="size-10 rounded-full bg-danger/10 grid place-items-center"><LogOut size={19} /></span>
          <span className="flex-1 text-left font-medium">Cerrar sesión</span>
        </button>
      </Card>
    </>
  )
}
