import { Link } from 'react-router-dom'
import {
  ArrowRight, BellRing, Check, ChevronDown, CloudOff, HandCoins, LineChart, Lock, PiggyBank, Target, Wallet, Zap, type LucideIcon,
} from 'lucide-react'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { PhoneMockup } from '../components/landing/PhoneMockup'
import { QuickDemo } from '../components/landing/QuickDemo'
import { Reveal } from '../components/landing/Reveal'
import { cn } from '../utils/cn'

// Sin "display" para poder ocultarlo/mostrarlo por tamaño de pantalla sin choques de clases
const btnPrimaryLook = 'items-center justify-center gap-2 rounded-2xl bg-primary text-white font-semibold min-h-12 px-6 hover:bg-primary-dark transition-colors active:scale-[.98] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_12px_28px_-12px_rgba(108,76,241,.9)] cursor-pointer'
const btnPrimary = 'inline-flex ' + btnPrimaryLook
const btnSoft = 'inline-flex items-center justify-center gap-2 rounded-2xl bg-surface/80 border border-line text-ink font-semibold min-h-12 px-6 hover:border-secondary transition-colors cursor-pointer'

const NAV = [
  { href: '#demo', label: 'Pruébala' },
  { href: '#funciones', label: 'Funciones' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#preguntas', label: 'Preguntas' },
]

const FEATURES: { icon: LucideIcon; title: string; text: string; tone: string }[] = [
  { icon: Wallet, title: 'Todas tus cuentas', text: 'Bancolombia, Nequi, Daviplata, efectivo, ahorros… cada una con su saldo y su historial de movimientos.', tone: 'bg-primary/12 text-primary-ink' },
  { icon: Zap, title: 'Registro en segundos', text: 'Escribe "25k almuerzo nequi" y listo: MonEra entiende el monto, la categoría y la cuenta.', tone: 'bg-[#f59e0b]/15 text-[#b45309] dark:text-[#fbbf24]' },
  { icon: PiggyBank, title: 'Presupuestos', text: 'Define cuánto quieres gastar por categoría y mira tu avance durante el mes.', tone: 'bg-[#ec4899]/12 text-[#be185d] dark:text-[#f9a8d4]' },
  { icon: BellRing, title: 'Alertas inteligentes', text: 'Te avisa si te acercas al límite, si una deuda está por vencer o si un gasto se sale de lo normal.', tone: 'bg-danger/10 text-danger' },
  { icon: HandCoins, title: 'Deudas y préstamos', text: 'Lleva lo que debes y lo que te deben, con abonos e historial de lo que ya se pagó.', tone: 'bg-success/10 text-success' },
  { icon: Target, title: 'Metas de ahorro', text: 'Ponle nombre y valor a lo que quieres lograr y ve cuánto te falta.', tone: 'bg-[#3b82f6]/12 text-[#1d4ed8] dark:text-[#93c5fd]' },
  { icon: LineChart, title: 'Reportes claros', text: 'Gráficas de ingresos, gastos y categorías para entender a dónde se va tu dinero.', tone: 'bg-[#14b8a6]/12 text-[#0f766e] dark:text-[#5eead4]' },
  { icon: CloudOff, title: 'Funciona sin internet', text: 'Instálala en tu celular como una app. Lo que registres sin conexión se sube solo después.', tone: 'bg-ink/[0.06] text-ink' },
]

const STEPS = [
  { title: 'Crea tus cuentas', text: 'Agrega dónde tienes tu dinero: banco, billeteras digitales, efectivo o ahorros, con su saldo de hoy.' },
  { title: 'Registra en segundos', text: 'Cada gasto o ingreso en una frase, o con el formulario. También transferencias entre tus cuentas.' },
  { title: 'Entiende y mejora', text: 'Mira tu saldo, presupuestos, alertas y reportes, y toma mejores decisiones cada mes.' },
]

const FAQ = [
  { q: '¿Tengo que conectar mi banco?', a: 'No. Tú registras tus movimientos (en segundos con el registro rápido). MonEra nunca te pide el usuario ni la clave de tu banco.' },
  { q: '¿Mis datos están seguros?', a: 'Se guardan en la nube de Google (Firebase) asociados a tu cuenta, y las reglas de seguridad solo permiten que tú los veas y los modifiques.' },
  { q: '¿Funciona en el celular?', a: 'Sí. Puedes usarla desde el navegador o instalarla en Android o iPhone como una app, con su propio ícono y en pantalla completa.' },
  { q: '¿Y si no tengo internet?', a: 'Si la instalaste, abre igual y puedes seguir registrando. Los cambios se suben solos cuando vuelve la conexión.' },
  { q: '¿Puedo usarla en varios dispositivos?', a: 'Sí. Entras con tu correo o con Google y todo queda sincronizado entre tu celular y tu computador.' },
  { q: '¿Maneja pesos colombianos?', a: 'Sí. Todo está en pesos (COP), con montos como "25 mil" o "1,5 millones" y la hora de Colombia.' },
]

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-10 md:mb-14">
      <p className="text-sm font-semibold text-primary-ink">{eyebrow}</p>
      <h2 className="mt-2 text-3xl md:text-[2.6rem] font-extrabold tracking-tight leading-tight text-balance">{title}</h2>
      {text && <p className="mt-4 text-muted md:text-lg text-pretty">{text}</p>}
    </div>
  )
}

