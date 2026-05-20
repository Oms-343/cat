import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMe, login as loginApi, type LoginUserType } from '../api/auth'
import { getToken, setToken } from '../api/client'
import type { LoginResponse, User } from '../types/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string, userType?: LoginUserType) => Promise<void>
  applyLogin: (res: LoginResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string, userType?: LoginUserType) {
    const res = await loginApi(email, password, userType)
    setToken(res.access_token)
    setUser(res.user)
  }

  function applyLogin(res: LoginResponse) {
    setToken(res.access_token)
    setUser(res.user)
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, applyLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
