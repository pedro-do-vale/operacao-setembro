import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, isDemoMode } from '../lib/firebase'
import type { AvatarBase, User } from '../types'
import { demoAuth } from './demo/demoAuth'

export async function registerUser(
  email: string,
  password: string,
  nickname: string,
  avatarBase: AvatarBase
): Promise<User> {
  if (isDemoMode) return demoAuth.register(email, password, nickname, avatarBase)

  if (!auth || !db) throw new Error('Firebase não configurado')

  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  const userData = {
    nickname,
    avatarBase,
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', uid), userData)

  return {
    uid,
    nickname,
    avatarBase,
    createdAt: new Date(),
  }
}

export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  if (isDemoMode) return demoAuth.login(email, password)
  if (!auth) throw new Error('Firebase não configurado')
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function logoutUser(): Promise<void> {
  if (isDemoMode) return demoAuth.logout()
  if (!auth) throw new Error('Firebase não configurado')
  await signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  if (isDemoMode) return demoAuth.resetPassword(email)
  if (!auth) throw new Error('Firebase não configurado')
  await sendPasswordResetEmail(auth, email)
}

export async function getUserProfile(uid: string): Promise<User | null> {
  if (isDemoMode) return demoAuth.getUserProfile(uid)
  if (!db) throw new Error('Firebase não configurado')

  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null

  const data = snap.data()
  return {
    uid,
    nickname: data.nickname,
    avatarBase: data.avatarBase,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  }
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  if (isDemoMode) return demoAuth.subscribe(callback)
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