/** Página pública: presenta MonEra antes de iniciar sesión o crear una cuenta. */
export default function Landing() {
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div aria-hidden className="aurora fixed inset-0 -z-10 pointer-events-none" />

      {/* Barra superior */}
      <header className="sticky top-0 z-40 px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <nav aria-label="Principal" className="glass shadow-card mx-auto max-w-6xl rounded-2xl flex items-center gap-2 h-16 pl-3 pr-2 sm:px-4">
          <Link to="/" className="flex items-center gap-2.5 mr-auto" aria-label="MonEra, inicio">
            <Logo size={34} animated />
            <span className="text-xl font-extrabold tracking-tight text-primary-ink">MonEra</span>
          </Link>
          <ul className="hidden lg:flex items-center gap-1 mr-2">
            {NAV.map((n) => (
              <li key={n.href}><a href={n.href} className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-ink/5 transition-colors">{n.label}</a></li>
            ))}
          </ul>
          <ThemeToggle />
          <Link to="/entrar" className="hidden sm:inline-flex items-center rounded-xl px-3 min-h-10 text-sm font-semibold hover:bg-ink/5 transition-colors">Iniciar sesión</Link>
          <Link to="/registro" className={cn('hidden sm:inline-flex', btnPrimaryLook, 'min-h-10 px-4 text-sm rounded-xl')}>Crear cuenta</Link>
          <Link to="/entrar" className={cn('inline-flex sm:hidden', btnPrimaryLook, 'min-h-10 px-4 text-sm rounded-xl')}>Entrar</Link>
        </nav>
      </header>

      <main>
        {/* Portada */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          <div className="text-center lg:text-left animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary-ink">
              <span className="size-2 rounded-full bg-success" aria-hidden />Hecha para Colombia · en pesos colombianos
            </p>
            <h1 className="mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.1rem] font-extrabold tracking-tight text-balance">
              Tus finanzas, <span className="bg-gradient-to-r from-primary to-[#3b82f6] bg-clip-text text-transparent">fluyendo</span> sin esfuerzo.
            </h1>
            <p className="mt-6 text-lg text-muted max-w-xl mx-auto lg:mx-0 text-pretty">
              MonEra reúne tus cuentas, gastos, presupuestos, deudas y metas en un solo lugar. Registra un gasto en segundos y entiende tu dinero de un vistazo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/registro" className={btnPrimary}>Crear mi cuenta<ArrowRight size={18} /></Link>
              <a href="#demo" className={btnSoft}><Zap size={18} className="text-primary" />Probarla ahora</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm text-muted">
              {['Sin conectar tu banco', 'Celular y computador', 'Funciona sin internet'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check size={16} className="text-success" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>

          <div className="relative animate-rise [animation-delay:120ms]">
            <div aria-hidden className="absolute inset-x-6 top-10 bottom-10 -z-10 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative w-[292px] mx-auto">
            <PhoneMockup />
            <div aria-hidden className="hidden md:flex absolute right-[calc(100%-22px)] top-[150px] w-max glass shadow-float rounded-2xl p-3 items-center gap-2.5 animate-float max-w-[220px]">
              <span className="size-9 rounded-full bg-warning/15 text-warning grid place-items-center shrink-0"><BellRing size={17} /></span>
              <span className="text-xs leading-snug"><b className="block">Llevas el 85%</b><span className="text-muted">del presupuesto de comida</span></span>
            </div>
            <div aria-hidden className="hidden md:flex absolute left-[calc(100%-22px)] top-[320px] w-max glass shadow-float rounded-2xl p-3 items-center gap-2.5 animate-float [animation-delay:-3s]">
              <span className="size-9 rounded-full bg-success/15 text-success grid place-items-center shrink-0"><Target size={17} /></span>
              <span className="text-xs leading-snug"><b className="block">Viaje a Cartagena</b><span className="text-muted">72% de tu meta</span></span>
            </div>
            </div>
          </div>
        </section>

        {/* Demostración */}
        <section id="demo" className="scroll-mt-28 mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-24">
          <Reveal>
            <SectionTitle eyebrow="Pruébala aquí mismo" title="Escríbelo como lo dirías"
              text='Nada de formularios eternos. Escribe "25k almuerzo nequi" y MonEra entiende el monto, la categoría, la cuenta y la fecha.' />
          </Reveal>
          <Reveal delay={100} className="max-w-3xl mx-auto"><QuickDemo /></Reveal>
        </section>

        {/* Funciones */}
        <section id="funciones" className="scroll-mt-28 mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-24">
          <Reveal><SectionTitle eyebrow="Funciones" title="Todo tu dinero, en un solo lugar" text="Lo que necesitas para ordenar tus finanzas del día a día, sin complicaciones." /></Reveal>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <li key={f.title}>
                <Reveal delay={(i % 4) * 70} className="h-full">
                  <div className="h-full rounded-[1.5rem] bg-surface/90 border border-line/80 shadow-card p-6 hover:border-secondary/60 transition-colors">
                    <span className={cn('size-11 rounded-2xl grid place-items-center', f.tone)}><f.icon size={21} aria-hidden /></span>
                    <h3 className="mt-4 font-bold text-lg tracking-tight">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted leading-relaxed">{f.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-28 mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-24">
          <Reveal><SectionTitle eyebrow="Cómo funciona" title="Empieza en tres pasos" /></Reveal>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Reveal delay={i * 100} className="h-full">
                  <div className="relative h-full rounded-[1.5rem] bg-surface/90 border border-line/80 shadow-card p-6 md:p-7">
                    <span className="size-11 rounded-2xl bg-primary text-white font-extrabold grid place-items-center shadow-[0_10px_20px_-10px_rgba(108,76,241,.9)]">{i + 1}</span>
                    <h3 className="mt-5 font-bold text-xl tracking-tight">{s.title}</h3>
                    <p className="mt-2 text-muted leading-relaxed">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* Privacidad */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <Reveal>
            <div className="rounded-[1.75rem] border border-line/80 bg-surface/90 shadow-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
              <span className="size-14 rounded-2xl bg-success/12 text-success grid place-items-center shrink-0"><Lock size={26} aria-hidden /></span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Tu información es solo tuya</h2>
                <p className="mt-1 text-muted">Cada cuenta solo puede ver y modificar sus propios datos. MonEra no se conecta a tu banco ni te pide claves bancarias.</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Preguntas frecuentes */}
        <section id="preguntas" className="scroll-mt-28 mx-auto max-w-3xl px-4 sm:px-6 py-16 md:py-24">
          <Reveal><SectionTitle eyebrow="Preguntas frecuentes" title="Lo que sueles preguntarte" /></Reveal>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 50}>
                <details className="group rounded-2xl bg-surface/90 border border-line/80 shadow-card open:border-secondary/60 transition-colors">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold min-h-14 [&::-webkit-details-marker]:hidden">
                    {f.q}<ChevronDown size={18} className="text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="px-5 pb-5 -mt-1 text-muted leading-relaxed">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Llamado final */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 md:pb-24">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[2rem] px-6 py-12 md:py-16 text-center text-white shadow-float
              bg-[radial-gradient(120%_140%_at_0%_0%,#8b6ff7_0%,#6c4cf1_40%,#4930b8_75%,#2e2170_100%)]">
              <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-[#60a5fa]/30 blur-3xl -z-10" />
              <div aria-hidden className="absolute -left-16 -bottom-24 size-72 rounded-full bg-secondary/40 blur-3xl -z-10" />
              <Logo size={56} className="mx-auto drop-shadow-[0_12px_24px_rgba(20,10,60,.4)]" />
              <h2 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-balance">Empieza a ordenar tu dinero hoy</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto">Crea tu cuenta en menos de un minuto, con tu correo o con Google.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/registro" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-primary-dark font-semibold min-h-12 px-6 hover:bg-white/90 transition-colors cursor-pointer">
                  Crear mi cuenta<ArrowRight size={18} />
                </Link>
                <Link to="/entrar" className="inline-flex items-center justify-center rounded-2xl ring-1 ring-white/40 font-semibold min-h-12 px-6 hover:bg-white/10 transition-colors cursor-pointer">
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span className="flex items-center gap-2"><Logo size={26} /><b className="text-ink">MonEra</b> · Finanzas personales · Hecha en Colombia</span>
          <nav aria-label="Cuenta" className="flex gap-4">
            <Link to="/entrar" className="hover:text-ink min-h-11 inline-flex items-center">Iniciar sesión</Link>
            <Link to="/registro" className="hover:text-ink min-h-11 inline-flex items-center">Crear cuenta</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
