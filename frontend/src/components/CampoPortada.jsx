import { useEffect, useMemo, useState } from "react";
import ImagenEvento, { PortadaGenerada } from "./ImagenEvento";
import { labelClase } from "../utils/formularios";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

// evento: el evento que se está editando (en uno nuevo no se pasa)
// onChange({ archivo, quitar }): le avisa al formulario qué hacer con la imagen al guardar
export default function CampoPortada({ evento, onChange }) {
  const [archivo, setArchivo] = useState(null);
  const [quitar, setQuitar] = useState(false);
  const [error, setError] = useState("");

  // Vista previa de la imagen elegida (se libera la memoria al cambiarla o al salir)
  const vistaPrevia = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);
  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    },
    [vistaPrevia],
  );

  const tieneGuardada = Boolean(evento?.imagen_url) && !quitar;

  function actualizar(nuevoArchivo, nuevoQuitar) {
    setArchivo(nuevoArchivo);
    setQuitar(nuevoQuitar);
    onChange?.({ archivo: nuevoArchivo, quitar: nuevoQuitar });
  }

  function elegir(e) {
    const elegido = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!elegido) return;
    if (!TIPOS.includes(elegido.type)) {
      setError("La imagen tiene que ser JPG, PNG o WebP");
      return;
    }
    if (elegido.size > MAX_BYTES) {
      setError("La imagen no puede superar los 2 MB");
      return;
    }
    setError("");
    actualizar(elegido, false);
  }

  function quitarImagen() {
    setError("");
    // Si había elegido un archivo nuevo, solo se descarta; si no, se pide quitar la que ya estaba guardada
    actualizar(null, !archivo && tieneGuardada);
  }

  return (
    <div className="space-y-3">
      <span className={labelClase}>Imagen del evento</span>

      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl border border-crema/20 bg-tinta">
        {vistaPrevia ? (
          <img src={vistaPrevia} alt="Vista previa de la imagen" className="w-full h-full object-cover" />
        ) : evento && quitar ? (
          <PortadaGenerada id={evento.id_evento} className="w-full h-full" />
        ) : evento ? (
          <ImagenEvento evento={evento} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center text-sm text-crema/50 px-6">
            Sin imagen: se va a usar una portada automática
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="cursor-pointer px-4 py-2 rounded-full bg-fucsia hover:bg-chicle text-tinta text-sm font-bold transition focus-within:ring-2 focus-within:ring-cielo">
          {archivo || tieneGuardada ? "Cambiar imagen" : "Elegir imagen"}
          <input type="file" accept={TIPOS.join(",")} onChange={elegir} className="sr-only" />
        </label>

        {(archivo || tieneGuardada) && (
          <button
            type="button"
            onClick={quitarImagen}
            className="px-4 py-2 rounded-full border border-crema/30 text-crema/80 hover:border-mandarina hover:text-mandarina text-sm font-bold transition"
          >
            Quitar imagen
          </button>
        )}
      </div>

      <p className="text-xs text-crema/50">
        JPG, PNG o WebP de hasta 2 MB. Si no subís una, el evento muestra una portada automática.
      </p>
      {error && (
        <p className="text-mandarina text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}