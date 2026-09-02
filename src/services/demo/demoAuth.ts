import type { User as FirebaseUser } from 'firebase/auth'
import type { AvatarBase, User } from '../../types'

type DemoUser = User & { email: string; password: string }

const DEMO_USERS: DemoUser[] = [
  { uid: 'p1', nickname: 'PEDRÃO', avatarBase: 'base-a', createdAt: new Date(), email: 'pedrao@demo.com', password: 'demo123' },
  { uid: 'p2', nickname: 'BRUNÃO', avatarBase: 'base-b', createdAt: new Date(), email: 'brunao@demo.com', password: 'demo123' },
  { uid: 'p9', nickname: 'JOÃO', avatarBase: 'base-a', createdAt: new Date(), email: 'joao@demo.com', password: 'demo123' },
]

let currentUid: string | null = null
const listeners = new Set<(user: FirebaseUser | null) => void>()

function notify() {
  const fakeUser = currentUid
    ? ({ uid: currentUid, email: DEMO_USERS.find((u) => u.uid === currentUid)?.email ?? '' } as FirebaseUser)
    : null
  listeners.forEach((cb) => cb(fakeUser))
}

export const demoAuth = {
  async register(email: string, password: string, nickname: string, avatarBase: AvatarBase): Promise<User> {
    const uid = `demo-${Date.now()}`
    const user: DemoUser = { uid, nickname, avatarBase, createdAt: new Date(), email, password }
    DEMO_USERS.push(user)
    currentUid = uid
    notify()
    return user
  },

  async login(email: string, password: string): Promise<FirebaseUser> {
    const user = DEMO_USERS.find((u) => u.email === email && u.password === password)
    if (!user) throw new Error('Credenciais inválidas')
    currentUid = user.uid
    notify()
    return { uid: user.uid, email: user.email } as FirebaseUser
  },

  async logout(): Promise<void> {
    currentUid = null
    notify()
  },

  async resetPassword(_email: string): Promise<void> {
    // noop in demo
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const user = DEMO_USERS.find((u) => u.uid === uid)
    if (!user) return null
    const { email: _, password: __, ...profile } = user
    return profile
  },

  subscribe(callback: (user: FirebaseUser | null) => void) {
    listeners.add(callback)
    const fakeUser = currentUid
      ? ({ uid: currentUid, email: DEMO_USERS.find((u) => u.uid === currentUid)?.email ?? '' } as FirebaseUser)
      : null
    callback(fakeUser)
    return () => listeners.delete(callback)
  },

  getDemoAccounts: () => DEMO_USERS.map((u) => ({ email: u.email, nickname: u.nickname })),
}
