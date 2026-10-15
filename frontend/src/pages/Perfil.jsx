import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import FotoPerfil from "../components/FotoPerfil";
import { useAuth } from "../../context/AuthContext";
import { FOTO_VACIA, inputClase } from "../utils/formularios";
import { urlImagen } from "../utils/api";

export default function Perfil() {
  const { usuario, editarPerfil, cambiarFoto, quitarFoto } = useAuth();
  const { state } = useLocation();
  const aviso = state?.aviso; // viene del registro si falló la foto
  const esFan = usuario.rol === "fan";

  const [editando, setEditando] = useState(false);

  // Borrador: lo que se está editando en el formulario
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
    // El borrador se descarta; lo guardado no cambió
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
      setError(err.message); // se queda en edición para poder corregir
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12 text-crema space-y-6">
        {/* Cabecera: siempre visible */}
        <section className="bg-crema/5border border-crema/20rounded-2xl p-6 flex items-center gap-4">
          <Avatar usuario={usuario} clases="w-16 h-16 text-3xl" />
          <div>
            <h1 className="text-2xl font-bold">{usuario.nombre_usuario}</h1>
            <p className="text-crema/70 text-sm">{usuario.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-sol text-tinta text-xs capitalize">
              {usuario.rol}
            </span>
          </div>
        </section>

        {editando ? (
          /* ---------- MODO EDICIÓN ---------- */
          <form
            onSubmit={handleSubmit}
            className="bg-crema/5border border-crema/20rounded-2xl p-6 space-y-5"
          >
            <h2 className="text-xl font-semibold">Editar mi perfil</h2>

            <FotoPerfil
              urlActual={urlImagen(usuario.foto_url)}
              valor={foto}
              onChange={setFoto}
              descripcion={usuario.foto_descripcion || "Foto de perfil"}
            />

            {esFan ? (
              <>
                <label className="block text-sm text-crema/80 ">
                  Biografía
                  <textarea
                    value={biografia}
                    onChange={(e) => setBiografia(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="mt-1 w-full px-4 py-2 rounded-2xl bg-crema/10text-crema focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs text-crema/60">{biografia.length}/500</span>
                </label>

                <label className="block text-sm text-crema/80 ">
                  Canción favorita
                  <input
                    value={cancion}
                    onChange={(e) => setCancion(e.target.value)}
                    maxLength={150}
                    className={inputClase}
                  />
                </label>
              </>
            ) : (
              <p className="text-xs text-crema/60">
                Por ahora, las cuentas de artista pueden cambiar su foto desde acá.
              </p>
            )}

            {error && (
              <p className="text-mandarina text-sm" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="flex-1 py-2 rounded-full border border-crema/30 text-crema/80  hover:border-fucsia hover:text-crema disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-2 rounded-full bg-fucsia hover:bg-chicle font-bold disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          /* ---------- MODO VISTA ---------- */
          <section className="bg-crema/5border border-crema/20rounded-2xl p-6 space-y-5">
            {aviso && <p className="text-sol text-sm">{aviso}</p>}
            {mensaje && <p className="text-cielo text-sm">{mensaje}</p>}

            <div>
              <h2 className="text-sm text-crema/70 mb-1">Biografía</h2>
              <p className="whitespace-pre-line">
                {usuario.biografia || (
                  <span className="text-crema/60">Todavía no escribiste tu biografía.</span>
                )}
              </p>
            </div>

            {esFan && (
              <div>
                <h2 className="text-sm text-crema/70 mb-1">Canción favorita</h2>
                <p>
                  {usuario.cancion_favorita ? (
                    <>🎵 {usuario.cancion_favorita}</>
                  ) : (
                    <span className="text-crema/60">Todavía no elegiste una canción favorita.</span>
                  )}
                </p>
              </div>
            )}

            {usuario.fecha_alta && (
              <p className="text-xs text-crema/60">
                Miembro desde{" "}
                {new Date(usuario.fecha_alta).toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            {usuario.rol === "artista" && (
              <Link
                to="/eventos/nuevo"
                className="block w-full text-center py-2 rounded-full border border-purple-500 text-purple-300 hover:bg-sol text-tinta hover:text-crema font-bold transition"
              >
                Crear evento
              </Link>
            )}

            <button
              onClick={empezarEdicion}
              className="w-full py-2 rounded-full bg-fucsia hover:bg-chicle font-bold"
            >
              Editar perfil
            </button>
          </section>
        )}
      </main>
    </>
  );
}