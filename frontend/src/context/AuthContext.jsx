import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from '../services/api.js'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw && localStorage.getItem(TOKEN_KEY) ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback((jwtResponse) => {
    const nextUser = { username: jwtResponse.username, role: jwtResponse.role }
    localStorage.setItem(TOKEN_KEY, jwtResponse.token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout)
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isTeacher: user?.role === 'TEACHER',
      isAdmin: user?.role === 'ADMIN',
      isStudent: user?.role === 'STUDENT',
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth має використовуватися всередині AuthProvider')
  }
  return context
}
