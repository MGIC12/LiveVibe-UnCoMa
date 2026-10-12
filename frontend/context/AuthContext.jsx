import { createContext, useContext, useEffect, useState } from "react";

import { API } from "../src/utils/api";

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

  async function enviarFoto(tokenSesion, archivo) {
  const formData = new FormData();
  formData.append("imagen", archivo); // el backend espera el campo "imagen"

  const res = await fetch(`${API}/api/perfil/foto`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${tokenSesion}` }, // sin Content-Type
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen");
  return data; // { foto_url, foto_descripcion }
}

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

   async function register(datos, foto) {
    const data = await pedir("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    // La foto es opcional: se sube con el token de la cuenta recién creada
    let imagen = {};
    let fotoError = null;
    if (foto) {
      try {
        imagen = await enviarFoto(data.token, foto);
      } catch (err) {
        fotoError = err.message; // la cuenta ya existe; solo falló la foto
      }
    }

    guardarSesion({ token: data.token, usuario: { ...data.usuario, ...imagen } });
    return { fotoError };
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
  }

  async function editarPerfil(datos) {
    const res = await fetch(`${API}/api/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Ocurrió un error");

    // Actualiza el usuario en memoria: toda la app ve los cambios sin recargar
    setUsuario((actual) => ({ ...actual, ...data }));
  }

    async function cambiarFoto(archivo) {
    const data = await enviarFoto(token, archivo);
    setUsuario((actual) => ({ ...actual, ...data }));
  }

  async function quitarFoto() {
    const res = await fetch(`${API}/api/perfil/foto`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "No se pudo quitar la foto");
    setUsuario((actual) => ({ ...actual, ...data }));
  }

  return (
   <AuthContext.Provider
      value={{ usuario, token, cargando, login, register, logout, editarPerfil, cambiarFoto, quitarFoto }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}