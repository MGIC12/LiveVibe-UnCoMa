import { createContext, useContext, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AuthContext = createContext(null);

async function pedir(ruta, opciones) {
  const res = await fetch(`${API}/api/auth${ruta}`, opciones);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Ocurrió un error");
  return data;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => !!localStorage.getItem("token"));

  // Al abrir la página (o al cambiar el token) recupera el usuario de la sesión
  useEffect(() => {
    if (!token) {
      setUsuario(null);
      setCargando(false);
      return;
    }
    pedir("/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(setUsuario)
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, [token]);

  function guardarSesion({ token, usuario }) {
    localStorage.setItem("token", token);
    setToken(token);
    setUsuario(usuario);
  }

  async function login(usuario, contrasenia) {
    const data = await pedir("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, contrasenia }),
    });
    guardarSesion(data);
  }

  async function register(datos) {
    const data = await pedir("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    guardarSesion(data);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}