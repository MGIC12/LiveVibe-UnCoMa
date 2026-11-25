import { useId, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { urlYouTube } from "../utils/musica";
import { inputClase } from "../utils/formularios";

// cancion: la canción actual. esMiPerfil: si es el dueño del perfil, puede editarla.
// onGuardada(nuevaCancion): le avisa a la página que cambió.
export default function CancionFavorita({ cancion, esMiPerfil, onGuardada }) {
  const { token } = useAuth();
  const idCampo = useId();

  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function abrirEditor() {
    setValor(cancion ?? "");
    setError("");
    setEditando(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(`${API}/api/perfil/cancion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancion_favorita: valor }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la canción");

      onGuardada(data.cancion_favorita);
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="bg-crema/5 border border-crema/20 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-xs font-bold text-cielo uppercase tracking-wider">
          Canción favorita
        </h2>
        {esMiPerfil && !editando && (
          <button
            type="button"
            onClick={abrirEditor}
            className="text-sm font-bold text-cielo hover:text-crema transition"
          >
            {cancion ? "Editar" : "Elegir canción"}
          </button>
        )}
      </div>

      {editando ? (
        <form onSubmit={guardar} className="space-y-3">
          <label htmlFor={idCampo} className="sr-only">
            Canción favorita
          </label>
          <input
            id={idCampo}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            maxLength={150}
            placeholder="Título - Artista"
            className={inputClase}
          />
          <p className="text-xs text-crema/50">Si la dejás vacía, se quita de tu perfil.</p>

          {error && (
            <p className="text-mandarina text-sm" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={guardando}
              className="px-4 py-2 rounded-full border border-crema/30 text-crema/80 hover:border-crema text-sm font-bold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 rounded-full bg-fucsia hover:bg-chicle text-tinta text-sm font-bold disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : cancion ? (
        <a
          href={urlYouTube(cancion)}
          target="_blank"
          rel="noopener noreferrer"
          title="Buscar en YouTube"
          className="flex items-start gap-3 group"
        >
          <span
            aria-hidden="true"
            className="pt-0.5 text-crema/60 group-hover:text-fucsia transition"
          >
            🎵
          </span>
          <span className="min-w-0 text-crema font-medium group-hover:text-cielo transition">
            {cancion}
            <span className="sr-only"> (buscar en YouTube, se abre en una pestaña nueva)</span>
          </span>
        </a>
      ) : (
        <span className="text-crema/40 italic">Todavía no eligió una canción favorita.</span>
      )}
    </section>
  );
}