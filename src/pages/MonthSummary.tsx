import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, Flame, PiggyBank, Target, Trophy, X } from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { IconBadge } from '../components/ui/IconBadge'
import { PageSkeleton } from '../components/ui/Skeleton'
import { useData } from '../context/DataContext'
import { buildMonthSummary, longDate, type MonthSummary } from '../utils/monthSummary'
import { formatCOP, monthKey, monthLabel, shiftMonth, todayStr } from '../utils/format'
import { markSummarySeen } from '../utils/summarySeen'
import { cn } from '../utils/cn'

interface Slide { id: string; bg: string; body: ReactNode }

const BG = {
  brand: 'bg-[radial-gradient(120%_120%_at_0%_0%,#8b6ff7_0%,#6c4cf1_40%,#3b2a9e_100%)]',
  blue: 'bg-[radial-gradient(120%_120%_at_100%_0%,#3b82f6_0%,#4338ca_55%,#2e2170_100%)]',
  green: 'bg-[radial-gradient(120%_120%_at_0%_100%,#10b981_0%,#0f766e_55%,#134e4a_100%)]',
  orange: 'bg-[radial-gradient(120%_120%_at_100%_100%,#f97316_0%,#c2410c_55%,#7c2d12_100%)]',
  night: 'bg-[radial-gradient(120%_120%_at_50%_0%,#4930b8_0%,#2e2170_50%,#16131f_100%)]',
}

