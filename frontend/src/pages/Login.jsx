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

      <main className="min-h-screen bg-tinta flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Elementos decorativos de fondo para darle estilo */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-crema tracking-tight mb-2">
              Bienvenido!
            </h1>
            <p className="text-crema/60 text-sm">
              Ingresa a tu cuenta para seguir conectado con la mejor música.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-crema/80 mb-2">
                Usuario o Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700 text-crema focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-crema/30"
                />
              </div>
            </div>
            <div className="relative">
              <CampoContrasena
                etiqueta="Contraseña"
                value={contrasenia}
                onChange={(e) => setContrasenia(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-red-400 text-sm font-medium" role="alert">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg flex justify-center items-center gap-2 ${
                enviando
                  ? "bg-neutral-800 text-crema/50 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-400 text-black transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              }`}
            >
              {enviando ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-crema/50"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Conectando...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
            <p className="text-sm text-crema/70">
              ¿No tenés cuenta?{" "}
              <Link
                to="/registro"
                className="font-bold text-cielo hover:text-green-400 transition-colors ml-1"
              >
                Regístrate acá
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
