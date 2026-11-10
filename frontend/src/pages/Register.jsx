import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/Navbar";
import CamposFan from "../components/CamposFan";
import CamposArtista from "../components/CamposArtista";
import { FOTO_VACIA } from "../utils/formularios";
import CampoContrasena from "../components/CampoContrasena";
import FotoPerfil from "../components/FotoPerfil";

// Aspecto común de los campos y sus etiquetas
const campoClase =
  "w-full px-4 py-2.5 rounded-xl bg-crema/10 border border-crema/25 text-crema text-sm placeholder:text-crema/40 focus:outline-none focus:ring-2 focus:ring-cielo";
const etiquetaClase = "block text-sm font-bold text-crema/80 mb-1";

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
      } else if (form.rol === "fan") {
        // Los fans nuevos eligen sus géneros y artistas favoritos antes de entrar
        navigate("/bienvenida");
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
        className="font-bold text-cielo hover:text-crema transition-colors ml-1"
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
        <main className="min-h-screen bg-tinta flex items-center justify-center px-4 pt-24 pb-12 relative overflow-hidden">
          <div className="w-full max-w-lg bg-crema/5 backdrop-blur-xl border border-crema/20 rounded-3xl p-8 shadow-2xl relative z-10">
            <h1 className="text-3xl font-black text-crema text-center mb-6">
              ¿Cómo querés <span className="text-fucsia">registrarte?</span>
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => cambiarCampo("rol", "fan")}
                className="p-6 rounded-2xl border border-crema/20 bg-crema/5 hover:border-fucsia hover:bg-crema/10 transition text-center"
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
                className="p-6 rounded-2xl border border-crema/20 bg-crema/5 hover:border-fucsia hover:bg-crema/10 transition text-center"
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

      <main className="min-h-screen bg-tinta flex items-center justify-center px-4 pt-24 pb-16 relative">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl bg-crema/5 backdrop-blur-xl border border-crema/20 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6"
        >
          <div className="flex justify-between items-center border-b border-crema/20 pb-4">
            <button
              type="button"
              onClick={() => cambiarCampo("rol", "")}
              className="text-sm text-crema/70 hover:text-cielo transition-colors font-medium"
            >
              &larr; Cambiar tipo de cuenta
            </button>
            <h1 className="text-2xl font-black text-crema">
              Registro de{" "}
              <span className="text-fucsia">{esArtista ? "Artista" : "Fan"}</span>
            </h1>
          </div>

          {/* Grid de dos columnas para aprovechar los costados y reducir la altura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Foto e info básica */}
            <div className="space-y-4 flex flex-col items-center justify-center bg-crema/5 p-6 rounded-2xl border border-crema/20">
              <FotoPerfil
                urlActual={null}
                valor={form.foto}
                onChange={(v) => cambiarCampo("foto", v)}
                titulo="Foto de perfil"
              />

              <div className="w-full">
                <label className={etiquetaClase}>Nombre de usuario</label>
                <input
                  type="text"
                  name="nombre_usuario"
                  value={form.nombre_usuario}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  maxLength={30}
                  required
                  className={campoClase}
                />
              </div>

              <div className="w-full">
                <label className={etiquetaClase}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  required
                  className={campoClase}
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
                <label className={etiquetaClase}>Fecha de nacimiento</label>
                <input
                  type="date"
                  name="fecha_nac"
                  value={form.fecha_nac}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  className={`${campoClase} [color-scheme:dark]`}
                />
              </div>

              <div>
                <label className={etiquetaClase}>Biografía (opcional)</label>
                <textarea
                  name="biografia"
                  value={form.biografia}
                  onChange={(e) => cambiarCampo(e.target.name, e.target.value)}
                  rows={2}
                  className={`${campoClase} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Campos específicos abajo ocupando el ancho completo con estilo compacto */}
          <div className="pt-2 border-t border-crema/20">
            {esArtista ? (
              <CamposArtista valores={form} onChange={cambiarCampo} />
            ) : (
              <CamposFan valores={form} onChange={cambiarCampo} />
            )}
          </div>

          {error && (
            <div
              className="bg-mandarina/10 border border-mandarina/50 rounded-lg p-3 text-mandarina text-sm font-medium"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3.5 rounded-xl font-bold text-lg bg-fucsia hover:bg-chicle text-tinta transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? "Creando cuenta..." : "Registrarme"}
          </button>

          {piePagina}
        </form>
      </main>
    </>
  );
}