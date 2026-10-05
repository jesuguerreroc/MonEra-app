import { useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle, ArrowDownLeft, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, PieChart, ShieldCheck, Target, User, Zap, type LucideIcon } from 'lucide-react'
import { authErrorMessage, useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { inputCls } from '../components/ui/Field'
import { Logo } from '../components/ui/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { cn } from '../utils/cn'

type Mode = 'login' | 'register' | 'reset'

const COPY: Record<Mode, { title: string; text: string; cta: string }> = {
  login: { title: 'Bienvenido de nuevo', text: 'Ingresa para ver cómo van tus finanzas.', cta: 'Iniciar sesión' },
  register: { title: 'Crea tu cuenta', text: 'Empieza a ordenar tu dinero en menos de un minuto.', cta: 'Crear cuenta' },
  reset: { title: 'Recupera tu contraseña', text: 'Te enviaremos un enlace a tu correo para crear una nueva.', cta: 'Enviar enlace' },
}

const BRAND_BG = 'bg-gradient-to-br from-[#8b6ff7] via-primary to-primary-dark'

export default function AuthPage() {
  const { login, register, loginWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const go = (m: Mode) => { setMode(m); setError(''); setInfo('') }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else if (mode === 'register') {
        if (!name.trim()) throw new Error('empty-name')
        await register(name.trim(), email.trim(), password)
      } else {
        await resetPassword(email.trim())
        setInfo('Te enviamos un correo para crear una nueva contraseña. Revisa también el spam.')
      }
    } catch (err) {
      setError(err instanceof Error && err.message === 'empty-name' ? 'Escribe tu nombre.' : authErrorMessage(err))
    } finally { setBusy(false) }
  }

  async function google() {
    setError(''); setBusy(true)
    try { await loginWithGoogle() } catch (err) { setError(authErrorMessage(err)) } finally { setBusy(false) }
  }

  const copy = COPY[mode]

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[1.1fr_1fr]">
      <ThemeToggle className="absolute z-20 right-3 top-[max(0.75rem,env(safe-area-inset-top))] text-white/85 hover:bg-white/15 hover:text-white lg:text-muted lg:hover:bg-ink/5 lg:hover:text-ink" />

      <BrandPanel />

      {/* Móvil / tablet: cabecera de marca */}
      <header className={cn('lg:hidden relative overflow-hidden text-white text-center px-6 pb-16 pt-[max(3rem,calc(env(safe-area-inset-top)+2rem))]', BRAND_BG)}>
        <Blobs />
        <div className="relative animate-rise">
          <Logo size={84} animated className="mx-auto drop-shadow-[0_12px_24px_rgba(20,10,60,.35)]" />
          <p className="text-3xl font-extrabold tracking-tight mt-3">MonEra</p>
          <p className="text-white/75 text-sm mt-1">Tus finanzas, fluyendo sin esfuerzo.</p>
        </div>
      </header>

      {/* Formulario: hoja que sube en móvil, tarjeta centrada en escritorio */}
      <main className="relative -mt-8 lg:mt-0 rounded-t-[2rem] lg:rounded-none bg-background lg:flex lg:items-center lg:justify-center px-5 pt-7 pb-[max(2rem,env(safe-area-inset-bottom))] lg:p-10">
        <div className="mx-auto w-full max-w-md lg:bg-surface lg:rounded-[2rem] lg:border lg:border-line lg:shadow-card lg:p-10">
          {mode === 'reset' ? (
            <button type="button" onClick={() => go('login')} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4 min-h-11 -ml-1">
              <ArrowLeft size={16} /> Volver a iniciar sesión
            </button>
          ) : (
            <div role="tablist" aria-label="Acceso" className="grid grid-cols-2 p-1 rounded-2xl bg-ink/[0.05] mb-7">
              {(['login', 'register'] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => go(m)}
                  className={cn('min-h-11 rounded-xl text-sm font-semibold transition',
                    mode === m ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(23,21,31,.12)]' : 'text-muted hover:text-ink')}>
                  {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          )}

          <div key={mode} className="animate-rise">
            <h1 className="text-2xl md:text-[1.75rem] font-extrabold tracking-tight">{copy.title}</h1>
            <p className="text-muted text-sm mt-1 mb-6">{copy.text}</p>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <AuthInput label="Nombre" icon={User} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="¿Cómo te llamas?" />
              )}
              <AuthInput label="Correo electrónico" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" inputMode="email" placeholder="tu@correo.com" />
              {mode !== 'reset' && (
                <AuthInput label="Contraseña" icon={Lock} type={showPass ? 'text' : 'password'} required minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  aside={mode === 'login' && (
                    <button type="button" onClick={() => go('reset')} className="text-sm font-semibold text-primary-ink hover:underline">¿La olvidaste?</button>
                  )}
                  trailing={(
                    <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="size-10 grid place-items-center rounded-lg text-muted hover:text-ink">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )} />
              )}

              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 text-danger px-3.5 py-3 text-sm font-medium">
                  <AlertCircle size={18} className="shrink-0 mt-px" />{error}
                </p>
              )}
              {info && (
                <p role="status" className="flex items-start gap-2 rounded-xl bg-success/10 text-success px-3.5 py-3 text-sm font-medium">
                  <CheckCircle2 size={18} className="shrink-0 mt-px" />{info}
                </p>
              )}

              <Button type="submit" full loading={busy} className="!min-h-13 shadow-[0_10px_24px_-10px_rgba(108,76,241,.8)]">{copy.cta}</Button>
            </form>

            {mode !== 'reset' && (
              <>
                <div className="flex items-center gap-3 my-6 text-xs text-muted">
                  <span className="h-px bg-line flex-1" />o continúa con<span className="h-px bg-line flex-1" />
                </div>
                <button type="button" onClick={google} disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-line bg-surface min-h-12 text-[15px] font-semibold hover:bg-ink/[0.03] transition active:scale-[.98] disabled:opacity-50">
                  <GoogleMark /> Google
                </button>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            {mode === 'register' ? 'Al crear tu cuenta, tus datos quedan guardados solo para ti.' : 'Hecho para tu día a día'}
          </p>
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: LucideIcon
  aside?: ReactNode
  trailing?: ReactNode
}

/** Campo con icono a la izquierda y, opcionalmente, un enlace junto a la etiqueta y un botón a la derecha. */
function AuthInput({ label, icon: Icon, aside, trailing, className, ...rest }: AuthInputProps) {
  const id = useId()
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {aside}
      </div>
      <div className="relative group">
        <Icon size={18} aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition" />
        <input id={id} {...rest} className={cn(inputCls, 'pl-11 focus:ring-4 focus:ring-primary/15 outline-none', !!trailing && 'pr-12', className)} />
        {trailing && <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  )
}

/** Manchas de color difuminadas que se mueven lento detrás del contenido. */
function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 -left-20 size-72 rounded-full bg-secondary/45 blur-3xl animate-blob" />
      <div className="absolute -bottom-28 right-[-4rem] size-80 rounded-full bg-[#f6c445]/20 blur-3xl animate-blob [animation-delay:-7s]" />
      <div className="absolute inset-0 opacity-[.13] bg-[radial-gradient(rgba(255,255,255,.9)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
    </div>
  )
}

