import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, Home, Menu, Plus, Receipt, Wallet, Zap } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { IconBadge } from '../ui/IconBadge'

/** Celular de ejemplo con la app por dentro (decorativo; usa los mismos colores del tema activo). */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[292px] select-none" role="img"
      aria-label="Vista previa de MonEra en un celular: saldo total, registro rápido y últimos movimientos">
      <div aria-hidden className="relative h-[600px] rounded-[3rem] border-[10px] border-[#16131f] bg-background shadow-float overflow-hidden">
        <div className="absolute left-1/2 top-2 -translate-x-1/2 h-6 w-24 rounded-full bg-[#16131f] z-20" />
        <div className="aurora absolute inset-0" />

        <div className="relative px-4 pt-11 space-y-3 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Logo size={24} /><b className="text-sm text-primary-ink tracking-tight">MonEra</b></span>
            <span className="relative text-muted"><Bell size={16} /><span className="absolute -top-1 -right-1.5 size-3 rounded-full bg-danger text-[7px] text-white grid place-items-center font-bold">2</span></span>
          </div>

          <div className="relative overflow-hidden rounded-[1.4rem] p-4 text-white bg-[radial-gradient(120%_140%_at_0%_0%,#8b6ff7_0%,#6c4cf1_40%,#4930b8_75%,#2e2170_100%)]">
            <div className="absolute -right-8 -top-10 size-28 rounded-full bg-[#60a5fa]/30 blur-2xl" />
            <p className="relative text-white/75">Saldo total</p>
            <p className="relative text-[26px] font-extrabold tracking-tight leading-tight">$7.952.099</p>
            <div className="relative mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/12 ring-1 ring-white/20 p-2">
                <p className="flex items-center gap-1 text-[9px] text-white/80"><ArrowDownLeft size={10} />Ingresos</p>
                <p className="font-bold">$1.020.000</p>
              </div>
              <div className="rounded-xl bg-white/12 ring-1 ring-white/20 p-2">
                <p className="flex items-center gap-1 text-[9px] text-white/80"><ArrowUpRight size={10} />Gastos</p>
                <p className="font-bold">$640.550</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface/90 border border-line/80 p-2.5 shadow-card">
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-surface px-2.5 h-8">
              <Zap size={12} className="text-primary" /><span>25k almuerzo nequi</span><span className="ml-px h-3.5 w-px bg-primary animate-pulse" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <IconBadge icon="utensils" color="#f59e0b" size={26} />
              <div className="flex-1 leading-tight"><b>Gasto · $25.000</b><p className="text-[9px] text-muted">Alimentación · Nequi · Hoy</p></div>
              <span className="rounded-lg bg-primary text-white px-2 py-1 text-[9px] font-semibold">Guardar</span>
            </div>
          </div>

          <div className="rounded-2xl bg-surface/90 border border-line/80 p-2.5 shadow-card space-y-2">
            <p className="font-bold text-xs">Últimos movimientos</p>
            {[
              { icon: <IconBadge icon="wallet" color="#16a34a" size={26} />, t: 'Salario', s: 'Salario · Bancolombia', a: '+$1.020.000', cls: 'text-success' },
              { icon: <IconBadge icon="shopping-bag" color="#ec4899" size={26} />, t: 'Mercado', s: 'Alimentación · Nequi', a: '-$45.550', cls: '' },
              { icon: <span className="size-[26px] rounded-full bg-lavender text-primary grid place-items-center"><ArrowLeftRight size={12} /></span>, t: 'Transferencia', s: 'Bancolombia → Nequi', a: '$200.000', cls: 'text-muted' },
            ].map((r) => (
              <div key={r.t} className="flex items-center gap-2">
                {r.icon}
                <div className="flex-1 leading-tight"><b>{r.t}</b><p className="text-[9px] text-muted">{r.s}</p></div>
                <b className={r.cls}>{r.a}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-2.5 bottom-3 glass rounded-[1.4rem] flex items-center justify-around h-12 text-muted">
          <span className="grid place-items-center h-6 w-9 rounded-full bg-primary/15 text-primary-ink"><Home size={15} /></span>
          <Receipt size={15} />
          <span className="-mt-6 size-11 rounded-2xl bg-primary text-white grid place-items-center ring-4 ring-background shadow-lg"><Plus size={20} /></span>
          <Wallet size={15} />
          <Menu size={15} />
        </div>
      </div>
    </div>
  )
}
