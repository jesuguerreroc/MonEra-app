import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { authErrorMessage, useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Field, inputCls } from '../components/ui/Field'
import { PigLogo } from '../components/ui/PigLogo'

type Mode = 'login' | 'register' | 'reset'

export default function AuthPage() {
  const { login, register, loginWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const title = mode === 'login' ? 'Bienvenido de nuevo' : mode === 'register' ? 'Crea tu cuenta' : 'Recupera tu contraseña'

  return (
    <div className="min-h-dvh md:grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-primary-dark text-white p-12">
        <div className="flex items-center gap-3"><PigLogo size={44} /><span className="text-2xl font-extrabold">Fylo</span></div>
        <div>
          <PigLogo size={140} animated bg={false} />
          <h2 className="text-4xl font-extrabold leading-tight mt-6 max-w-sm">Tus finanzas, fluyendo sin esfuerzo.</h2>
          <p className="text-white/70 mt-3 max-w-sm">Registra un gasto en segundos y entiende tu situación de un vistazo.</p>
        </div>
        <p className="text-white/50 text-sm">Finance + Flow</p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-sm animate-rise">
          <div className="md:hidden flex flex-col items-center mb-8">
            <PigLogo size={84} animated />
            <span className="text-3xl font-extrabold tracking-tight text-primary-dark mt-3">Fylo</span>
          </div>

          {mode === 'reset' && (
            <button onClick={() => go('login')} className="flex items-center gap-1 text-sm text-muted mb-4 min-h-11">
              <ArrowLeft size={16} /> Volver
            </button>
          )}
          <h1 className="text-2xl font-bold mb-6">{title}</h1>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Nombre"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
            )}
            <Field label="Correo electrónico">
              <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
            </Field>
            {mode !== 'reset' && (
              <Field label="Contraseña" hint={mode === 'register' ? 'Mínimo 6 caracteres' : undefined}>
                <input className={inputCls} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </Field>
            )}

            {error && <p role="alert" className="text-sm text-danger font-medium">{error}</p>}
            {info && <p role="status" className="text-sm text-success font-medium">{info}</p>}

            <Button type="submit" full loading={busy}>
              {mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
            </Button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3 my-5 text-xs text-muted"><span className="h-px bg-line flex-1" />o<span className="h-px bg-line flex-1" /></div>
              <Button variant="soft" full onClick={google} disabled={busy}>Continuar con Google</Button>
            </>
          )}

          <div className="mt-6 text-center text-sm text-muted space-y-1">
            {mode === 'login' && (
              <>
                <button className="min-h-11 text-primary font-semibold" onClick={() => go('reset')}>¿Olvidaste tu contraseña?</button>
                <p>¿Aún no tienes cuenta? <button className="text-primary font-semibold min-h-11" onClick={() => go('register')}>Regístrate</button></p>
              </>
            )}
            {mode === 'register' && <p>¿Ya tienes cuenta? <button className="text-primary font-semibold min-h-11" onClick={() => go('login')}>Inicia sesión</button></p>}
          </div>
        </div>
      </div>
    </div>
  )
}