const glass = 'rounded-2xl bg-white/12 ring-1 ring-white/25 backdrop-blur-md shadow-[0_20px_40px_-20px_rgba(20,10,60,.6)]'

/** Escritorio: panel de marca con titular y una vista previa de la app. */
function BrandPanel() {
  return (
    <aside className={cn('hidden lg:flex relative overflow-hidden flex-col justify-between gap-10 p-12 xl:p-14 text-white min-h-dvh', BRAND_BG)}>
      <Blobs />

      <div className="relative flex items-center gap-3">
        <Logo size={46} className="drop-shadow-[0_8px_18px_rgba(20,10,60,.4)]" />
        <span className="text-2xl font-extrabold tracking-tight">MonEra</span>
      </div>

      <div className="relative grid xl:grid-cols-[1fr_auto] items-center gap-10">
        <div className="animate-rise">
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.08] tracking-tight max-w-md">
            Tus finanzas, <span className="text-[#ffd76a]">fluyendo</span> sin esfuerzo.
          </h2>
          <p className="text-white/75 mt-4 max-w-sm text-[15px] leading-relaxed">
            Registra un gasto en segundos y entiende tu situación de un vistazo: cuentas, presupuestos, deudas y metas en un solo lugar.
          </p>
        </div>

        {/* Vista previa ilustrativa (decorativa) */}
        <div aria-hidden className="relative w-72 h-72 mx-auto xl:mx-0">
          <div className={cn(glass, 'absolute inset-x-0 top-10 p-5 animate-float')}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/70">Saldo total</p>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">+12% este mes</span>
            </div>
            <p className="text-2xl font-extrabold tabular-nums mt-1">$2.088.500</p>
            <svg viewBox="0 0 120 36" className="w-full h-12 mt-2" fill="none">
              <defs>
                <linearGradient id="auth-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 30 C12 28 18 20 30 22 S48 30 60 18 S84 14 92 10 S110 8 120 3 V36 H0Z" fill="url(#auth-spark)" />
              <path d="M0 30 C12 28 18 20 30 22 S48 30 60 18 S84 14 92 10 S110 8 120 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          <div className={cn(glass, 'absolute -left-10 bottom-2 flex items-center gap-3 p-3 pr-4 animate-float [animation-delay:-2s]')}>
            <span className="size-9 rounded-full bg-[#3ccf86]/25 text-[#a7f3d0] grid place-items-center"><ArrowDownLeft size={18} /></span>
            <div>
              <p className="text-xs font-semibold">Salario</p>
              <p className="text-[11px] text-white/70">+$3.500.000</p>
            </div>
          </div>

          <div className={cn(glass, 'absolute -right-8 -top-14 w-40 p-3 animate-float [animation-delay:-4s]')}>
            <div className="flex items-center gap-2 text-xs font-semibold"><Target size={14} className="text-[#ffd76a]" />Viaje a Cartagena</div>
            <div className="h-1.5 rounded-full bg-white/20 mt-2 overflow-hidden"><div className="h-full w-[72%] rounded-full bg-[#ffd76a]" /></div>
            <p className="text-[11px] text-white/70 mt-1.5">72% de tu meta</p>
          </div>
        </div>
      </div>

      <ul className="relative grid grid-cols-3 gap-4 text-sm">
        <Feature icon={Zap} title="En segundos" text="Registra gastos sin complicarte." />
        <Feature icon={PieChart} title="Todo claro" text="Reportes fáciles de entender." />
        <Feature icon={ShieldCheck} title="Privado" text="Tu información es solo tuya." />
      </ul>
    </aside>
  )
}

function Feature({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <li>
      <span className="size-9 rounded-xl bg-white/15 ring-1 ring-white/20 grid place-items-center mb-2"><Icon size={18} /></span>
      <p className="font-semibold">{title}</p>
      <p className="text-white/65 text-xs mt-0.5 leading-relaxed">{text}</p>
    </li>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
