import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/Navbar";
import CampoContrasena from "../components/CampoContrasena";

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
          className="w-full max-w-md bg-crema/5border border-crema/20rounded-2xl p-8 space-y-5"
        >
          <h1 className="text-3xl font-bold text-crema text-center">
            Iniciar sesión
          </h1>

          <label className="block text-sm text-crema/80 ">
            Usuario o email
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full px-4 py-2 rounded-full bg-crema/10text-crema focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </label>

          <CampoContrasena
            etiqueta="Contraseña"
            value={contrasenia}
            onChange={(e) => setContrasenia(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <p className="text-mandarina text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-2 rounded-full bg-fucsia hover:bg-chicle text-crema font-bold disabled:opacity-50"
          >
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>

          <p className="text-center text-sm text-crema/70">
            ¿No tenés cuenta?{" "}
            <Link to="/registro" className="text-cielo hover:text-cremahover:text-purple-300">
              Registrate
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}