import { urlImagen } from "../utils/api";

// Foto de un artículo; si todavía no tiene, un recuadro de color con un ícono.
export default function ImagenArticulo({ url, descripcion, clases = "" }) {
  const src = urlImagen(url);
  return src ? (
    <img
      src={src}
      alt={descripcion || ""}
      loading="lazy"
      className={`object-cover ${clases}`}
    />
  ) : (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-gradient-to-br from-fucsia/40 to-cielo/30 text-4xl ${clases}`}
    >
      🛍️
    </div>
  );
}
