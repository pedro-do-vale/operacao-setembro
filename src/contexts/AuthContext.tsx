import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import { subscribeToAuth, getUserProfile } from '../services/authService'
import type { User } from '../types'
import { isDemoMode } from '../lib/firebase'
import { demoStore } from '../services/demo/demoStore'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  isDemoMode: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setFirebaseUser(user)
      if (user) {
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
        if (isDemoMode && profile) {
          demoStore.setCurrentPlayer(profile.uid)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
