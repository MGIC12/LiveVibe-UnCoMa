import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/Navbar";
import CamposFan from "../components/CamposFan";
import CamposArtista from "../components/CamposArtista";
import { FOTO_VACIA } from "../utils/formularios";
import CampoContrasena from "../components/CampoContrasena";
import FotoPerfil from "../components/FotoPerfil";

const INICIAL = {
  foto: FOTO_VACIA,
  rol: "",
  nombre_usuario: "",
  email: "",
  contrasenia: "",
  confirmar: "",
  fecha_nac: "",
  biografia: "",
  cancion_favorita: "",
  nombre_artistico: "",
  nacionalidad: "",
  genero: "",
  tipo_artista: "solista",
  integrantes: [],
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INICIAL);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cambiarCampo(nombre, valor) {
    setForm((actual) => ({ ...actual, [nombre]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.contrasenia.length < 8) {
      return setError("La contraseña debe tener al menos 8 caracteres");
    }
    if (form.contrasenia !== form.confirmar) {
      return setError("Las contraseñas no coinciden");
    }

    const comunes = {
      rol: form.rol,
      nombre_usuario: form.nombre_usuario,
      email: form.email,
      contrasenia: form.contrasenia,
      fecha_nac: form.fecha_nac,
      biografia: form.biografia,
    };

    const datos =
      form.rol === "fan"
        ? { ...comunes, cancion_favorita: form.cancion_favorita }
        : {
            ...comunes,
            nombre_artistico: form.nombre_artistico,
            nacionalidad: form.nacionalidad,
            genero: form.genero,
            tipo_artista: form.tipo_artista,
            integrantes: form.tipo_artista === "banda" ? form.integrantes : [],
          };

    setEnviando(true);
    try {
      const { fotoError } = await register(datos, form.foto.archivo);

      if (fotoError) {
        navigate("/perfil", {
          state: {
            aviso: `Tu cuenta se creó, pero no pudimos subir la foto (${fotoError}).`,
          },
        });
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const piePagina = (
    <p className="text-center text-sm text-crema/70">
      ¿Ya tenés cuenta?{" "}
      <Link
        to="/login"
        className="font-bold text-cielo hover:text-green-400 transition-colors ml-1"
      >
        Iniciá sesión
      </Link>
    </p>
  );

  /* ---------- PASO 1: elegir tipo de cuenta ---------- */
  if (!form.rol) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-tinta flex items-center justify-center px-4 py-12 relative overflow-hidden">
          <div className="w-full max-w-lg bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10">
            <h1 className="text-3xl font-black text-crema text-center mb-6">
              ¿Cómo querés <span className="text-green-500">registrarte?</span>
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => cambiarCampo("rol", "fan")}
                className="p-6 rounded-2xl border border-neutral-700 bg-neutral-800/40 hover:border-green-500 transition text-center"
              >
                <span className="block text-4xl mb-2">🎧</span>
                <span className="block text-xl font-bold text-crema">Fan</span>
                <span className="block text-xs text-crema/60 mt-1">
                  Quiero descubrir conciertos
                </span>
              </button>

              <button
                type="button"
                onClick={() => cambiarCampo("rol", "artista")}
                className="p-6 rounded-2xl border border-neutral-700 bg-neutral-800/40 hover:border-green-500 transition text-center"
              >
                <span className="block text-4xl mb-2">🎤</span>
                <span className="block text-xl font-bold text-crema">
                  Artista
                </span>
                <span className="block text-xs text-crema/60 mt-1">
                  Quiero mostrar mi música
                </span>
              </button>
            </div>

            {piePagina}
          </div>
        </main>
      </>
    );
  }

  /* ---------- PASO 2: formulario en dos columnas ---------- */
  const esArtista = form.rol === "artista";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-tinta flex items-center justify-center px-4 py-20 relative">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6"
        >
          <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
            <button
              type="button"
              onClick={() => cambiarCampo("rol", "")}
              className="text-sm text-crema/70 hover:text-green-400 transition-colors font-medium"
            >
              &larr; Cambiar tipo de cuenta
            </button>
            <h1 className="text-2xl font-black text-crema">
              Registro de{" "}
              <span className="text-green-500">
                {esArtista ? "Artista" : "Fan"}
              </span>
            </h1>
          </div>

          {/* Grid de dos columnas para aprovechar los costados y reducir la altura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Foto e info básica */}
            <div className="space-y-4 flex flex-col items-center justify-center bg-neutral-800/30 p-6 rounded-2xl border border-neutral-800">
              <FotoPerfil
                urlActual={null}
                valor={form.foto}
                onChange={(v) => cambiarCampo("foto", v)}
                titulo="Foto de perfil"
              />

              <div className="w-full">
                <label className="block text-sm font-bold text-crema/80 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  name="nombre_usuario"
                  value={form.nombre_usuario}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  maxLength={30}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-crema text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-bold text-crema/80 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-crema text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Columna Derecha: Contraseñas y datos adicionales */}
            <div className="space-y-4">
              <CampoContrasena
                etiqueta="Contraseña (mín. 8 caracteres)"
                name="contrasenia"
                value={form.contrasenia}
                onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                autoComplete="new-password"
              />

              <CampoContrasena
                etiqueta="Repetir contraseña"
                name="confirmar"
                value={form.confirmar}
                onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                autoComplete="new-password"
              />

              <div>
                <label className="block text-sm font-bold text-crema/80 mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  name="fecha_nac"
                  value={form.fecha_nac}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-crema text-sm focus:outline-none focus:ring-2 focus:ring-green-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-crema/80 mb-1">
                  Biografía (opcional)
                </label>
                <textarea
                  name="biografia"
                  value={form.biografia}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-crema text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Campos específicos abajo ocupando el ancho completo con estilo compacto */}
          <div className="pt-2 border-t border-neutral-800">
            {esArtista ? (
              <CamposArtista valores={form} onChange={cambiarCampo} />
            ) : (
              <CamposFan valores={form} onChange={cambiarCampo} />
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3.5 rounded-xl font-bold text-lg bg-green-500 hover:bg-green-400 text-black transition-all shadow-lg"
          >
            {enviando ? "Creando cuenta..." : "Registrarme"}
          </button>

          {piePagina}
        </form>
      </main>
    </>
  );
}
