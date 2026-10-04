import { collection, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'
import { DEFAULT_CATEGORIES } from '../constants/categories'

export type CollectionName =
  | 'accounts' | 'categories' | 'transactions' | 'debts' | 'receivables' | 'budgets' | 'goals'

/** Firestore no acepta `undefined`; esto lo elimina. */
function clean(obj: object): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj)) as Record<string, unknown>
}

/** Crea (sin id) o reemplaza (con id) un documento del usuario. Devuelve el id. */
export async function saveItem(uid: string, name: CollectionName, item: { id?: string; [key: string]: unknown }): Promise<string> {
  const ref = item.id ? doc(db, 'users', uid, name, item.id) : doc(collection(db, 'users', uid, name))
  const data = clean(item)
  delete data.id
  await setDoc(ref, data)
  return ref.id
}

export async function removeItem(uid: string, name: CollectionName, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, name, id))
}

/** Crea las categorías predeterminadas (ids fijos, así nunca se duplican). */
export async function seedCategories(uid: string): Promise<void> {
  const batch = writeBatch(db)
  for (const c of DEFAULT_CATEGORIES) {
    const data = clean(c)
    delete data.id
    batch.set(doc(db, 'users', uid, 'categories', c.id), data)
  }
  await batch.commit()
}