const monthName = (m: string) => monthLabel(m).replace(/ de \d{4}$/, '')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Big({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[2.75rem] sm:text-5xl font-extrabold tracking-tight leading-[1.05] tabular-nums', className)}>{children}</p>
}
function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">{children}</p>
}
function Glass({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-md p-4', className)}>{children}</div>
}

function buildSlides(s: MonthSummary): Slide[] {
  const name = monthName(s.month)
  const slides: Slide[] = []
  if (s.count === 0) return [{ id: 'intro', bg: BG.brand, body: null }] // se muestra el aviso de "sin movimientos"

  slides.push({ id: 'intro', bg: BG.brand, body: (
    <div className="text-center">
      <Logo size={76} animated className="mx-auto drop-shadow-[0_16px_30px_rgba(20,10,60,.5)]" />
      <Eyebrow><span className="block mt-8">Tu resumen</span></Eyebrow>
      <h1 className="mt-3 text-5xl font-extrabold tracking-tight">{cap(monthLabel(s.month))}</h1>
      <p className="mt-5 text-white/80 text-lg">Registraste <b className="text-white">{s.count}</b> {s.count === 1 ? 'movimiento' : 'movimientos'}.<br />Veamos cómo te fue.</p>
    </div>
  ) })

  slides.push({ id: 'money', bg: s.net >= 0 ? BG.blue : BG.orange, body: (
    <div>
      <Eyebrow>El dinero de {name}</Eyebrow>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Glass><p className="text-xs text-white/75 flex items-center gap-1"><ArrowDown size={13} />Entraron</p><p className="mt-1 text-lg font-bold tabular-nums">{formatCOP(s.income)}</p></Glass>
        <Glass><p className="text-xs text-white/75 flex items-center gap-1"><ArrowUp size={13} />Salieron</p><p className="mt-1 text-lg font-bold tabular-nums">{formatCOP(s.expense)}</p></Glass>
      </div>
      {s.net >= 0 ? (
        <>
          <p className="mt-10 text-lg text-white/85">Te quedaron</p>
          <Big>{formatCOP(s.net)}</Big>
          {s.savingsRate !== null && <p className="mt-4 text-lg text-white/85">Ahorraste el <b className="text-white">{s.savingsRate}%</b> de lo que entró.</p>}
        </>
      ) : (
        <>
          <p className="mt-10 text-lg text-white/85">Gastaste más de lo que entró:</p>
          <Big>{formatCOP(-s.net)}</Big>
          <p className="mt-4 text-white/85">Revisa en qué categorías se fue la diferencia; un presupuesto puede ayudarte el próximo mes.</p>
        </>
      )}
    </div>
  ) })

  if (s.prevExpense > 0 && s.expense > 0) {
    const pct = Math.round(((s.expense - s.prevExpense) / s.prevExpense) * 100)
    const less = pct < 0
    const max = Math.max(s.expense, s.prevExpense)
    slides.push({ id: 'compare', bg: less ? BG.green : BG.orange, body: (
      <div>
        <Eyebrow>Comparado con {monthName(s.prevMonth)}</Eyebrow>
        <p className="mt-6 text-2xl font-bold leading-snug">
          {pct === 0 ? 'Gastaste lo mismo que el mes anterior.' : <>Gastaste un <span className="text-5xl font-extrabold block my-2">{Math.abs(pct)}% {less ? 'menos' : 'más'}</span>que en {monthName(s.prevMonth)}.</>}
        </p>
        <div className="mt-8 space-y-3">
          {[{ label: cap(monthName(s.prevMonth)), v: s.prevExpense }, { label: cap(name), v: s.expense }].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-sm"><span className="text-white/80">{r.label}</span><b className="tabular-nums">{formatCOP(r.v)}</b></div>
              <div className="mt-1.5 h-3 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-white" style={{ width: `${(r.v / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-white/85">{less ? '¡Buen trabajo! Sigue así.' : 'No pasa nada: en las siguientes tarjetas verás en qué se fue para ajustar el próximo mes.'}</p>
      </div>
    ) })
  }

  if (s.topCategories.length) {
    const top = s.topCategories[0]
    slides.push({ id: 'categories', bg: BG.night, body: (
      <div>
        <Eyebrow>Donde más gastaste</Eyebrow>
        <div className="mt-6 flex items-center gap-4">
          <span className="rounded-full bg-white p-1"><IconBadge icon={top.category?.icon ?? 'tag'} color={top.category?.color ?? '#94a3b8'} size={56} /></span>
          <div>
            <p className="text-3xl font-extrabold tracking-tight">{top.category?.name ?? 'Sin categoría'}</p>
            <p className="text-white/80">{Math.round(top.share * 100)}% de tus gastos</p>
          </div>
        </div>
        <Big className="mt-6">{formatCOP(top.amount)}</Big>
        <ol className="mt-8 space-y-3">
          {s.topCategories.map((c, i) => (
            <li key={c.category?.id ?? i}>
              <div className="flex justify-between text-sm"><span>{i + 1}. {c.category?.name ?? 'Sin categoría'}</span><b className="tabular-nums">{formatCOP(c.amount)}</b></div>
              <div className="mt-1.5 h-2.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.share * 100}%`, background: c.category?.color ?? '#fff' }} /></div>
            </li>
          ))}
        </ol>
      </div>
    ) })
  }

  // Si ese día solo tuvo el gasto más grande, la tarjeta repetiría la siguiente: se omite
  if (s.priciestDay && s.priciestDay.items.length > 1) {
    const pd = s.priciestDay
    slides.push({ id: 'day', bg: BG.orange, body: (
      <div>
        <Eyebrow><span className="inline-flex items-center gap-1.5"><Flame size={15} />Tu día más caro</span></Eyebrow>
        <p className="mt-6 text-2xl font-bold">{cap(longDate(pd.date))}</p>
        <Big className="mt-2">{formatCOP(pd.amount)}</Big>
        <Glass className="mt-8 space-y-2.5">
          {pd.items.slice(0, 4).map((t) => (
            <div key={t.id} className="flex justify-between gap-3 text-sm"><span className="truncate">{t.description}</span><b className="tabular-nums shrink-0">{formatCOP(t.amount)}</b></div>
          ))}
          {pd.items.length > 4 && <p className="text-xs text-white/70">y {pd.items.length - 4} más</p>}
        </Glass>
      </div>
    ) })
  }

  if (s.biggest) {
    const b = s.biggest
    slides.push({ id: 'biggest', bg: BG.blue, body: (
      <div>
        <Eyebrow><span className="inline-flex items-center gap-1.5"><Trophy size={15} />Tu gasto más grande</span></Eyebrow>
        <p className="mt-6 text-3xl font-extrabold tracking-tight">{b.description}</p>
        <Big className="mt-3">{formatCOP(b.amount)}</Big>
        <p className="mt-4 text-white/80">{cap(longDate(b.date))}</p>
        {s.expense > 0 && <p className="mt-8 text-lg text-white/90">Fue el <b className="text-white">{Math.round((b.amount / s.expense) * 100)}%</b> de todo lo que gastaste en {name}.</p>}
      </div>
    ) })
  }

  const ratio = s.daysWithEntries / s.daysInMonth
  const firstDay = new Date(Number(s.month.slice(0, 4)), Number(s.month.slice(5)) - 1, 1).getDay()
  slides.push({ id: 'habit', bg: BG.green, body: (
    <div>
      <Eyebrow><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />Tu constancia</span></Eyebrow>
      <p className="mt-6 text-2xl font-bold leading-snug">Registraste movimientos <span className="block text-5xl font-extrabold my-2">{s.daysWithEntries} de {s.daysInMonth}</span>días.</p>
      <div className="mt-6 grid grid-cols-7 gap-1.5 max-w-[17rem]" aria-hidden>
        {Array.from({ length: (firstDay + 6) % 7 }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: s.daysInMonth }, (_, i) => (
          <span key={i} className={cn('aspect-square rounded-md', s.entryDays.includes(i + 1) ? 'bg-white' : 'bg-white/15')} />
        ))}
      </div>
      {s.longestStreak > 1 && <p className="mt-6 text-lg">Tu racha más larga: <b>{s.longestStreak} días seguidos</b>.</p>}
      <p className="mt-2 text-white/85">{ratio >= 0.6 ? '¡Excelente constancia!' : ratio >= 0.3 ? 'Vas bien. Registrar más seguido te da números más reales.' : 'Prueba registrar cada gasto al momento: con "25k almuerzo" toma segundos.'}</p>
    </div>
  ) })

  if (s.budgets.total > 0) {
    const allKept = s.budgets.kept === s.budgets.total
    slides.push({ id: 'budgets', bg: allKept ? BG.green : BG.night, body: (
      <div>
        <Eyebrow><span className="inline-flex items-center gap-1.5"><PiggyBank size={15} />Tus presupuestos</span></Eyebrow>
        <p className="mt-6 text-2xl font-bold leading-snug">Cumpliste <span className="block text-6xl font-extrabold my-2">{s.budgets.kept} de {s.budgets.total}</span></p>
        {allKept ? <p className="mt-6 text-lg">¡Todos dentro del límite! Así se hace.</p>
          : s.budgets.worst && <p className="mt-6 text-lg">El que más se pasó fue <b>{s.budgets.worst.category?.name ?? 'una categoría'}</b>, por {formatCOP(s.budgets.worst.over)}.</p>}
      </div>
    ) })
  }

  if (s.goalContributions > 0) {
    slides.push({ id: 'goals', bg: BG.blue, body: (
      <div>
        <Eyebrow><span className="inline-flex items-center gap-1.5"><Target size={15} />Tus metas</span></Eyebrow>
        <p className="mt-6 text-2xl font-bold">Le abonaste a tus metas de ahorro</p>
        <Big className="mt-3">{formatCOP(s.goalContributions)}</Big>
        <p className="mt-6 text-lg text-white/90">Cada aporte te acerca. ¡Sigue así!</p>
      </div>
    ) })
  }

  slides.push({ id: 'end', bg: BG.brand, body: (
    <div className="text-center">
      <Logo size={56} className="mx-auto" />
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight">{cap(name)} en resumen</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 text-left">
        <Glass><p className="text-xs text-white/75">Entraron</p><p className="font-bold tabular-nums">{formatCOP(s.income)}</p></Glass>
        <Glass><p className="text-xs text-white/75">Salieron</p><p className="font-bold tabular-nums">{formatCOP(s.expense)}</p></Glass>
        <Glass><p className="text-xs text-white/75">{s.net >= 0 ? 'Te quedaron' : 'Faltaron'}</p><p className="font-bold tabular-nums">{formatCOP(Math.abs(s.net))}</p></Glass>
        <Glass><p className="text-xs text-white/75">Más gasto en</p><p className="font-bold truncate">{s.topCategories[0]?.category?.name ?? '—'}</p></Glass>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <Link to="/reportes" className="relative z-10 inline-flex items-center justify-center rounded-2xl bg-white text-primary-dark font-semibold min-h-12 px-6 hover:bg-white/90 transition-colors">Ver reportes</Link>
        <Link to="/" className="relative z-10 inline-flex items-center justify-center rounded-2xl ring-1 ring-white/40 font-semibold min-h-12 px-6 hover:bg-white/10 transition-colors">Volver al inicio</Link>
      </div>
    </div>
  ) })

  return slides
}

