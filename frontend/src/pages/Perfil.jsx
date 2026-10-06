import { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../../context/AuthContext";

const inputClase =
  "mt-1 w-full px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500";

export default function Perfil() {
  const { usuario, editarPerfil } = useAuth();
  const esFan = usuario.rol === "fan";

  const [editando, setEditando] = useState(false);

  // Borrador: lo que se está escribiendo en el formulario
  const [biografia, setBiografia] = useState("");
  const [cancion, setCancion] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function empezarEdicion() {
    // Copia los datos guardados al borrador
    setBiografia(usuario.biografia ?? "");
    setCancion(usuario.cancion_favorita ?? "");
    setMensaje("");
    setError("");
    setEditando(true);
  }

  function cancelar() {
    // El borrador se descarta; los datos guardados no cambiaron
    setError("");
    setEditando(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await editarPerfil({ biografia, cancion_favorita: cancion });
      setMensaje("Perfil actualizado correctamente");
      setEditando(false); // vuelve al modo vista
    } catch (err) {
      setError(err.message); // se queda en edición para poder corregir
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-12 text-white space-y-6">
        {/* Cabecera: siempre visible */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <h1 className="text-2xl font-bold">{usuario.nombre_usuario}</h1>
            <p className="text-gray-400 text-sm">{usuario.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple-600 text-xs capitalize">
              {usuario.rol}
            </span>
          </div>
        </section>

        {editando ? (
          /* ---------- MODO EDICIÓN ---------- */
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5"
          >
            <h2 className="text-xl font-semibold">Editar mi perfil</h2>

            <label className="block text-sm text-gray-300">
              Biografía
              <textarea
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                rows={4}
                maxLength={500}
                className="mt-1 w-full px-4 py-2 rounded-2xl bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-xs text-gray-500">{biografia.length}/500</span>
            </label>

            <label className="block text-sm text-gray-300">
              Canción favorita
              <input
                value={cancion}
                onChange={(e) => setCancion(e.target.value)}
                maxLength={150}
                className={inputClase}
              />
            </label>

            {error && (
              <p className="text-red-400 text-sm" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="flex-1 py-2 rounded-full border border-gray-600 text-gray-300 hover:border-purple-500 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-2 rounded-full bg-purple-600 hover:bg-purple-500 font-bold disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        ) : (
          /* ---------- MODO VISTA ---------- */
          <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5">
            {mensaje && <p className="text-green-400 text-sm">{mensaje}</p>}

            <div>
              <h2 className="text-sm text-gray-400 mb-1">Biografía</h2>
              <p className="whitespace-pre-line">
                {usuario.biografia || (
                  <span className="text-gray-500">Todavía no escribiste tu biografía.</span>
                )}
              </p>
            </div>

            {esFan && (
              <div>
                <h2 className="text-sm text-gray-400 mb-1">Canción favorita</h2>
                <p>
                  {usuario.cancion_favorita ? (
                    <>🎵 {usuario.cancion_favorita}</>
                  ) : (
                    <span className="text-gray-500">Todavía no elegiste una canción favorita.</span>
                  )}
                </p>
              </div>
            )}

            {usuario.fecha_alta && (
              <p className="text-xs text-gray-500">
                Miembro desde{" "}
                {new Date(usuario.fecha_alta).toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            {esFan && (
              <button
                onClick={empezarEdicion}
                className="w-full py-2 rounded-full bg-purple-600 hover:bg-purple-500 font-bold"
              >
                Editar perfil
              </button>
            )}
          </section>
        )}
      </main>
    </>
  );
}