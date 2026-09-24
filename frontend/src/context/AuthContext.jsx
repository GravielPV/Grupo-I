import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react"

import {
  login as loginRequest
} from "../services/authService"

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser =
      localStorage.getItem("pharmacy_user")

    const savedToken =
      localStorage.getItem("pharmacy_token")

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
    }

    setLoading(false)
  }, [])

  const login = async (username, password) => {

    try {

      const response = await loginRequest({
        username,
        password
      })

      const { token, user } = response.data

      localStorage.setItem(
        "pharmacy_user",
        JSON.stringify(user)
      )

      localStorage.setItem(
        "pharmacy_token",
        token
      )

      setUser(user)
      setToken(token)

      return {
        success: true
      }

    } catch (error) {

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "No se pudo iniciar sesión."
      }
    }
  }

  const logout = () => {

    localStorage.removeItem(
      "pharmacy_user"
    )

    localStorage.removeItem(
      "pharmacy_token"
    )

    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}