/** Resumen del mes estilo historias: tarjetas a pantalla completa que avanzas tocando. */
export default function MonthSummaryPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { transactions, categories, budgets, goals, loading } = useData()
  const month = /^\d{4}-\d{2}$/.test(params.month ?? '') ? params.month! : shiftMonth(monthKey(todayStr()), -1)

  const summary = useMemo(() => buildMonthSummary(month, { transactions, categories, budgets, goals }), [month, transactions, categories, budgets, goals])
  const slides = useMemo(() => buildSlides(summary), [summary])
  const [i, setI] = useState(0)
  const last = slides.length - 1

  const next = useCallback(() => setI((v) => Math.min(last, v + 1)), [last])
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), [])
  const close = useCallback(() => navigate('/'), [navigate])

  useEffect(() => { markSummarySeen(month) }, [month])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev, close])

  if (loading) return <PageSkeleton />
  const slide = slides[i]

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0a11] flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Resumen de ${monthLabel(month)}`}>
      <div className={cn('relative isolate w-full h-dvh sm:h-[min(780px,94dvh)] sm:max-w-[420px] sm:rounded-[2rem] overflow-hidden text-white flex flex-col shadow-2xl transition-[background] duration-500', slide.bg)}>
        <div aria-hidden className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl -z-10" />
        <div aria-hidden className="absolute -left-16 bottom-10 size-64 rounded-full bg-white/10 blur-3xl -z-10" />

        {/* Barras de progreso y cerrar */}
        <div className="relative z-20 px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
          <div className="flex gap-1.5" aria-hidden>
            {slides.map((s, k) => <span key={s.id} className={cn('h-1 flex-1 rounded-full transition-colors', k <= i ? 'bg-white' : 'bg-white/30')} />)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold"><Logo size={26} />MonEra · {cap(monthLabel(month))}</span>
            <button onClick={close} aria-label="Cerrar resumen" className="size-11 -mr-2 grid place-items-center rounded-full hover:bg-white/15"><X size={22} /></button>
          </div>
        </div>

        {/* Contenido: tocar a la izquierda vuelve, a la derecha avanza */}
        <div className="relative flex-1 min-h-0">
          {i < last && (
            <>
              <button aria-label="Anterior" onClick={prev} className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-w-resize" />
              <button aria-label="Siguiente" onClick={next} className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-e-resize" />
            </>
          )}
          <div key={slide.id} className="animate-rise h-full overflow-y-auto px-7 py-6 flex flex-col justify-center" aria-live="polite">
            {summary.count === 0 && slide.id === 'intro' ? (
              <div className="text-center">
                <Logo size={64} className="mx-auto" />
                <h1 className="mt-6 text-3xl font-extrabold">Sin movimientos en {monthName(month)}</h1>
                <p className="mt-3 text-white/80">Cuando registres gastos e ingresos, aquí verás tu resumen del mes.</p>
                <Link to="/" className="relative z-20 mt-8 inline-flex items-center justify-center rounded-2xl bg-white text-primary-dark font-semibold min-h-12 px-6">Volver al inicio</Link>
              </div>
            ) : slide.body}
          </div>
        </div>

        {/* Botones visibles para quien no toca la pantalla */}
        {summary.count > 0 && (
          <div className="relative z-20 flex items-center justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            <button onClick={prev} disabled={i === 0} aria-label="Tarjeta anterior" className="size-12 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 transition"><ChevronLeft size={22} /></button>
            <span className="text-sm text-white/75 tabular-nums">{i + 1} / {slides.length}</span>
            <button onClick={next} disabled={i === last} aria-label="Tarjeta siguiente" className="size-12 grid place-items-center rounded-full bg-white text-primary-dark hover:bg-white/90 disabled:opacity-30 transition"><ChevronRight size={22} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
