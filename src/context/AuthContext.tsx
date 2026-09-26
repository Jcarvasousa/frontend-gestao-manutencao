import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '@/api/auth'

const TOKEN_STORAGE_KEY = 'auth_token'

interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))

  const value = useMemo<AuthContextValue>(() => ({
    token,
    isAuthenticated: Boolean(token),
    login: async (username: string, password: string) => {
      const { token: novoToken } = await loginRequest(username, password)
      localStorage.setItem(TOKEN_STORAGE_KEY, novoToken)
      setToken(novoToken)
    },
    logout: () => {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken(null)
    },
  }), [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
