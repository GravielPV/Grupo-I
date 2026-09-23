import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react"

const AuthContext = createContext()

// Esto es solamente para probar el frontend.
// Luego será sustituido por el backend + MongoDB + JWT.
const demoUsers = [
  {
    id: 1,
    name: "Carlos Pérez",
    username: "admin",
    password: "123456",
    role: "admin"
  },
  {
    id: 2,
    name: "María Rodríguez",
    username: "empleado",
    password: "123456",
    role: "employee"
  }
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("pharmacy_user")
    const savedToken = localStorage.getItem("pharmacy_token")

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
    }

    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const foundUser = demoUsers.find(
      (user) =>
        user.username === username &&
        user.password === password
    )

    if (!foundUser) {
      return {
        success: false,
        message: "Usuario o contraseña incorrectos."
      }
    }

    const userData = {
      id: foundUser.id,
      name: foundUser.name,
      username: foundUser.username,
      role: foundUser.role
    }

    const demoToken = "demo-token"

    localStorage.setItem(
      "pharmacy_user",
      JSON.stringify(userData)
    )

    localStorage.setItem(
      "pharmacy_token",
      demoToken
    )

    setUser(userData)
    setToken(demoToken)

    return {
      success: true
    }
  }

  const logout = () => {
    localStorage.removeItem("pharmacy_user")
    localStorage.removeItem("pharmacy_token")

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