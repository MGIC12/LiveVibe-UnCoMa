import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Avatar from "../components/Avatar";
import FotoPerfil from "../components/FotoPerfil";
import { useAuth } from "../../context/AuthContext";
import { FOTO_VACIA, inputClase } from "../utils/formularios";
import { urlImagen } from "../utils/api";

export default function Perfil() {
  const { usuario, editarPerfil, cambiarFoto, quitarFoto } = useAuth();
  const { state } = useLocation();
  const aviso = state?.aviso;
  const esFan = usuario.rol === "fan";

  const [editando, setEditando] = useState(false);

  const [biografia, setBiografia] = useState("");
  const [cancion, setCancion] = useState("");
  const [foto, setFoto] = useState(FOTO_VACIA);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function empezarEdicion() {
    setBiografia(usuario.biografia ?? "");
    setCancion(usuario.cancion_favorita ?? "");
    setFoto(FOTO_VACIA);
    setMensaje("");
    setError("");
    setEditando(true);
  }

  function cancelar() {
    setError("");
    setEditando(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (esFan) {
        await editarPerfil({ biografia, cancion_favorita: cancion });
      }
      if (foto.archivo) {
        await cambiarFoto(foto.archivo);
      } else if (foto.quitar) {
        await quitarFoto();
      }
      setMensaje("Perfil actualizado correctamente");
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    // Contenedor principal con altura mínima completa y distribución flexible para anclar el footer abajo
    <div className="min-h-screen bg-tinta text-crema font-sans flex flex-col justify-between">
      <Navbar />

      {/* pt-28 evita que el Navbar fijo tape el contenido, w-full y max-w-2xl mejoran la adaptabilidad */}
      <main className="flex-grow container mx-auto px-4 pt-28 pb-16 w-full max-w-2xl space-y-6">
        {/* Cabecera: siempre visible */}
        <section className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl">
          <Avatar
            usuario={usuario}
            clases="w-20 h-20 text-4xl shadow-lg border-2 border-green-500/50"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">
              {usuario.nombre_usuario}
            </h1>
            <p className="text-crema/60 text-sm mb-3">{usuario.email}</p>
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold uppercase tracking-wider">
              {usuario.rol}
            </span>
          </div>
        </section>

        {editando ? (
          /* ---------- MODO EDICIÓN ---------- */
          <form
            onSubmit={handleSubmit}
            className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
          >
            <h2 className="text-2xl font-black text-white border-b border-neutral-800 pb-4">
              Editar <span className="text-green-500">mi perfil</span>
            </h2>

            <div className="flex flex-col items-center justify-center py-2">
              <FotoPerfil
                urlActual={urlImagen(usuario.foto_url)}
                valor={foto}
                onChange={setFoto}
                descripcion={usuario.foto_descripcion || "Foto de perfil"}
              />
            </div>

            {esFan ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-crema/80 mb-2">
                    Biografía
                  </label>
                  <textarea
                    value={biografia}
                    onChange={(e) => setBiografia(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Cuéntanos algo sobre ti..."
                    className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-crema focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none text-sm"
                  />
                  <span className="block text-right text-xs text-crema/50 mt-1">
                    {biografia.length}/500
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-bold text-crema/80 mb-2">
                    Canción favorita
                  </label>
                  <input
                    value={cancion}
                    onChange={(e) => setCancion(e.target.value)}
                    maxLength={150}
                    placeholder="Ej. De música ligera - Soda Stereo"
                    className="w-full px-4 py-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700 text-crema focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-crema/60 bg-neutral-800/40 p-4 rounded-xl border border-neutral-800">
                💡 Las cuentas de artista pueden cambiar su foto de perfil desde
                esta sección.
              </p>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-red-400 text-sm font-medium" role="alert">
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="flex-1 py-3.5 rounded-xl border border-neutral-700 text-crema/80 hover:bg-neutral-800 hover:text-white transition-all font-bold text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all shadow-lg text-sm disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          /* ---------- MODO VISTA ---------- */
          <section className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {aviso && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 text-amber-300 text-sm">
                {aviso}
              </div>
            )}
            {mensaje && (
              <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-4 text-green-400 text-sm font-medium">
                ✨ {mensaje}
              </div>
            )}

            <div className="bg-neutral-800/40 p-5 rounded-2xl border border-neutral-800">
              <h2 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">
                Biografía
              </h2>
              <p className="whitespace-pre-line text-crema/90 text-sm sm:text-base leading-relaxed">
                {usuario.biografia || (
                  <span className="text-crema/40 italic">
                    Todavía no escribiste tu biografía.
                  </span>
                )}
              </p>
            </div>

            {esFan && (
              <div className="bg-neutral-800/40 p-5 rounded-2xl border border-neutral-800">
                <h2 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">
                  Canción favorita
                </h2>
                <p className="text-crema/90 text-sm sm:text-base font-medium flex items-center gap-2">
                  {usuario.cancion_favorita ? (
                    <>🎵 {usuario.cancion_favorita}</>
                  ) : (
                    <span className="text-crema/40 italic font-normal">
                      Todavía no elegiste una canción favorita.
                    </span>
                  )}
                </p>
              </div>
            )}

            {usuario.fecha_alta && (
              <p className="text-xs text-crema/50 text-center pt-2">
                Miembro desde{" "}
                {new Date(usuario.fecha_alta).toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {usuario.rol === "artista" && (
                <Link
                  to="/eventos/nuevo"
                  className="w-full text-center py-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold transition-all text-sm shadow-md"
                >
                  ➕ Crear evento nuevo
                </Link>
              )}

              <button
                onClick={empezarEdicion}
                className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] text-sm"
              >
                Editar perfil
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
