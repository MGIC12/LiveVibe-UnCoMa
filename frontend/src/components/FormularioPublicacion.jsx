import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API } from "../utils/api";
import { TIPOS_IMAGEN, MAX_BYTES_IMAGEN } from "../utils/formularios";

const MAX_PUBLICACION = 500;

export default function FormularioPublicacion({
  onPublicada,
  placeholder = "¿Qué estás escuchando? Compartí algo con la comunidad...",
}) {
  const { token } = useAuth();
  const inputRef = useRef(null);

  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState(null); // { archivo, previa }
  const [error, setError] = useState("");
  const [publicando, setPublicando] = useState(false);

  function elegirImagen(e) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      return setError("Elegí una imagen JPG, PNG o WebP");
    }
    if (archivo.size > MAX_BYTES_IMAGEN) {
      return setError("La imagen no puede superar los 2 MB");
    }

    setError("");
    const lector = new FileReader();
    lector.onload = () => setImagen({ archivo, previa: lector.result });
    lector.readAsDataURL(archivo);
  }

  async function publicar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setError("");
    setPublicando(true);
    try {
      // Con una imagen de por medio, los datos viajan como formulario (no como JSON)
      const datos = new FormData();
      datos.append("contenido", texto);
      if (imagen) datos.append("imagen", imagen.archivo);

      const res = await fetch(`${API}/api/publicaciones`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // sin Content-Type: lo completa el navegador
        body: datos,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo publicar");

      setTexto("");
      setImagen(null);
      onPublicada(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublicando(false);
    }
  }

  return (
    <form
      onSubmit={publicar}
      className="bg-crema/5 border border-crema/20 rounded-2xl p-5 space-y-3"
    >
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        maxLength={MAX_PUBLICACION}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-crema/10 border border-crema/25 text-crema placeholder-crema/60 focus:outline-none focus:ring-2 focus:ring-cielo text-sm resize-none"
      />

      {imagen && (
        <div className="relative w-fit">
          <img
            src={imagen.previa}
            alt="Vista previa de la imagen que vas a publicar"
            className="max-h-56 rounded-xl border border-crema/20"
          />
          <button
            type="button"
            onClick={() => setImagen(null)}
            aria-label="Quitar la imagen"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-tinta/80 text-crema hover:bg-mandarina hover:text-tinta font-bold transition"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={elegirImagen}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            className="px-4 py-1.5 rounded-full border border-crema/30 text-crema/80 hover:border-cielo hover:text-cielo text-sm font-bold transition"
          >
            📷 {imagen ? "Cambiar foto" : "Agregar foto"}
          </button>
          <span className="text-xs text-crema/50">
            {texto.length}/{MAX_PUBLICACION}
          </span>
        </div>

        <button
          type="submit"
          disabled={publicando || !texto.trim()}
          className="px-6 py-2 rounded-full bg-fucsia hover:bg-chicle text-tinta text-sm font-bold disabled:opacity-50 transition"
        >
          {publicando ? "Publicando..." : "Publicar"}
        </button>
      </div>

      {error && (
        <p className="text-mandarina text-sm" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}