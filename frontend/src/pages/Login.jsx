import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(usuario, contrasenia);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex justify-center px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-5"
        >
          <h1 className="text-3xl font-bold text-white text-center">
            Iniciar sesión
          </h1>

          <label className="block text-sm text-gray-300">
            Usuario o email
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>

          <label className="block text-sm text-gray-300">
            Contraseña
            <input
              type="password"
              value={contrasenia}
              onChange={(e) => setContrasenia(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>

          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
          >
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>

          <p className="text-center text-sm text-gray-400">
            ¿No tenés cuenta?{" "}
            <Link to="/registro" className="text-purple-400 hover:text-purple-300">
              Registrate
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}