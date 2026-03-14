import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('rc_token'))
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_user')) } catch { return null }
  })

  const login = (tk, usr) => {
    setToken(tk)
    setUser(usr)
    localStorage.setItem('rc_token', tk)
    localStorage.setItem('rc_user', JSON.stringify(usr))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('rc_token')
    localStorage.removeItem('rc_user')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
