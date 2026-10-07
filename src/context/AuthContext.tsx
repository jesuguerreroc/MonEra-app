import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User,
} from 'firebase/auth'
import { clearIndexedDbPersistence, terminate, waitForPendingWrites } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

interface AuthValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function authErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Correo o contraseña incorrectos.'
    case 'auth/email-already-in-use': return 'Ese correo ya tiene una cuenta. Prueba iniciar sesión.'
    case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/invalid-email': return 'El correo no es válido.'
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    case 'auth/network-request-failed': return 'No hay conexión. Revisa tu internet.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return 'Cerraste la ventana de Google antes de terminar.'
    default: return 'Algo salió mal. Inténtalo de nuevo.'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileTick, setProfileTick] = useState(0) // fuerza refresco al guardar el nombre

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false) }), [])

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    login: async (email, password) => { await signInWithEmailAndPassword(auth, email, password) },
    register: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      setProfileTick((t) => t + 1)
    },
    loginWithGoogle: async () => { await signInWithPopup(auth, new GoogleAuthProvider()) },
    resetPassword: async (email) => { await sendPasswordResetEmail(auth, email) },
    logout: async () => {
      // Si hay cambios hechos sin internet que aún no se subieron, cerrar sesión los perdería
      const synced = await Promise.race([
        waitForPendingWrites(db).then(() => true),
        new Promise<boolean>((r) => setTimeout(() => r(false), 2500)),
      ])
      if (!synced) throw new Error('pending-writes')
      await signOut(auth)
      // Borra la copia local de los datos (importante en computadores compartidos) y reinicia limpio
      await terminate(db).then(() => clearIndexedDbPersistence(db)).catch(() => {})
      window.location.reload()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, loading, profileTick])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
